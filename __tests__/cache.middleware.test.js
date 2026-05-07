const express = require("express");
const request = require("supertest");

const mockStore = new Map();
const mockSets = new Map();
const mockRedis = {
  async get(key) {
    return mockStore.get(key) || null;
  },
  async set(key, value) {
    mockStore.set(key, value);
  },
  async sadd(key, value) {
    const set = mockSets.get(key) || new Set();
    set.add(value);
    mockSets.set(key, set);
  },
  async smembers(key) {
    return Array.from(mockSets.get(key) || []);
  },
  async del(...keys) {
    for (const key of keys) {
      mockStore.delete(key);
      mockSets.delete(key);
    }
  },
  async expire() {},
};

jest.mock("../src/lib/redis", () => ({
  connectRedis: jest.fn(async () => mockRedis),
}));

const {
  cacheRoute,
  invalidateCache,
} = require("../src/middleware/cache.middleware");

function createApp() {
  const app = express();
  let calls = 0;

  app.use(express.json());
  app.use((req, res, next) => {
    req.auth = { type: "basic" };
    req.user = {
      id: req.get("x-user-id") || "user-1",
      role: "BASIC_AUTH",
      unit_id: req.get("x-unit-id") || "unit-1",
    };
    req.unit_id = req.user.unit_id;
    next();
  });
  app.get("/api/produtos", cacheRoute(300, "produtos"), (req, res) => {
    calls += 1;
    res.json({
      success: true,
      data: [{
        codigo: "1",
        nome: `Produto ${calls}`,
        unit_id: req.user.unit_id,
      }],
    });
  });
  app.patch("/api/produtos/:codigo", invalidateCache("produtos"), (req, res) => {
    res.json({ success: true, data: { codigo: req.params.codigo } });
  });
  app.get("/calls", (req, res) => {
    res.json({ calls });
  });

  return app;
}

beforeEach(() => {
  mockStore.clear();
  mockSets.clear();
});

describe("cacheRoute", () => {
  test("retorna MISS na primeira chamada e HIT na segunda chamada igual", async () => {
    const app = createApp();

    const first = await request(app).get("/api/produtos?limit=1&offset=0");
    const second = await request(app).get("/api/produtos?offset=0&limit=1");
    const calls = await request(app).get("/calls");

    expect(first.headers["x-cache"]).toBe("MISS");
    expect(second.headers["x-cache"]).toBe("HIT");
    expect(second.body.data[0].nome).toBe("Produto 1");
    expect(calls.body.calls).toBe(1);
  });

  test("invalidateCache limpa entradas do namespace depois de PATCH com sucesso", async () => {
    const app = createApp();

    await request(app).get("/api/produtos?limit=1");
    await request(app).patch("/api/produtos/1").send({ nome: "Atualizado" });
    const afterInvalidate = await request(app).get("/api/produtos?limit=1");
    const calls = await request(app).get("/calls");

    expect(afterInvalidate.headers["x-cache"]).toBe("MISS");
    expect(calls.body.calls).toBe(2);
  });

  test("isola cache por escopo autenticado", async () => {
    const app = createApp();

    const unitOne = await request(app)
      .get("/api/produtos?limit=1")
      .set("x-user-id", "api-user")
      .set("x-unit-id", "unit-1");
    const unitTwo = await request(app)
      .get("/api/produtos?limit=1")
      .set("x-user-id", "api-user")
      .set("x-unit-id", "unit-2");
    const unitOneAgain = await request(app)
      .get("/api/produtos?limit=1")
      .set("x-user-id", "api-user")
      .set("x-unit-id", "unit-1");
    const calls = await request(app).get("/calls");

    expect(unitOne.headers["x-cache"]).toBe("MISS");
    expect(unitTwo.headers["x-cache"]).toBe("MISS");
    expect(unitOneAgain.headers["x-cache"]).toBe("HIT");
    expect(unitOneAgain.body.data[0].unit_id).toBe("unit-1");
    expect(calls.body.calls).toBe(2);
  });
});
