const crypto = require("crypto");
const { connectRedis } = require("../lib/redis");

const SESSION_TTL_SECONDS = 30 * 60;
const SESSION_PREFIX = "basic-auth:session:";
const testSessionCache = new Map();

function unauthorized(res, message = "Autenticacao requerida") {
  res.set("WWW-Authenticate", 'Basic realm="Uniplus API"');
  return res.status(401).json({
    success: false,
    error: message,
  });
}

function parseBasicAuthorization(header) {
  if (!header || typeof header !== "string") {
    return null;
  }

  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) {
    return null;
  }

  const decoded = Buffer.from(encoded, "base64").toString("utf8");
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) {
    return null;
  }

  return {
    username: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1),
    raw: decoded,
  };
}

function hashCredentials(rawCredentials) {
  return crypto.createHash("sha256").update(rawCredentials).digest("hex");
}

function timingSafeEqualString(a, b) {
  const left = Buffer.from(String(a || ""));
  const right = Buffer.from(String(b || ""));

  if (left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

function getConfiguredCredentials() {
  const username = process.env.API_USER;
  const password = process.env.API_PASS;

  if (!username || !password) {
    const error = new Error("API_USER e API_PASS devem ser configurados.");
    error.statusCode = 500;
    throw error;
  }

  return { username, password };
}

function buildAuthenticatedUser(username) {
  const unitId = process.env.API_UNIT_ID || process.env.UNIPLUS_UNIT_ID || null;

  return {
    id: username,
    username,
    role: "BASIC_AUTH",
    unit_id: unitId,
    tenantId: unitId,
    permissions: ["*"],
  };
}

async function getSession(sessionKey) {
  if (process.env.NODE_ENV === "test") {
    const cached = testSessionCache.get(sessionKey);
    if (!cached || cached.expiresAt <= Date.now()) {
      testSessionCache.delete(sessionKey);
      return null;
    }
    return cached.value;
  }

  const redis = await connectRedis();
  const cached = await redis.get(sessionKey);
  return cached ? JSON.parse(cached) : null;
}

async function setSession(sessionKey, value) {
  if (process.env.NODE_ENV === "test") {
    testSessionCache.set(sessionKey, {
      value,
      expiresAt: Date.now() + SESSION_TTL_SECONDS * 1000,
    });
    return;
  }

  const redis = await connectRedis();
  await redis.set(sessionKey, JSON.stringify(value), "EX", SESSION_TTL_SECONDS);
}

async function basicAuth(req, res, next) {
  try {
    const credentials = parseBasicAuthorization(req.headers.authorization);
    if (!credentials) {
      return unauthorized(res);
    }

    const sessionKey = `${SESSION_PREFIX}${hashCredentials(credentials.raw)}`;
    const cachedSession = await getSession(sessionKey);
    if (cachedSession?.valid) {
      req.user = buildAuthenticatedUser(credentials.username);
      req.unit_id = req.user.unit_id;
      req.auth = { type: "basic", cached: true, sessionKey };
      return next();
    }

    const configured = getConfiguredCredentials();
    const validUsername = timingSafeEqualString(
      credentials.username,
      configured.username,
    );
    const validPassword = timingSafeEqualString(
      credentials.password,
      configured.password,
    );

    if (!validUsername || !validPassword) {
      return unauthorized(res, "Credenciais invalidas");
    }

    await setSession(sessionKey, {
      valid: true,
      username: credentials.username,
    });

    req.user = buildAuthenticatedUser(credentials.username);
    req.unit_id = req.user.unit_id;
    req.auth = { type: "basic", cached: false, sessionKey };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  SESSION_TTL_SECONDS,
  basicAuth,
  hashCredentials,
  parseBasicAuthorization,
};
