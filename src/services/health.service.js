const { PrismaClient } = require("@prisma/client");
const { pingRedis } = require("../lib/redis");
const uniplusClient = require("../config/uniplus");

async function checkRedis() {
  await pingRedis();
  return "ok";
}

async function checkPostgres() {
  const prisma = new PrismaClient();

  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } finally {
    await prisma.$disconnect();
  }
}

async function checkUniplus() {
  await uniplusClient.get("/v1/produtos", {
    params: {
      limit: 1,
      offset: 0,
    },
  });
  return "ok";
}

async function settleCheck(check) {
  try {
    return await check();
  } catch (_) {
    return "error";
  }
}

async function getHealthStatus() {
  const [redis, postgres, uniplus] = await Promise.all([
    settleCheck(checkRedis),
    settleCheck(checkPostgres),
    settleCheck(checkUniplus),
  ]);
  const status =
    redis === "ok" && postgres === "ok" && uniplus === "ok" ? "ok" : "error";

  return {
    status,
    redis,
    postgres,
    uniplus,
    uptime: process.uptime(),
  };
}

module.exports = {
  checkPostgres,
  checkRedis,
  checkUniplus,
  getHealthStatus,
};
