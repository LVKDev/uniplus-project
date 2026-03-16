/**
 * Middleware de Rate Limiting
 * Protege contra brute force attacks e abuso de API
 */

const rateLimit = require("express-rate-limit");

/**
 * Rate Limiter para Login
 * Máximo 5 tentativas por IP em 15 minutos
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  standardHeaders: true, // Retorna `RateLimit-*` headers
  legacyHeaders: false, // Desativa `X-RateLimit-*` headers
  keyGenerator: (req, res) => {
    // Usar IP do cliente (conta com proxy reverso)
    return req.ip || req.connection.remoteAddress;
  },
  skip: (req, res) => {
    // Não limitar em ambiente de teste
    return process.env.NODE_ENV === "test";
  },
});

/**
 * Rate Limiter para API geral
 * Máximo 100 requisições por IP em 1 minuto
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 100, // 100 requisições
  message: "Muitas requisições. Tente novamente em 1 minuto.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.ip || req.connection.remoteAddress;
  },
  skip: (req, res) => {
    return process.env.NODE_ENV === "test";
  },
});

/**
 * Rate Limiter para operações sensíveis
 * Máximo 20 operações (POST, PATCH, DELETE) por minuto por usuário
 */
const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 20, // 20 operações
  message: "Muitas operações de escrita. Tente novamente em 1 minuto.",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // Se autenticado, usar userId; senão usar IP
    return req.user?.id || req.ip || req.connection.remoteAddress;
  },
  skip: (req, res) => {
    return process.env.NODE_ENV === "test";
  },
  // Apenas conta requisições de POST, PATCH, DELETE
  onLimitReached: (req, res, options) => {
    console.warn(
      `⚠️ Rate limit atingido para ${req.method} ${req.path} - ${req.ip}`,
    );
  },
});

module.exports = {
  loginLimiter,
  apiLimiter,
  writeLimiter,
};
