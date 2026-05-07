const crypto = require("crypto");
const { connectRedis } = require("../lib/redis");

const CACHE_PREFIX = "response-cache";
const INDEX_PREFIX = `${CACHE_PREFIX}:index`;

function getRequestPath(req) {
  return `${req.baseUrl || ""}${req.path || ""}` || req.originalUrl || "";
}

function getSortedQuery(req) {
  const entries = Object.entries(req.query || {}).flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return value.map((item) => [key, String(item)]);
    }

    return [[key, value === undefined ? "" : String(value)]];
  });

  entries.sort(([leftKey, leftValue], [rightKey, rightValue]) => {
    const keyCompare = leftKey.localeCompare(rightKey);
    return keyCompare || leftValue.localeCompare(rightValue);
  });

  return new URLSearchParams(entries).toString();
}

function getAuthScope(req) {
  const user = req.user || {};

  return [
    req.auth?.type || "anonymous",
    user.id || user.username || "anonymous",
    user.role || "",
    user.unit_id || req.unit_id || "",
    user.tenantId || user.tenant_id || "",
    req.apiToken?.id || user.api_token_id || "",
  ].join(":");
}

function inferNamespace(req) {
  const path = getRequestPath(req);
  const parts = path.split("/").filter(Boolean);
  return parts[1] || parts[0] || "default";
}

function buildCacheKey(req) {
  const path = getRequestPath(req);
  const query = getSortedQuery(req);
  const authScope = getAuthScope(req);
  const source = `${req.method}:${authScope}:${path}?${query}`;
  const hash = crypto.createHash("sha1").update(source).digest("hex");

  return `${CACHE_PREFIX}:entry:${hash}`;
}

function getIndexKey(namespace) {
  return `${INDEX_PREFIX}:${namespace}`;
}

async function storeResponse(redis, key, namespace, ttlSeconds, payload) {
  await redis.set(key, JSON.stringify(payload), "EX", ttlSeconds);
  await redis.sadd(getIndexKey(namespace), key);
  await redis.expire(getIndexKey(namespace), ttlSeconds * 2);
}

function cacheRoute(ttlSeconds, namespace) {
  return async function cacheRouteMiddleware(req, res, next) {
    if (req.method !== "GET") {
      return next();
    }

    const cacheNamespace = namespace || inferNamespace(req);
    const cacheKey = buildCacheKey(req);

    try {
      const redis = await connectRedis();
      const cached = await redis.get(cacheKey);

      if (cached) {
        const payload = JSON.parse(cached);
        res.set("X-Cache", "HIT");
        return res.status(payload.statusCode || 200).json(payload.body);
      }

      res.set("X-Cache", "MISS");

      const originalJson = res.json.bind(res);
      res.json = async function cachedJson(body) {
        const statusCode = res.statusCode || 200;

        if (statusCode >= 200 && statusCode < 300) {
          try {
            await storeResponse(redis, cacheKey, cacheNamespace, ttlSeconds, {
              statusCode,
              body,
            });
          } catch (error) {
            console.warn("[cache] falha ao salvar resposta:", error.message);
          }
        }

        return originalJson(body);
      };

      return next();
    } catch (error) {
      res.set("X-Cache", "MISS");
      console.warn("[cache] bypass por falha no Redis:", error.message);
      return next();
    }
  };
}

function invalidateCache(namespace) {
  return async function invalidateCacheMiddleware(req, res, next) {
    const cacheNamespace = namespace || inferNamespace(req);
    const originalJson = res.json.bind(res);

    res.json = async function invalidatingJson(body) {
      const statusCode = res.statusCode || 200;

      if (statusCode >= 200 && statusCode < 300) {
        try {
          const redis = await connectRedis();
          const indexKey = getIndexKey(cacheNamespace);
          const keys = await redis.smembers(indexKey);

          if (keys.length > 0) {
            await redis.del(...keys, indexKey);
          } else {
            await redis.del(indexKey);
          }
        } catch (error) {
          console.warn("[cache] falha ao invalidar cache:", error.message);
        }
      }

      return originalJson(body);
    };

    return next();
  };
}

module.exports = {
  buildCacheKey,
  cacheRoute,
  getAuthScope,
  invalidateCache,
};
