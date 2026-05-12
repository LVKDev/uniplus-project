const express = require("express");

// HTTP routes for pedidos endpoints.
const pedidosService = require("../services/pedidos.service");
const { cacheRoute } = require("../middleware/cache.middleware");

const router = express.Router();

function validarPedido(payload) {
  if (!payload || typeof payload !== "object") return "Payload invalido.";
  if (!payload.cliente) return 'Campo "cliente" e obrigatorio.';
  if (!payload.filial) return 'Campo "filial" e obrigatorio.';
  if (!Array.isArray(payload.itens) || payload.itens.length === 0) {
    return 'Campo "itens" deve ser um array com pelo menos 1 item.';
  }
  return null;
}

router.get(
  "/api/pedidos",
  cacheRoute(120, "pedidos"),
  async (req, res, next) => {
  try {
    const { single, all, ...raw } = req.query;
    const options = { params: raw };
    const context = {
      rota: req.path,
      metodo: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      tenantId: req.user?.tenantId,
    };

    if (options.params.limit !== undefined) {
      options.params.limit = Number(options.params.limit);
    }
    if (options.params.offset !== undefined) {
      options.params.offset = Number(options.params.offset);
    }
    if (all !== undefined) {
      options.all = all === "true";
    }

    if (
      options.params.cliente !== undefined &&
      options.params["cliente.eq"] === undefined
    ) {
      options.params["cliente.eq"] = options.params.cliente;
      delete options.params.cliente;
    }
    if (
      options.params.codigo !== undefined &&
      options.params["codigo.eq"] === undefined
    ) {
      options.params["codigo.eq"] = options.params.codigo;
      delete options.params.codigo;
    }
    if (
      options.params.status !== undefined &&
      options.params["status.eq"] === undefined
    ) {
      options.params["status.eq"] = options.params.status;
      delete options.params.status;
    }

    const data = await pedidosService.listarPedidos(options, context);

    if (single === "true") {
      const primeiro = Array.isArray(data) ? data[0] || null : data || null;
      return res.json({ success: true, data: primeiro });
    }

    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
  },
);

/**
 * @openapi
 * /api/pedidos:
 *   get:
 *     summary: Lista pedidos (DAVs)
 *     tags: [Pedidos]
 *     parameters:
 *       - in: query
 *         name: cliente
 *         schema:
 *           type: string
 *         description: Filtra por codigo do cliente
 *         example: "251"
 *       - in: query
 *         name: codigo
 *         schema:
 *           type: string
 *         description: Filtra por codigo do pedido
 *         example: "167"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filtra por status
 *         example: "8"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limite de registros
 *         example: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Offset de pagina
 *         example: 0
 *       - in: query
 *         name: single
 *         schema:
 *           type: boolean
 *         description: Retorna apenas um registro
 *         example: false
 *     responses:
 *       200:
 *         description: Lista de pedidos
 */
router.get("/api/pedidos/:codigo", async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const context = {
      rota: req.path,
      metodo: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      tenantId: req.user?.tenantId,
    };
    if (!codigo) {
      return res
        .status(400)
        .json({ success: false, error: "Codigo obrigatorio." });
    }

    const data = await pedidosService.obterPedidoPorCodigo(codigo, context);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/pedidos/{codigo}:
 *   get:
 *     summary: Busca um pedido por codigo
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: "167"
 *     responses:
 *       200:
 *         description: Pedido encontrado
 */
router.post("/api/pedidos", async (req, res, next) => {
  try {
    const payload = req.body?.dav || req.body;
    const context = {
      rota: req.path,
      metodo: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      tenantId: req.user?.tenantId,
    };
    if (payload && !payload.data) {
      // UniPlus requires data (YYYY-MM-DD).
      payload.data = new Date().toISOString().slice(0, 10);
    }
    const erroValidacao = validarPedido(payload);
    if (erroValidacao) {
      return res.status(400).json({ success: false, error: erroValidacao });
    }

    const requestBody = req.body?.dav ? req.body : payload;
    const data = await pedidosService.criarPedido(requestBody, context);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/pedidos:
 *   post:
 *     summary: Cria um pedido (DAV)
 *     tags: [Pedidos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/PedidoWrapper'
 *               - $ref: '#/components/schemas/Pedido'
 *           examples:
 *             wrapper:
 *               value:
 *                 dav:
 *                   cliente: "251"
 *                   filial: "1"
 *                   tipoDocumento: 2
 *                   condicaoPagamento: "1"
 *                   itens:
 *                     - produto: "15"
 *                       quantidade: 1
 *                       precoUnitario: 12.73
 *     responses:
 *       201:
 *         description: Pedido criado
 */
router.put("/api/pedidos", async (req, res, next) => {
  try {
    const payload = req.body?.dav || req.body;
    const context = {
      rota: req.path,
      metodo: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      tenantId: req.user?.tenantId,
    };
    if (payload && !payload.data) {
      payload.data = new Date().toISOString().slice(0, 10);
    }

    const erroValidacao = validarPedido(payload);
    if (erroValidacao) {
      return res.status(400).json({ success: false, error: erroValidacao });
    }

    if (!payload.codigo) {
      return res
        .status(400)
        .json({ success: false, error: 'Campo "codigo" e obrigatorio.' });
    }

    const requestBody = req.body?.dav ? req.body : payload;
    const data = await pedidosService.atualizarPedido(requestBody, context);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/pedidos:
 *   put:
 *     summary: Atualiza um pedido (DAV)
 *     tags: [Pedidos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/PedidoWrapper'
 *               - $ref: '#/components/schemas/Pedido'
 *           examples:
 *             wrapper:
 *               value:
 *                 dav:
 *                   codigo: "167"
 *                   cliente: "251"
 *                   filial: "1"
 *                   tipoDocumento: 2
 *                   condicaoPagamento: "1"
 *                   itens:
 *                     - produto: "15"
 *                       quantidade: 2
 *                       precoUnitario: 12.73
 *     responses:
 *       200:
 *         description: Pedido atualizado
 */
router.delete("/api/pedidos/:codigo", async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const context = {
      rota: req.path,
      metodo: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      tenantId: req.user?.tenantId,
    };
    if (!codigo) {
      return res
        .status(400)
        .json({ success: false, error: "Codigo obrigatorio." });
    }

    const data = await pedidosService.apagarPedido(codigo, context);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/pedidos/{codigo}:
 *   delete:
 *     summary: Apaga um pedido por codigo
 *     tags: [Pedidos]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: "167"
 *     responses:
 *       200:
 *         description: Pedido apagado
 */
module.exports = router;
