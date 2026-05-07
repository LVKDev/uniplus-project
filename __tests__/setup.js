/**
 * Setup para Testes Jest
 * Configura variáveis de ambiente e utilities para testes
 */

// Definir NODE_ENV como test
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/uniplus_test";
process.env.API_USER = process.env.API_USER || "test-api-user";
process.env.API_PASS = process.env.API_PASS || "test-api-pass";
process.env.UNIPLUS_BASE_URL =
  process.env.UNIPLUS_BASE_URL || "https://uniplus.test/public-api";
process.env.UNIPLUS_SERVER_URL =
  process.env.UNIPLUS_SERVER_URL || "https://uniplus.test";
process.env.UNIPLUS_AUTH_BASIC =
  process.env.UNIPLUS_AUTH_BASIC || Buffer.from("client:secret").toString("base64");
process.env.ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

// Silence logs durante testes
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Override console.error para erros importantes
global.console.error = jest.fn((message) => {
  if (process.env.DEBUG_TESTS) {
    console.error(message);
  }
});
