const express = require("express");
const auditService = require("../services/audit.service");

const router = express.Router();

// Tenta carregar Prisma, mas não falha se não estiver disponível
let prisma = null;
try {
  const { PrismaClient } = require("@prisma/client");
  prisma = new PrismaClient();
} catch (error) {
  console.warn(
    "⚠️  @prisma/client nao disponivel. Health check de database desativado.",
  );
}

router.get("/health", (req, res) => {
  const response = {
    success: true,
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  };

  auditService
    .registrarAuditoria(
      {
        table: "health_log",
        recurso: "health",
        rota: req.path,
        metodo: req.method,
        codigo: null,
        payload: { tipo: "api" },
        operacao: "CONSULTAR",
        status: "SUCESSO",
      },
      { ignoreFailure: true },
    )
    .catch(() => {});

  res.json(response);
});

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Health check basico da API
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API disponivel
 */
router.get("/health/database", async (req, res) => {
  // Se Prisma não estiver disponível, responde com status parcial
  if (!prisma) {
    return res.status(200).json({
      success: true,
      status: "partial",
      database: "unavailable (prisma not installed)",
      message: "API rodando, mas database health check indisponível",
      timestamp: new Date().toISOString(),
    });
  }

  try {
    // Testa conexão com o banco de dados
    await prisma.$queryRaw`SELECT 1`;

    const response = {
      success: true,
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
    };

    await auditService.registrarAuditoria(
      {
        table: "health_log",
        recurso: "health",
        rota: req.path,
        metodo: req.method,
        codigo: null,
        payload: { tipo: "database" },
        operacao: "CONSULTAR",
        status: "SUCESSO",
      },
      { ignoreFailure: true },
    );

    return res.json(response);
  } catch (err) {
    await auditService.registrarAuditoria(
      {
        table: "health_log",
        recurso: "health",
        rota: req.path,
        metodo: req.method,
        codigo: null,
        payload: { tipo: "database" },
        operacao: "CONSULTAR",
        status: "FALHA",
      },
      { ignoreFailure: true },
    );

    return res.status(503).json({
      success: false,
      status: "unhealthy",
      error: "Falha ao conectar ao banco de dados.",
      details: err.message,
    });
  }
});

/**
 * @openapi
 * /health/database:
 *   get:
 *     summary: Health check do banco de dados MySQL
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Banco de dados disponivel
 *       503:
 *         description: Banco de dados indisponivel
 */
module.exports = router;
