// Authentication middleware for API protection
// Supports: Basic Auth (optional), Bearer Token, and no auth if disabled

const logger = {
  info: (msg) => console.log(`[AUTH] ℹ️  ${msg}`),
  warn: (msg) => console.warn(`[AUTH] ⚠️  ${msg}`),
  error: (msg) => console.error(`[AUTH] ❌ ${msg}`),
};

/**
 * Decode Basic Auth header
 * @param {string} token - Base64 encoded 'user:password'
 * @returns {{user: string, pass: string} | null}
 */
function decodeBasicAuth(token) {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex === -1) {
      return null;
    }
    return {
      user: decoded.slice(0, separatorIndex),
      pass: decoded.slice(separatorIndex + 1),
    };
  } catch (error) {
    logger.error(`Failed to decode Basic Auth: ${error.message}`);
    return null;
  }
}

/**
 * Express middleware for authentication
 * Supports:
 * - Basic Auth (if BASIC_AUTH_USER and BASIC_AUTH_PASS are set)
 * - Bearer Token (if UNIPLUS_AUTH_TOKEN is set)
 * - No auth (if disabled)
 */
function authenticate(req, res, next) {
  const basicAuthUser = process.env.BASIC_AUTH_USER;
  const basicAuthPass = process.env.BASIC_AUTH_PASS;
  const bearerToken = process.env.API_BEARER_TOKEN;

  // If no auth is configured, allow all requests
  if (!basicAuthUser && !basicAuthPass && !bearerToken) {
    logger.info("Authentication disabled - all requests allowed");
    return next();
  }

  const authHeader = req.headers.authorization || "";

  // Try Basic Auth
  if (basicAuthUser && basicAuthPass && authHeader.startsWith("Basic ")) {
    const token = authHeader.slice(6); // Remove "Basic " prefix
    const credentials = decodeBasicAuth(token);

    if (!credentials) {
      logger.warn("Invalid Basic Auth format");
      res.set("WWW-Authenticate", 'Basic realm="UniPlus API"');
      return res.status(401).json({
        success: false,
        error: "Autenticacao invalida.",
      });
    }

    if (
      credentials.user === basicAuthUser &&
      credentials.pass === basicAuthPass
    ) {
      logger.info(`✅ Basic Auth successful for user: ${basicAuthUser}`);
      return next();
    }

    logger.warn(`❌ Basic Auth failed for user: ${credentials.user}`);
    res.set("WWW-Authenticate", 'Basic realm="UniPlus API"');
    return res.status(401).json({
      success: false,
      error: "Credenciais invalidas.",
    });
  }

  // Try Bearer Token
  if (bearerToken && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7); // Remove "Bearer " prefix

    if (token === bearerToken) {
      logger.info("✅ Bearer Token authentication successful");
      return next();
    }

    logger.warn("❌ Bearer Token authentication failed");
    return res.status(401).json({
      success: false,
      error: "Token invalido.",
    });
  }

  // If auth is configured but header is missing/invalid
  if (basicAuthUser || basicAuthPass || bearerToken) {
    const supportedMethods = [];
    if (basicAuthUser || basicAuthPass) supportedMethods.push("Basic Auth");
    if (bearerToken) supportedMethods.push("Bearer Token");

    logger.warn(
      `Authentication required but not provided. Supported: ${supportedMethods.join(", ")}`,
    );
    res.set("WWW-Authenticate", 'Basic realm="UniPlus API"');
    return res.status(401).json({
      success: false,
      error: "Autenticacao requerida.",
      hint: `Use one of: ${supportedMethods.join(", ")}`,
    });
  }

  return next();
}

module.exports = {
  authenticate,
  decodeBasicAuth,
};
