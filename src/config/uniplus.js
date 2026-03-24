const axios = require('axios');

const baseURL = process.env.UNIPLUS_BASE_URL;
const serverURL =
  process.env.UNIPLUS_SERVER_URL ||
  (baseURL ? baseURL.replace(/\/public-api\/?$/, '') : null);

if (!baseURL) {
  // Fail fast so the app does not run without required credentials.
  throw new Error('UNIPLUS_BASE_URL e obrigatorio.');
}
if (!serverURL) {
  throw new Error('UNIPLUS_SERVER_URL e obrigatorio.');
}

// Axios instance configured for UniPlus API access.
const uniplusClient = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'empty',
    'Sec-Fetch-Mode': 'cors',
  }
});

const authClient = axios.create({
  baseURL: serverURL,
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  }
});

let cachedToken = null;
let tokenExpiresAt = 0;
let refreshingToken = null;

function normalizeBasicToken(raw) {
  if (!raw) return null;
  return raw.startsWith('Basic ') ? raw.slice(6) : raw;
}

async function fetchAccessToken() {
  const authBasic = normalizeBasicToken(process.env.UNIPLUS_AUTH_BASIC);
  if (!authBasic) {
    throw new Error('UNIPLUS_AUTH_BASIC e obrigatorio para gerar token.');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'public-api',
  }).toString();

  const response = await authClient.post('/oauth/token', body, {
    headers: {
      Authorization: `Basic ${authBasic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const { access_token: accessToken, expires_in: expiresIn } = response.data || {};
  if (!accessToken) {
    throw new Error('Resposta de token invalida da UniPlus.');
  }

  cachedToken = accessToken;
  const ttlMs = (Number(expiresIn) || 3600) * 1000;
  // Refresh 60 seconds before expiry to avoid clock drift.
  tokenExpiresAt = Date.now() + ttlMs - 60_000;
}

async function getAccessToken() {
  if (process.env.UNIPLUS_TOKEN) {
    return process.env.UNIPLUS_TOKEN;
  }

  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  if (!refreshingToken) {
    refreshingToken = fetchAccessToken().finally(() => {
      refreshingToken = null;
    });
  }

  await refreshingToken;
  return cachedToken;
}

// Attach auth headers on every request.
uniplusClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  const clientId = process.env.UNIPLUS_CLIENT_ID;
  const clientSecret = process.env.UNIPLUS_CLIENT_SECRET;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Some UniPlus tenants require client credentials in headers.
  if (clientId) {
    config.headers['X-Client-Id'] = clientId;
  }

  if (clientSecret) {
    config.headers['X-Client-Secret'] = clientSecret;
  }

  return config;
});

// Normalize HTTP errors to keep callers simple and consistent.
uniplusClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;
    const retryCount = originalRequest?.__retryCount || 0;
    const maxRetries = 2;

    // Retry em caso de 403 com delay
    if (status === 403 && retryCount < maxRetries && originalRequest) {
      originalRequest.__retryCount = retryCount + 1;
      const delayMs = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s
      console.log(`[UniPlus] 403 recebido. Tentativa ${retryCount + 1}/${maxRetries} em ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return uniplusClient.request(originalRequest);
    }

    if (status === 401 && originalRequest && !originalRequest.__isRetryRequest) {
      originalRequest.__isRetryRequest = true;
      cachedToken = null;
      tokenExpiresAt = 0;
      await fetchAccessToken();
      originalRequest.headers.Authorization = `Bearer ${cachedToken}`;
      return uniplusClient.request(originalRequest);
    }
    let message = 'Erro ao comunicar com a API do UniPlus.';

    if (status === 401) {
      message = 'Nao autorizado (401). Verifique o token da UniPlus.';
    } else if (status === 403) {
      message = 'Acesso negado (403). após múltiplas tentativas. Verifique as credenciais e firewall.';
    } else if (status >= 500) {
      message = 'Erro interno no servidor da UniPlus.';
    }

    const details = error.response?.data || error.message;
    const normalized = new Error(message);
    normalized.status = status || 500;
    normalized.details = details;
    throw normalized;
  }
);

module.exports = uniplusClient;
