const request = require("supertest");

const mockGetHealthStatus = jest.fn();

jest.mock("../src/services/health.service", () => ({
  getHealthStatus: mockGetHealthStatus,
}));

function basicHeader(username, password) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

let app;

beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.API_USER = "test-api-user";
  process.env.API_PASS = "test-api-pass";
  delete process.env.API_UNIT_ID;
  delete process.env.UNIPLUS_UNIT_ID;
  mockGetHealthStatus.mockResolvedValue({
    status: "ok",
    redis: "ok",
    postgres: "ok",
    uniplus: "ok",
    uptime: 10,
  });

  app = require("../src/app");
});

describe("Basic Auth", () => {
  test("request sem Authorization recebe 401", async () => {
    const response = await request(app).get("/api/produtos");

    expect(response.status).toBe(401);
    expect(response.headers["www-authenticate"]).toContain("Basic");
  });

  test("request com credenciais erradas recebe 401", async () => {
    const response = await request(app)
      .get("/api/produtos")
      .set("Authorization", basicHeader("test-api-user", "wrong-pass"));

    expect(response.status).toBe(401);
  });

  test("request com Basic Auth correto passa pela autenticacao das rotas /api", async () => {
    const response = await request(app)
      .get("/api/__missing")
      .set("Authorization", basicHeader("test-api-user", "test-api-pass"));

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("Rota não encontrada");
  });

  test("Authorization em formato invalido recebe 401", async () => {
    const response = await request(app)
      .get("/api/produtos")
      .set("Authorization", "Bearer invalid.token.here");

    expect(response.status).toBe(401);
  });
});

describe("Health Check", () => {
  test("GET /health sem autenticacao", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
    expect(response.body.redis).toBe("ok");
    expect(response.body.postgres).toBe("ok");
    expect(response.body.uniplus).toBe("ok");
  });
});
