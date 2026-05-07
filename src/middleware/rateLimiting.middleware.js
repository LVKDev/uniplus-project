/**
 * Middleware de Rate Limiting
 * Protege contra abuso de API usando contadores distribuidos no Redis.
 */

const { rateLimit, ipKeyGenerator } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { connectRedis } = require("../lib/redis");

function createRedisRateLimitStore(prefix) {
  if (process.env.NODE_ENV === "test") {
    return undefined;
  }

  return new RedisStore({
    prefix,
    sendCommand: async (command, ...args) => {
      const redis = await connectRedis();
      return redis.call(command, ...args);
    },
  });
}

function createApiLimiter(options = {}) {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    store: createRedisRateLimitStore("rl:api:"),
    message: "Muitas requisições. Tente novamente em 1 minuto.",
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    skip: () => process.env.NODE_ENV === "test",
    ...options,
  });
}

const apiLimiter = createApiLimiter();

module.exports = {
  apiLimiter,
  createApiLimiter,
  createRedisRateLimitStore,
};
