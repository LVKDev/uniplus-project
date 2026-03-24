const express = require("express");
const pedidosRoutes = require("./routes/pedidos.routes");
const entidadesRoutes = require("./routes/entidades.routes");
const produtosRoutes = require("./routes/produtos.routes");
const ordensServicoRoutes = require("./routes/ordens-servico.routes");
const vendasRoutes = require("./routes/vendas.routes");
const arquivosRoutes = require("./routes/arquivos.routes");
const tipoDocumentoRoutes = require("./routes/tipo-documento-financeiro.routes");
const gourmetRoutes = require("./routes/gourmet.routes");
const portalRoutes = require("./routes/portal-comercial.routes");
const healthRoutes = require("./routes/health.routes");
const mockRoutes = require("./routes/mock.routes");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");
const { authenticate } = require("./middleware/auth.middleware");

const app = express();

// Parse JSON bodies.
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Mock routes (no authentication required)
app.use(mockRoutes);

// Optional authentication protection for all other routes.
app.use(authenticate);

// API routes.
app.use(healthRoutes);
app.use(pedidosRoutes);
app.use(entidadesRoutes);
app.use(produtosRoutes);
app.use(ordensServicoRoutes);
app.use(vendasRoutes);
app.use(arquivosRoutes);
app.use(tipoDocumentoRoutes);
app.use(gourmetRoutes);
app.use(portalRoutes);

// Swagger docs.
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/openapi.json", (req, res) => {
  res.json(swaggerSpec);
});

// 404 handler for unknown routes.
app.use((req, res) => {
  res.status(404).json({ success: false, error: "Rota nao encontrada." });
});

// Global error handler.
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || "Erro interno.",
    details: err.details || err.auditError || null,
  });
});

module.exports = app;
