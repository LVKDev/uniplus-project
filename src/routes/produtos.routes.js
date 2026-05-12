/**
 * Rotas de Produtos - SPRINT 4
 * Apenas usuários com permissão ver_produtos podem listar
 * Apenas usuários com permissão editar_produtos podem fazer PATCH
 */

const express = require("express");
const {
  listarProdutos,
  obterProduto,
  atualizarProduto,
  apagarProduto,
  buscarCatalogoProdutos,
  sincronizarCatalogoProdutos,
} = require("../services/produtos.service");
const {
  cacheRoute,
  invalidateCache,
} = require("../middleware/cache.middleware");

const router = express.Router();

/**
 * POST /api/produtos/sync
 * Força sincronização completa do catálogo de produtos no Redis.
 * Útil para webhooks e integrações que precisam do catálogo atualizado.
 */
router.post("/sync", async (req, res) => {
  try {
    const items = await sincronizarCatalogoProdutos();
    res.status(200).json({
      success: true,
      message: `Catálogo sincronizado: ${items.length} produtos`,
      total: items.length,
    });
  } catch (error) {
    console.error("Erro ao sincronizar catálogo:", error.message);
    res.status(error.status || 500).json({
      success: false,
      error: error.message || "Erro ao sincronizar catálogo de produtos",
    });
  }
});

/**
 * GET /api/produtos
 * Sem limit/offset → retorna catálogo completo do Redis (todos os produtos).
 * Com limit/offset ou filtros → paginação normal direto da Uniplus.
 */
router.get(
  "/",
  async (req, res) => {
    try {
      const { codigo, nome, limit, offset, all } = req.query;
      const { id: userId, unit_id: unitId, role: userRole } = req.user;

      const isFullCatalog =
        !codigo && !nome && (all === "true" || limit === "all" || (!limit && !offset));

      if (isFullCatalog) {
        const items = await buscarCatalogoProdutos();
        return res.status(200).json({
          success: true,
          data: items,
          pagination: { total: items.length, limit: null, offset: 0 },
        });
      }

      const filtros = {};
      if (codigo) filtros.codigo = codigo;
      if (nome) filtros.nome = nome;
      if (limit && limit !== "all") filtros.limit = parseInt(limit);
      if (offset) filtros.offset = parseInt(offset) || 0;

      const resultado = await listarProdutos(filtros, {
        userId,
        unitId,
        userRole,
      });

      res.status(200).json({
        success: true,
        data: resultado.items,
        pagination: resultado.pagination,
      });
    } catch (error) {
      console.error("Erro ao listar produtos:", error.message);
      res.status(error.status || 500).json({
        success: false,
        error: error.message || "Erro ao listar produtos",
      });
    }
  },
);

/**
 * GET /api/produtos/:codigoProduto
 * Busca um produto específico
 * Protected: Requer permissão ver_produtos
 */
router.get(
  "/:codigoProduto",
  async (req, res) => {
    try {
      const { codigoProduto } = req.params;
      const { id: userId, unit_id: unitId, role: userRole } = req.user;

      const produto = await obterProduto(codigoProduto, {
        userId,
        unitId,
        userRole,
      });

      res.status(200).json({
        success: true,
        data: produto,
      });
    } catch (error) {
      console.error(
        `Erro ao obter produto ${req.params.codigoProduto}:`,
        error.message,
      );
      res.status(error.status || 500).json({
        success: false,
        error: error.message || "Erro ao obter produto",
      });
    }
  },
);

/**
 * PATCH /api/produtos/:codigoProduto
 * Edita um produto (preço, nome, descrição)
 * Protected: Requer permissão editar_produtos
 */
router.patch(
  "/:codigoProduto",
  invalidateCache("produtos"),
  async (req, res) => {
    try {
      const { codigoProduto } = req.params;
      const { id: userId, unit_id: unitId, role: userRole } = req.user;
      const dados = req.body;

      if (!dados || Object.keys(dados).length === 0) {
        return res.status(400).json({
          success: false,
          error: "Nenhum dado para atualizar",
        });
      }

      const resultado = await atualizarProduto(codigoProduto, dados, {
        userId,
        unitId,
        userRole,
      });

      res.status(200).json({
        success: true,
        data: resultado,
        message: `Produto ${codigoProduto} atualizado com sucesso`,
      });
    } catch (error) {
      console.error(
        `Erro ao atualizar produto ${req.params.codigoProduto}:`,
        error.message,
      );
      res.status(error.status || 500).json({
        success: false,
        error: error.message || "Erro ao atualizar produto",
      });
    }
  },
);

/**
 * @openapi
 * /api/produtos/{codigo}:
 *   delete:
 *     summary: Apaga produto por codigo
 *     tags: [Produtos]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: "15"
 *     responses:
 *       200:
 *         description: Produto apagado
 *         content:
 *           application/json:
 *             examples:
 *               sucesso:
 *                 value:
 *                   success: true
 */
router.delete(
  "/:codigo",
  invalidateCache("produtos"),
  async (req, res, next) => {
    try {
      const { codigo } = req.params;
      const context = {
        rota: req.path,
        metodo: req.method,
        userId: req.user?.id,
        userRole: req.user?.role,
        unitId: req.user?.unit_id,
      };
      if (!codigo) {
        return res
          .status(400)
          .json({ success: false, error: "Codigo obrigatorio." });
      }

      const data = await apagarProduto(codigo, context);
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
);

module.exports = router;
