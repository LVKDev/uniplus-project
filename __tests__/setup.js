/**
 * Setup para Testes Jest
 * Configura variáveis de ambiente e utilities para testes
 */

// Definir NODE_ENV como test
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-for-tests-only";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/uniplus_test";
process.env.ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef"; // 32 caracteres hex para AES-256

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
