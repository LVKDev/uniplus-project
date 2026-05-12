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
const funcionariosRoutes = require("./routes/funcionarios.routes");
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

app.use("/api", (req, res, next) => {
  const start = Date.now();

  const incoming = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    query: req.query,
    headers: {
      "content-type": req.headers["content-type"],
      "user-agent": req.headers["user-agent"],
      "x-forwarded-for": req.headers["x-forwarded-for"],
      host: req.headers["host"],
      origin: req.headers["origin"],
      referer: req.headers["referer"],
    },
    body: req.method !== "GET" ? req.body : undefined,
    auth: req.auth,
    user: req.user
      ? {
          id: req.user.id,
          role: req.user.role,
          unit_id: req.user.unit_id,
          permissions: req.user.permissions,
        }
      : null,
  };

  console.log("[REQUEST]", JSON.stringify(incoming, null, 2));

  const originalJson = res.json.bind(res);
  res.json = function loggedJson(body) {
    const duration = Date.now() - start;
    const outgoing = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration_ms: duration,
      cache: res.getHeader("X-Cache"),
      response_summary: summarizeBody(body),
    };
    console.log("[RESPONSE]", JSON.stringify(outgoing, null, 2));
    return originalJson(body);
  };

  next();
});

function summarizeBody(body) {
  if (!body || typeof body !== "object") return body;
  if (Array.isArray(body)) return { type: "array", length: body.length };
  const summary = { ...body };
  if (Array.isArray(summary.data)) {
    summary.data = `[array length=${summary.data.length}]`;
  }
  if (summary.pagination) summary.pagination = summary.pagination;
  if (summary.error) summary.error = summary.error;
  return summary;
}

app.use("/api/produtos", produtosRoutes);
app.use("/api/clientes", clientesRoutes);
app.use(entidadesRoutes);
app.use(pedidosRoutes);
app.use(ordensServicoRoutes);
app.use(arquivosRoutes);
app.use(vendasRoutes);
app.use(tipoDocumentoFinanceiroRoutes);
app.use(funcionariosRoutes);

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
