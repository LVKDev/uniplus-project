function setupHealthService({
  redisOk = true,
  postgresOk = true,
  uniplusOk = true,
} = {}) {
  jest.resetModules();

  const disconnect = jest.fn().mockResolvedValue(undefined);
  const queryRaw = jest.fn();
  const pingRedis = jest.fn();
  const uniplusGet = jest.fn();

  if (redisOk) {
    pingRedis.mockResolvedValue("PONG");
  } else {
    pingRedis.mockRejectedValue(new Error("redis down"));
  }

  if (postgresOk) {
    queryRaw.mockResolvedValue([{ result: 1 }]);
  } else {
    queryRaw.mockRejectedValue(new Error("postgres down"));
  }

  if (uniplusOk) {
    uniplusGet.mockResolvedValue({ data: [] });
  } else {
    uniplusGet.mockRejectedValue(new Error("uniplus down"));
  }

  jest.doMock("../src/lib/redis", () => ({
    pingRedis,
  }));

  jest.doMock("../src/config/uniplus", () => ({
    get: uniplusGet,
  }));

  jest.doMock("@prisma/client", () => ({
    PrismaClient: jest.fn(() => ({
      $disconnect: disconnect,
      $queryRaw: queryRaw,
    })),
  }));

  const service = require("../src/services/health.service");

  return {
    disconnect,
    pingRedis,
    queryRaw,
    service,
    uniplusGet,
  };
}

describe("health.service", () => {
  afterEach(() => {
    jest.dontMock("../src/lib/redis");
    jest.dontMock("../src/config/uniplus");
    jest.dontMock("@prisma/client");
  });

  test("retorna ok quando Redis, PostgreSQL e UniPlus respondem", async () => {
    const { disconnect, pingRedis, queryRaw, service, uniplusGet } =
      setupHealthService();

    const health = await service.getHealthStatus();

    expect(health).toMatchObject({
      status: "ok",
      redis: "ok",
      postgres: "ok",
      uniplus: "ok",
    });
    expect(typeof health.uptime).toBe("number");
    expect(pingRedis).toHaveBeenCalledTimes(1);
    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(uniplusGet).toHaveBeenCalledWith("/v1/produtos", {
      params: {
        limit: 1,
        offset: 0,
      },
    });
  });

  test("retorna error por dependencia sem interromper os demais checks", async () => {
    const { service } = setupHealthService({
      postgresOk: false,
      uniplusOk: false,
    });

    const health = await service.getHealthStatus();

    expect(health).toMatchObject({
      status: "error",
      redis: "ok",
      postgres: "error",
      uniplus: "error",
    });
  });
});
