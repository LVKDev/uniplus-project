require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const { basicAuth } = require("./middleware/basicAuth.middleware");
const {
  corsMiddleware,
  corsErrorHandler,
} = require("./middleware/cors.middleware");
const {
  apiLimiter,
} = require("./middleware/rateLimiting.middleware");

const produtosRoutes = require("./routes/produtos.routes");
const clientesRoutes = require("./routes/clientes.routes");
const entidadesRoutes = require("./routes/entidades.routes");
const pedidosRoutes = require("./routes/pedidos.routes");
const ordensServicoRoutes = require("./routes/ordens-servico.routes");
const arquivosRoutes = require("./routes/arquivos.routes");
const vendasRoutes = require("./routes/vendas.routes");
const tipoDocumentoFinanceiroRoutes = require("./routes/tipo-documento-financeiro.routes");
const { getHealthStatus } = require("./services/health.service");

// Inicializar Express
const app = express();

function auditLog(req, res, next) {
  res.on("finish", () => {
    if (process.env.NODE_ENV === "development") {
      const userId = req.user ? req.user.id : "public";
      console.log(
        `[AUDIT] ${req.method} ${req.path} - ${res.statusCode} - ${userId}`,
      );
    }
  });

  next();
}

function errorHandler(err, req, res, next) {
  console.error("Erro:", err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Erro interno do servidor";

  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

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

// Logs de auditoria
app.use(auditLog);

// ============================================
// ROTA PÚBLICA
// ============================================

app.get("/health", async (req, res, next) => {
  try {
    const health = await getHealthStatus();
    const statusCode = health.status === "ok" ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    next(error);
  }
});

// ============================================
// ROTAS /api PROTEGIDAS POR BASIC AUTH
// ============================================

app.use("/api", apiLimiter, basicAuth);

app.use("/api/produtos", produtosRoutes);
app.use("/api/clientes", clientesRoutes);
app.use(entidadesRoutes);
app.use(pedidosRoutes);
app.use(ordensServicoRoutes);
app.use(arquivosRoutes);
app.use(vendasRoutes);
app.use(tipoDocumentoFinanceiroRoutes);

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
