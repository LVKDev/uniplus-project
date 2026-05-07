const axios = require("axios");
const { connectRedis } = require("../lib/redis");

const baseURL = process.env.UNIPLUS_BASE_URL;
const serverURL =
  process.env.UNIPLUS_SERVER_URL ||
  (baseURL ? baseURL.replace(/\/public-api\/?$/, "") : null);
const TOKEN_CACHE_KEY = "uniplus:token";
const DEFAULT_TOKEN_TTL_SECONDS = 3600;
const TOKEN_REFRESH_WINDOW_SECONDS = 60;

if (!baseURL) {
  throw new Error("UNIPLUS_BASE_URL e obrigatorio.");
}
if (!serverURL) {
  throw new Error("UNIPLUS_SERVER_URL e obrigatorio.");
}

const uniplusClient = axios.create({
  baseURL,
  timeout: 15000,
});

const authClient = axios.create({
  baseURL: serverURL,
  timeout: 15000,
});

let refreshingToken = null;

function normalizeBasicToken(raw) {
  if (!raw) return null;
  return raw.startsWith("Basic ") ? raw.slice(6) : raw;
}

function resolveTenant() {
  return process.env.UNIPLUS_TENANT || process.env.UNIPLUS_ACCOUNT;
}

function getTokenTtlSeconds(expiresIn) {
  const expiresInSeconds = Number(expiresIn) || DEFAULT_TOKEN_TTL_SECONDS;
  return Math.max(1, expiresInSeconds - TOKEN_REFRESH_WINDOW_SECONDS);
}

async function readCachedToken() {
  const redis = await connectRedis();
  return redis.get(TOKEN_CACHE_KEY);
}

async function writeCachedToken(token, expiresIn) {
  const ttlSeconds = getTokenTtlSeconds(expiresIn);
  const redis = await connectRedis();
  await redis.set(TOKEN_CACHE_KEY, token, "EX", ttlSeconds);
}

async function clearCachedToken() {
  const redis = await connectRedis();
  await redis.del(TOKEN_CACHE_KEY);
}

async function fetchAccessToken() {
  const authBasic = normalizeBasicToken(process.env.UNIPLUS_AUTH_BASIC);
  if (!authBasic) {
    throw new Error("UNIPLUS_AUTH_BASIC e obrigatorio para gerar token.");
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "public-api",
  }).toString();

  const response = await authClient.post("/oauth/token", body, {
    headers: {
      Authorization: `Basic ${authBasic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  const { access_token: accessToken, expires_in: expiresIn } = response.data || {};
  if (!accessToken) {
    throw new Error("Resposta de token invalida da UniPlus.");
  }

  await writeCachedToken(accessToken, expiresIn);
  return accessToken;
}

async function getAccessToken() {
  if (process.env.UNIPLUS_TOKEN) {
    return process.env.UNIPLUS_TOKEN;
  }

  const cachedToken = await readCachedToken();
  if (cachedToken) {
    return cachedToken;
  }

  if (!refreshingToken) {
    refreshingToken = fetchAccessToken().finally(() => {
      refreshingToken = null;
    });
  }

  return refreshingToken;
}

uniplusClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  const clientId = process.env.UNIPLUS_CLIENT_ID;
  const clientSecret = process.env.UNIPLUS_CLIENT_SECRET;
  const tenant = resolveTenant();
  const accessKey = process.env.UNIPLUS_ACCESS_KEY;

  config.headers = config.headers || {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (clientId) {
    config.headers["X-Client-Id"] = clientId;
  }

  if (clientSecret) {
    config.headers["X-Client-Secret"] = clientSecret;
  }

  if (tenant) {
    config.headers["X-Tenant"] = tenant;
  }

  if (accessKey) {
    config.headers["X-Access-Key"] = accessKey;
  }

  return config;
});

uniplusClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    if (status === 401 && originalRequest && !originalRequest.__isRetryRequest) {
      originalRequest.__isRetryRequest = true;
      await clearCachedToken();
      const token = await fetchAccessToken();
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${token}`;
      return uniplusClient.request(originalRequest);
    }
    let message = "Erro ao comunicar com a API do UniPlus.";

    if (status === 401) {
      message = "Nao autorizado (401). Verifique o token da UniPlus.";
    } else if (status === 403) {
      message = "Acesso negado (403). Verifique as credenciais.";
    } else if (status >= 500) {
      message = "Erro interno no servidor da UniPlus.";
    }

    const details = error.response?.data || error.message;
    const normalized = new Error(message);
    normalized.status = status || 500;
    normalized.details = details;
    throw normalized;
  }
);

module.exports = uniplusClient;
module.exports.getAccessToken = getAccessToken;
module.exports.clearCachedToken = clearCachedToken;
module.exports.TOKEN_CACHE_KEY = TOKEN_CACHE_KEY;
