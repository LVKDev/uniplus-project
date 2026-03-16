/**
 * Rotas de Auditoria
 * GET /api/auditoria - Lista logs de auditoria com filtros
 *
 * Permissões:
 * - SUPER_ADMIN: Vê auditoria de toda o sistema
 * - ADMIN_UNIDADE: Vê auditoria da sua unidade
 * - FUNCIONARIO: NÃO consegue acessar
 */

const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth.middleware");
const { requirePermission } = require("../lib/rbac");
const { listarAuditoria } = require("../services/auditoria.service");

/**
 * GET /api/auditoria
 * Lista logs de auditoria com paginação e filtros
 *
 * Query Parameters:
 *   - unitId: Filtrar por unidade (SUPER_ADMIN only)
 *   - userId: Filtrar por usuário
 *   - acao: Filtrar por ação (CREATE, UPDATE, DELETE, etc)
 *   - recurso: Filtrar por recurso (produto, cliente, usuario)
 *   - dataInicio: Data inicial em ISO 8601 (2026-01-01T00:00:00Z)
 *   - dataFim: Data final em ISO 8601
 *   - limit: Quantidade de registros por página (padrão: 50, máx: 500)
 *   - offset: Deslocamento para paginação (padrão: 0)
 *
 * Exemplos:
 *   GET /api/auditoria?limit=25&offset=0
 *   GET /api/auditoria?acao=UPDATE&recurso=produto
 *   GET /api/auditoria?dataInicio=2026-03-01&dataFim=2026-03-31
 *
 * Response:
 *   {
 *     "success": true,
 *     "data": [
 *       {
 *         "id": "uuid",
 *         "timestamp": "2026-03-16T10:30:00Z",
 *         "usuario": "funcionario@empresa.com.br",
 *         "unidade": "Empresa A",
 *         "acao": "UPDATE",
 *         "recurso": "produto",
 *         "detalhes": {"codigo": "001", "preco": {antes: 100, depois: 150}}
 *       }
 *     ],
 *     "pagination": {
 *       "total": 150,
 *       "limit": 25,
 *       "offset": 0,
 *       "pages": 6,
 *       "currentPage": 1
 *     }
 *   }
 */
router.get(
  "/",
  authenticate,
  requirePermission("ver_auditoria"),
  async (req, res) => {
    try {
      // ADMIN_UNIDADE só consegue ver auditoria da sua unidade
      const unitIdFilter =
        req.user.role === "SUPER_ADMIN" ? req.query.unitId : req.user.unit_id;

      const resultado = await listarAuditoria(
        {
          unitId: unitIdFilter,
          userId: req.query.userId,
          acao: req.query.acao,
          recurso: req.query.recurso,
          dataInicio: req.query.dataInicio,
          dataFim: req.query.dataFim,
          limit: req.query.limit,
          offset: req.query.offset,
        },
        {
          userId: req.user.id,
          unitId: req.user.unit_id,
          userRole: req.user.role,
        },
      );

      res.json(resultado);
    } catch (error) {
      console.error("❌ Erro ao listar auditoria:", error.message);

      const statusCode = error.status || 500;
      const message = error.message || "Erro ao buscar logs de auditoria";

      res.status(statusCode).json({
        success: false,
        error: message,
      });
    }
  },
);

/**
 * GET /api/auditoria/stats
 * Estatísticas de auditoria (opcional, para dashboard)
 *
 * Response:
 *   {
 *     "success": true,
 *     "data": {
 *       "totalLogs": 1250,
 *       "acoes": {
 *         "CREATE": 250,
 *         "UPDATE": 800,
 *         "DELETE": 200
 *       },
 *       "recursosTop": {
 *         "produto": 600,
 *         "cliente": 400,
 *         "usuario": 250
 *       }
 *     }
 *   }
 */
router.get(
  "/stats",
  authenticate,
  requirePermission("ver_auditoria"),
  async (req, res) => {
    try {
      const { PrismaClient } = require("@prisma/client");
      const prisma = new PrismaClient();

      let where = {};

      // ADMIN_UNIDADE vê só sua unidade
      if (req.user.role === "ADMIN_UNIDADE") {
        where.unitId = req.user.unit_id;
      } else if (req.user.role === "FUNCIONARIO") {
        return res.status(403).json({
          success: false,
          error: "Permissão negada para acessar estatísticas de auditoria",
        });
      }

      const total = await prisma.auditLog.count({ where });

      // Contar por ação
      const acoesPipeline = await prisma.auditLog.groupBy({
        by: ["acao"],
        where,
        _count: true,
      });

      const acoes = {};
      acoesPipeline.forEach((item) => {
        acoes[item.acao] = item._count;
      });

      // Contar por recurso
      const recursosPipeline = await prisma.auditLog.groupBy({
        by: ["recurso"],
        where,
        _count: true,
      });

      const recursos = {};
      recursosPipeline.forEach((item) => {
        recursos[item.recurso] = item._count;
      });

      // Ordenar por frequência
      const recursosOrdenados = Object.entries(recursos)
        .sort(([, a], [, b]) => b - a)
        .reduce((obj, [key, val]) => {
          obj[key] = val;
          return obj;
        }, {});

      res.json({
        success: true,
        data: {
          totalLogs: total,
          acoes,
          recursosTop: recursosOrdenados,
        },
      });
    } catch (error) {
      console.error("❌ Erro ao buscar stats:", error.message);
      res.status(500).json({
        success: false,
        error: "Erro ao buscar estatísticas de auditoria",
      });
    }
  },
);

module.exports = router;
