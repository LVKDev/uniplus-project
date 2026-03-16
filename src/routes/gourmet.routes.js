const express = require("express");

const gourmetService = require("../services/gourmet.service");

const router = express.Router();

/**
 * @openapi
 * /api/gourmet/contas:
 *   get:
 *     summary: Lista contas Gourmet
 *     tags: [Gourmet]
 *     parameters:
 *       - in: query
 *         name: numero
 *         schema:
 *           type: string
 *         description: Numero da conta
 *         example: "2"
 *     responses:
 *       200:
 *         description: Lista de contas Gourmet
 */
router.get("/api/gourmet/contas", async (req, res, next) => {
  try {
    const options = { params: req.query };
    const context = {
      rota: req.path,
      metodo: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      tenantId: req.user?.tenantId,
    };
    const data = await gourmetService.listarContas(options, context);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/gourmet/contas:
 *   post:
 *     summary: Cria conta Gourmet
 *     tags: [Gourmet]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *           examples:
 *             basico:
 *               value:
 *                 nomeIntegracao: "Webhook"
 *                 numero: 2
 *                 tipo: "COMANDA"
 *                 codigoFilial: "1"
 *                 valorTotalItens: 39.0
 *                 itens:
 *                   - codigoProduto: "1002"
 *                     nomeProduto: "Item exemplo"
 *                     codigoUnidadeMedida: "UN"
 *                     quantidade: 1
 *                     valorUnitario: 39.0
 *     responses:
 *       200:
 *         description: Conta Gourmet criada
 */
router.post("/api/gourmet/contas", async (req, res, next) => {
  try {
    const payload = req.body;
    if (!payload) {
      return res
        .status(400)
        .json({ success: false, error: "Payload obrigatorio." });
    }

    const context = {
      rota: req.path,
      metodo: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      tenantId: req.user?.tenantId,
    };
    const data = await gourmetService.criarConta(payload, context);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
