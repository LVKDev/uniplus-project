require("dotenv").config();

function requireEnv(name) {
  if (!process.env[name]) {
    throw new Error(`${name} deve estar configurada.`);
  }

  return process.env[name];
}

function configureLocalDockerInfra() {
  if (process.env.REF8_USE_LOCAL_DOCKER !== "true") {
    return;
  }

  const user = requireEnv("POSTGRES_USER");
  const password = requireEnv("POSTGRES_PASSWORD");
  const database = requireEnv("POSTGRES_DB");

  process.env.DATABASE_URL =
    `postgresql://${user}:${password}@localhost:5432/${database}`;
  process.env.REDIS_URL = "redis://localhost:6379/0";
}

function configureFastAuditFallback() {
  if (
    !process.env.SUPABASE_URL ||
    process.env.SUPABASE_URL === "https://placeholder.supabase.co"
  ) {
    process.env.SUPABASE_URL = "http://127.0.0.1:9";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "ref8-validation-placeholder";
  }
}

function configureValidationAuthFallback() {
  process.env.API_USER = process.env.API_USER || "ref8-validator";
  process.env.API_PASS = process.env.API_PASS || "ref8-validator-pass";
}

configureLocalDockerInfra();
configureFastAuditFallback();
configureValidationAuthFallback();

const request = require("supertest");
const app = require("../src/app");
const {
  connectRedis,
  disconnectRedis,
} = require("../src/lib/redis");
const { TOKEN_CACHE_KEY } = require("../src/config/uniplus");

function basicHeader() {
  const username = requireEnv("API_USER");
  const password = requireEnv("API_PASS");
  const token = Buffer.from(`${username}:${password}`).toString("base64");

  return `Basic ${token}`;
}

function assertStatus(label, response, expectedStatus) {
  if (response.status !== expectedStatus) {
    throw new Error(
      `${label}: esperado HTTP ${expectedStatus}, recebido ${response.status}`,
    );
  }
}

function assertOkResponse(label, response) {
  if (response.status !== 200 || response.body?.success !== true) {
    throw new Error(
      `${label}: esperado HTTP 200 com success=true, recebido ${response.status}`,
    );
  }
}

async function clearRedisPattern(redis, pattern) {
  let cursor = "0";

  do {
    const [nextCursor, keys] = await redis.scan(
      cursor,
      "MATCH",
      pattern,
      "COUNT",
      100,
    );
    cursor = nextCursor;

    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== "0");
}

async function resetValidationKeys() {
  console.log("[ref8] Limpando chaves Redis de validacao");
  const redis = await connectRedis();

  await clearRedisPattern(redis, "rl:api:*");
  await clearRedisPattern(redis, "response-cache:*");
  await clearRedisPattern(redis, "basic-auth:session:*");
  await redis.del(TOKEN_CACHE_KEY);
}

async function validateHealth() {
  console.log("[ref8] Validando /health");
  const response = await request(app).get("/health");

  assertStatus("GET /health", response, 200);
  for (const key of ["redis", "postgres", "uniplus"]) {
    if (response.body?.[key] !== "ok") {
      throw new Error(`GET /health: ${key} retornou ${response.body?.[key]}`);
    }
  }

  console.log("[ok] GET /health completo");
}

async function validateAuth() {
  console.log("[ref8] Validando Basic Auth");
  const missing = await request(app).get("/api/produtos?limit=1&offset=0");
  assertStatus("auth sem credencial", missing, 401);

  const wrong = await request(app)
    .get("/api/produtos?limit=1&offset=0")
    .set(
      "Authorization",
      `Basic ${Buffer.from(`${requireEnv("API_USER")}:senha-errada`).toString(
        "base64",
      )}`,
    );
  assertStatus("auth credencial errada", wrong, 401);

  console.log("[ok] Basic Auth rejeita requests invalidos");
}

async function validateRoute(path) {
  console.log(`[ref8] Validando GET ${path}`);
  const response = await request(app)
    .get(path)
    .set("Authorization", basicHeader());

  assertOkResponse(`GET ${path}`, response);
  console.log(`[ok] GET ${path}`);
}

async function validateCacheAndToken() {
  console.log("[ref8] Validando cache e token UniPlus");
  const path = "/api/produtos?limit=1&offset=0";
  const first = await request(app).get(path).set("Authorization", basicHeader());
  const second = await request(app).get(path).set("Authorization", basicHeader());

  assertOkResponse(`GET ${path} primeira chamada`, first);
  assertOkResponse(`GET ${path} segunda chamada`, second);

  if (first.headers["x-cache"] !== "MISS") {
    throw new Error(`cache primeira chamada: esperado MISS`);
  }
  if (second.headers["x-cache"] !== "HIT") {
    throw new Error(`cache segunda chamada: esperado HIT`);
  }

  const redis = await connectRedis();
  const token = await redis.get(TOKEN_CACHE_KEY);

  if (!process.env.UNIPLUS_TOKEN && !token) {
    throw new Error("token OAuth da UniPlus nao foi salvo no Redis");
  }

  console.log("[ok] Cache Redis retorna X-Cache HIT na segunda chamada");
  console.log("[ok] Token OAuth UniPlus disponivel via Redis/env");
}

async function validateRateLimit() {
  console.log("[ref8] Validando rate limit");
  await resetValidationKeys();

  let lastResponse = null;
  for (let index = 0; index < 101; index += 1) {
    lastResponse = await request(app)
      .get("/api/__missing")
      .set("Authorization", basicHeader());
  }

  assertStatus("rate limiting apos 100 requests", lastResponse, 429);
  console.log("[ok] Rate limiting retorna 429 apos 100 requests");
}

async function main() {
  await resetValidationKeys();
  await validateHealth();
  await validateAuth();
  await validateCacheAndToken();
  await validateRoute("/api/clientes?limit=1&offset=0");
  await validateRoute("/api/pedidos?limit=1&offset=0");
  await validateRoute("/api/entidades?limit=1&offset=0&all=false");
  await validateRoute("/api/ordens-servico?limit=1&offset=0");
  await validateRateLimit();
}

main()
  .catch((error) => {
    console.error(`[erro] ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectRedis();
    process.exit(process.exitCode || 0);
  });
