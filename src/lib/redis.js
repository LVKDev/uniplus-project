const Redis = require("ioredis");

let client = null;
let listenersAttached = false;

function getRedisUrl() {
  return process.env.REDIS_URL || process.env.REDIS_INTERNAL_URL;
}

function createRedisClient(options = {}) {
  const { redisUrl: explicitRedisUrl, ...redisOptions } = options;
  const redisUrl = explicitRedisUrl || getRedisUrl();

  if (!redisUrl) {
    throw new Error("REDIS_URL ou REDIS_INTERNAL_URL deve ser configurada.");
  }

  return new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    connectTimeout: 10_000,
    retryStrategy(times) {
      return Math.min(times * 200, 2_000);
    },
    reconnectOnError(error) {
      const message = error?.message || "";
      return message.includes("READONLY") || message.includes("ETIMEDOUT");
    },
    ...redisOptions,
  });
}

function attachListeners(redisClient) {
  if (listenersAttached || process.env.NODE_ENV === "test") {
    return;
  }

  redisClient.on("connect", () => {
    console.log("[redis] conectado");
  });

  redisClient.on("ready", () => {
    console.log("[redis] pronto");
  });

  redisClient.on("reconnecting", () => {
    console.warn("[redis] reconectando");
  });

  redisClient.on("error", (error) => {
    console.error("[redis] erro:", error.message);
  });

  listenersAttached = true;
}

function getRedisClient(options = {}) {
  if (!client) {
    client = createRedisClient(options);
    attachListeners(client);
  }

  return client;
}

async function connectRedis() {
  const redisClient = getRedisClient();

  if (redisClient.status === "wait" || redisClient.status === "end") {
    await redisClient.connect();
  }

  return redisClient;
}

async function pingRedis() {
  const redisClient = await connectRedis();
  return redisClient.ping();
}

async function disconnectRedis() {
  if (!client) {
    return;
  }

  const redisClient = client;
  client = null;
  listenersAttached = false;

  if (redisClient.status !== "end") {
    redisClient.disconnect();
  }
}

module.exports = {
  connectRedis,
  createRedisClient,
  disconnectRedis,
  getRedisClient,
  pingRedis,
};
