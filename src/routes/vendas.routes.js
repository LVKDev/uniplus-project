const express = require("express");

const vendasService = require("../services/vendas.service");

const router = express.Router();

function hasDataFilter(params) {
  return Object.keys(params).some(
    (key) => key === "data" || key.startsWith("data."),
  );
}

/**
 * @openapi
 * /api/vendas:
 *   get:
 *     summary: Lista vendas (API Vendas)
 *     tags: [Vendas]
 *     parameters:
 *       - in: query
 *         name: codigoCliente
 *         schema:
 *           type: string
 *         description: Codigo do cliente
 *         example: "265"
 *       - in: query
 *         name: documento
 *         schema:
 *           type: string
 *         description: Documento da venda
 *         example: "20"
 *       - in: query
 *         name: emissao
 *         schema:
 *           type: string
 *         description: Data de emissao (ou filtros emissao.ge/emissao.le)
 *         example: "2024-01-15"
 *     responses:
 *       200:
 *         description: Lista de vendas
 */
router.get("/api/vendas", async (req, res, next) => {
  try {
    const options = { params: req.query };
    const context = {
      rota: req.path,
      metodo: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      tenantId: req.user?.tenantId,
    };
    const data = await vendasService.listarVendas(options, context);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/vendas/itens:
 *   get:
 *     summary: Lista itens de vendas (API Vendas)
 *     tags: [Vendas]
 *     parameters:
 *       - in: query
 *         name: codigoProduto
 *         schema:
 *           type: string
 *         description: Codigo do produto
 *         example: "10084"
 *       - in: query
 *         name: emissao
 *         schema:
 *           type: string
 *         description: Data de emissao (ou filtros emissao.ge/emissao.le)
 *         example: "2024-01-15"
 *     responses:
 *       200:
 *         description: Lista de itens de vendas
 */
router.get("/api/vendas/itens", async (req, res, next) => {
  try {
    const options = { params: req.query };
    const context = {
      rota: req.path,
      metodo: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      tenantId: req.user?.tenantId,
    };
    const data = await vendasService.listarVendasItens(options, context);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/estoque/movimentacoes:
 *   get:
 *     summary: Lista movimentacoes de estoque (API Vendas)
 *     tags: [Estoque]
 *     parameters:
 *       - in: query
 *         name: data
 *         schema:
 *           type: string
 *         description: Data obrigatoria (ou filtros data.ge/data.le)
 *         example: "2024-01-01"
 *     responses:
 *       200:
 *         description: Lista de movimentacoes
 */
router.get("/api/estoque/movimentacoes", async (req, res, next) => {
  try {
    if (!hasDataFilter(req.query)) {
      return res.status(400).json({
        success: false,
        error: "O parametro data (ou data.ge/data.le) e obrigatorio.",
      });
    }

    const options = { params: req.query };
    const context = {
      rota: req.path,
      metodo: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      tenantId: req.user?.tenantId,
    };
    const data = await vendasService.listarMovimentacaoEstoque(
      options,
      context,
    );
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
