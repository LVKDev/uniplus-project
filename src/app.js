require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const {
  authenticate,
  auditLog,
  errorHandler,
} = require("./middleware/auth.middleware");
const {
  globalTenantValidation,
} = require("./middleware/tenantValidator.middleware");
const {
  corsMiddleware,
  corsErrorHandler,
} = require("./middleware/cors.middleware");
const {
  loginLimiter,
  apiLimiter,
  writeLimiter,
} = require("./middleware/rateLimiting.middleware");

// Importar rotas
const authRoutes = require("./routes/auth.routes");
const unidadesRoutes = require("./routes/unidades.routes");
const usuariosRoutes = require("./routes/usuarios.routes");
const produtosRoutes = require("./routes/produtos.routes");
const clientesRoutes = require("./routes/clientes.routes");
const dadosConfigRoutes = require("./routes/dados-config.routes");
const auditoriaRoutes = require("./routes/auditoria.routes");

// Inicializar Express
const app = express();

// ============================================
// MIDDLEWARES GLOBAIS
// ============================================

// Segurança: Headers de proteção (HSTS, CSP, X-Frame-Options, etc)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net", "data:"],
      connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
    },
  },
}));

// CORS: Restrição a domínios autorizados
app.use(corsMiddleware);
app.use(corsErrorHandler);

// Parse JSON e cookies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting geral (100 req/min por IP)
app.use(apiLimiter);

// Logs de auditoria
app.use(auditLog);

// Servir arquivos estáticos (public)
app.use(express.static("public"));

// ============================================
// ROTAS PÚBLICAS (sem autenticação)
// ============================================

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Auth routes (login, logout) com rate limiting específico para login
app.use("/auth/login", loginLimiter);
app.use("/auth", authRoutes);

// ============================================
// MIDDLEWARES PROTEGIDOS (requer autenticação)
// ============================================

// Autenticação mandatória para rotas abaixo
app.use(authenticate);

// Validação de tenant global (adiciona unit_id ao req)
app.use(globalTenantValidation);

// ============================================
// ROTAS PROTEGIDAS (rerem JWT válido)
// ============================================

// Rotas de Unidades (Super Admin)
app.use("/api/unidades", unidadesRoutes);

// Rotas de Usuários (Admin de Unidade)
app.use("/api/usuarios", usuariosRoutes);

// Rotas de Produtos (SPRINT 4)
app.use("/api/produtos", produtosRoutes);

// Rotas de Clientes (SPRINT 4)
app.use("/api/clientes", clientesRoutes);

// Rotas de Dados de Configuração (SPRINT 4)
app.use("/api", dadosConfigRoutes);

// Rotas de Auditoria (SPRINT 5 - Listar logs de auditoria)
app.use("/api/auditoria", auditoriaRoutes);

// Aqui virão as rotas de usuários, dados, etc
app.get("/api/protected", (req, res) => {
  res.json({
    message: "Rota protegida acessada com sucesso",
    user: req.user,
  });
});

// ============================================
// TRATAMENTO DE ERROS
// ============================================

// 404 - Rota não encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Rota não encontrada",
    path: req.path,
    method: req.method,
  });
});

// Error handler (deve ser o último)
app.use(errorHandler);

module.exports = app;
