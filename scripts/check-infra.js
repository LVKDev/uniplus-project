require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const {
  createRedisClient,
} = require("../src/lib/redis");

function maskUrl(value) {
  if (!value) return "(nao configurado)";

  try {
    const url = new URL(value);
    if (url.username) url.username = "***";
    if (url.password) url.password = "***";
    return url.toString();
  } catch (_) {
    return "(valor invalido)";
  }
}

async function checkPostgres(label, databaseUrl, variableName) {
  if (!databaseUrl) {
    console.log(`[skip] PostgreSQL ${label}: ${variableName} nao configurada`);
    return { configured: false, ok: false };
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log(`[ok] PostgreSQL ${label}: ${maskUrl(databaseUrl)}`);
    return { configured: true, ok: true };
  } catch (error) {
    throw new Error(`PostgreSQL ${label}: ${error.message.trim()}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function checkRedis(label, redisUrl, variableName) {
  if (!redisUrl) {
    console.log(`[skip] Redis ${label}: ${variableName} nao configurada`);
    return { configured: false, ok: false };
  }

  const redis = createRedisClient({
    redisUrl,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  });

  try {
    const response = await redis.ping();
    console.log(`[ok] Redis ${label}: ${maskUrl(redisUrl)} (${response})`);
    return { configured: true, ok: true };
  } catch (error) {
    throw new Error(`Redis ${label}: ${error.message.trim()}`);
  } finally {
    redis.disconnect();
  }
}

async function main() {
  const checks = [];

  const runners = [
    () => checkPostgres("principal", process.env.DATABASE_URL, "DATABASE_URL"),
    () =>
      checkPostgres(
        "interno",
        process.env.DATABASE_INTERNAL_URL,
        "DATABASE_INTERNAL_URL",
      ),
    () => checkRedis("principal", process.env.REDIS_URL, "REDIS_URL"),
    () =>
      checkRedis("interno", process.env.REDIS_INTERNAL_URL, "REDIS_INTERNAL_URL"),
  ];

  for (const run of runners) {
    try {
      checks.push(await run());
    } catch (error) {
      console.error(`[fail] ${error.message}`);
      checks.push({ configured: true, ok: false });
    }
  }

  if (!checks.some((check) => check.configured)) {
    throw new Error("Nenhuma conexao de infraestrutura foi validada.");
  }

  if (checks.some((check) => check.configured && !check.ok)) {
    throw new Error("Uma ou mais conexoes configuradas falharam.");
  }
}

main().catch((error) => {
  console.error(`[erro] ${error.message}`);
  process.exit(1);
});
