function setupClient({
  cachedToken = null,
  tokenResponse = { access_token: "new-token", expires_in: 120 },
} = {}) {
  jest.resetModules();

  process.env.UNIPLUS_BASE_URL = "https://uniplus.test/public-api";
  process.env.UNIPLUS_SERVER_URL = "https://uniplus.test";
  process.env.UNIPLUS_AUTH_BASIC = Buffer.from("client:secret").toString("base64");
  delete process.env.UNIPLUS_TOKEN;

  let requestHandler = null;
  let responseErrorHandler = null;

  const redis = {
    get: jest.fn().mockResolvedValue(cachedToken),
    set: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
  };

  const uniplusAxios = {
    interceptors: {
      request: {
        use: jest.fn((handler) => {
          requestHandler = handler;
        }),
      },
      response: {
        use: jest.fn((_successHandler, errorHandler) => {
          responseErrorHandler = errorHandler;
        }),
      },
    },
    request: jest.fn().mockResolvedValue({ data: { retried: true } }),
  };

  const authAxios = {
    post: jest.fn().mockResolvedValue({ data: tokenResponse }),
  };

  jest.doMock("axios", () => ({
    create: jest
      .fn()
      .mockReturnValueOnce(uniplusAxios)
      .mockReturnValueOnce(authAxios),
  }));

  jest.doMock("../src/lib/redis", () => ({
    connectRedis: jest.fn().mockResolvedValue(redis),
  }));

  const client = require("../src/config/uniplus");

  return {
    authAxios,
    client,
    redis,
    requestHandler: () => requestHandler,
    responseErrorHandler: () => responseErrorHandler,
    uniplusAxios,
  };
}

describe("config/uniplus", () => {
  afterEach(() => {
    jest.dontMock("axios");
    jest.dontMock("../src/lib/redis");
  });

  test("reutiliza token OAuth do Redis", async () => {
    const { authAxios, client } = setupClient({ cachedToken: "cached-token" });

    await expect(client.getAccessToken()).resolves.toBe("cached-token");
    expect(authAxios.post).not.toHaveBeenCalled();
  });

  test("salva token OAuth no Redis com TTL expires_in menos 60s", async () => {
    const { authAxios, client, redis } = setupClient();

    await expect(client.getAccessToken()).resolves.toBe("new-token");

    expect(authAxios.post).toHaveBeenCalledWith(
      "/oauth/token",
      "grant_type=client_credentials&scope=public-api",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
          "Content-Type": "application/x-www-form-urlencoded",
        }),
      }),
    );
    expect(redis.set).toHaveBeenCalledWith("uniplus:token", "new-token", "EX", 60);
  });

  test("limpa token expirado e refaz request uma vez quando recebe 401", async () => {
    const { client, redis, responseErrorHandler, uniplusAxios } = setupClient();

    const retryResponse = await responseErrorHandler()({
      response: { status: 401 },
      config: { headers: {} },
    });

    expect(redis.del).toHaveBeenCalledWith(client.TOKEN_CACHE_KEY);
    expect(uniplusAxios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        __isRetryRequest: true,
        headers: expect.objectContaining({
          Authorization: "Bearer new-token",
        }),
      }),
    );
    expect(retryResponse).toEqual({ data: { retried: true } });
  });

  test("request interceptor injeta token e headers globais do env", async () => {
    process.env.UNIPLUS_CLIENT_ID = "client-id";
    process.env.UNIPLUS_CLIENT_SECRET = "client-secret";
    process.env.UNIPLUS_TENANT = "galegoaguaegas";
    process.env.UNIPLUS_ACCESS_KEY = "access-key";

    const { requestHandler } = setupClient({ cachedToken: "cached-token" });

    const config = await requestHandler()({ headers: {} });

    expect(config.headers).toMatchObject({
      Authorization: "Bearer cached-token",
      "X-Client-Id": "client-id",
      "X-Client-Secret": "client-secret",
      "X-Tenant": "galegoaguaegas",
      "X-Access-Key": "access-key",
    });
  });
});
