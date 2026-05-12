const express = require("express");
const {
  listarFuncionarios,
  obterFuncionario,
} = require("../services/funcionarios.service");
const { cacheRoute } = require("../middleware/cache.middleware");

const router = express.Router();

/**
 * @openapi
 * /api/funcionarios:
 *   get:
 *     summary: Lista funcionarios (Vendedores tipo 4 e Tecnicos tipo 5)
 *     tags: [Funcionarios]
 *     parameters:
 *       - in: query
 *         name: codigo
 *         schema:
 *           type: string
 *         description: Filtra por codigo
 *         example: "10"
 *       - in: query
 *         name: nome
 *         schema:
 *           type: string
 *         description: Filtra por nome (prefixo)
 *         example: "JOSE"
 *       - in: query
 *         name: cnpjCpf
 *         schema:
 *           type: string
 *         description: Filtra por CNPJ/CPF
 *         example: "12345678901"
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [vendedor, tecnico]
 *         description: Filtra por tipo de funcionario
 *         example: "vendedor"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limite de registros (use "all" para todos)
 *         example: 25
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Offset de paginacao
 *         example: 0
 *     responses:
 *       200:
 *         description: Lista de funcionarios
 */
router.get(
  "/api/funcionarios",
  cacheRoute(300, "funcionarios"),
  async (req, res, next) => {
    try {
      const { codigo, nome, cnpjCpf, tipo, limit, offset } = req.query;
      const context = {
        rota: req.path,
        metodo: req.method,
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
      };

      const filtros = {};
      if (codigo) filtros.codigo = codigo;
      if (nome) filtros.nome = nome;
      if (cnpjCpf) filtros.cnpjCpf = cnpjCpf;
      if (tipo) filtros.tipo = tipo;

      if (limit === "all") {
        filtros.all = true;
      } else if (limit) {
        filtros.limit = parseInt(limit) || 25;
      }
      if (offset) filtros.offset = parseInt(offset) || 0;

      const resultado = await listarFuncionarios(filtros, context);

      return res.json({
        success: true,
        data: resultado.items,
        pagination: resultado.pagination,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/funcionarios/{codigo}:
 *   get:
 *     summary: Busca funcionario por codigo
 *     tags: [Funcionarios]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: "10"
 *     responses:
 *       200:
 *         description: Funcionario encontrado
 *       404:
 *         description: Entidade nao e um funcionario
 */
router.get("/api/funcionarios/:codigo", async (req, res, next) => {
  try {
    const { codigo } = req.params;
    const context = {
      rota: req.path,
      metodo: req.method,
      userId: req.user?.id,
      tenantId: req.user?.tenantId,
    };

    if (!codigo) {
      return res
        .status(400)
        .json({ success: false, error: "Codigo obrigatorio." });
    }

    const data = await obterFuncionario(codigo, context);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
