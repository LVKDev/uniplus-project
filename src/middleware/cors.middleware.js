/**
 * Configuração de CORS (Cross-Origin Resource Sharing)
 * Restringe acesso a domínios autorizados apenas
 */

const cors = require("cors");

function parseAllowedOrigins(value) {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

/**
 * Domínios permitidos para acesso CORS
 * - Producción: crm.uniplus.com.br, portal.uniplus.com.br
 * - Desenvolvimento: localhost:3000
 */
const ALLOWED_ORIGINS = [
  // Produção
  "https://crm.uniplus.com.br",
  "https://portal.uniplus.com.br",
  "https://www.crm.uniplus.com.br",
  "https://www.portal.uniplus.com.br",

  // Staging
  "https://staging-crm.uniplus.com.br",
  "https://staging-portal.uniplus.com.br",

  // Desenvolvimento
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  ...parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS),
];

/**
 * Configuração de CORS personalizada
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir requisições sem origin (requisições do mesmo domínio ou mobile apps)
    if (!origin) {
      return callback(null, true);
    }

    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy: Origin not allowed"));
    }
  },

  // Permitir requisições com credenciais (cookies, authorization headers)
  credentials: true,

  // Métodos HTTP permitidos
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  // Headers permitidos na requisição
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],

  // Headers que podem ser expostos na resposta
  exposedHeaders: [
    "X-Total-Count",
    "X-Page-Count",
    "RateLimit-Limit",
    "RateLimit-Remaining",
    "RateLimit-Reset",
  ],

  // Máximo de tempo para cachear pré-flight OPTIONS request (em segundos)
  maxAge: 86400, // 24 horas
};

/**
 * Middleware de CORS personalizado
 */
const corsMiddleware = cors(corsOptions);

/**
 * Middleware para registrar tentativas de CORS bloqueadas
 */
const corsErrorHandler = (err, req, res, next) => {
  if (err.message && err.message.includes("CORS")) {
    console.warn(`⚠️ CORS bloqueado - Origin: ${req.headers.origin || "none"}`);
    return res.status(403).json({
      success: false,
      error: "CORS policy violation. Origin not allowed.",
    });
  }
  next(err);
};

module.exports = {
  corsMiddleware,
  corsErrorHandler,
  ALLOWED_ORIGINS,
};
