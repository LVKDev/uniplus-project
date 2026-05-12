const express = require("express");

const entidadesService = require("../services/entidades.service");
const { DEFAULT_LIMIT, LIST_KEYS } = require("../config/constants");
const { cacheRoute } = require("../middleware/cache.middleware");

const router = express.Router();

/**
 * @openapi
 * /api/entidades:
 *   get:
 *     summary: Lista entidades (clientes/fornecedores)
 *     tags: [Entidades]
 *     parameters:
 *       - in: query
 *         name: codigo
 *         schema:
 *           type: string
 *         description: Filtra por codigo
 *         example: "251"
 *       - in: query
 *         name: nome
 *         schema:
 *           type: string
 *         description: Filtra por nome (prefixo)
 *         example: "MARIA"
 *       - in: query
 *         name: cnpjCpf
 *         schema:
 *           type: string
 *         description: Filtra por CNPJ/CPF
 *         example: "12345678901"
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
 *       - in: query
 *         name: vendedores
 *         schema:
 *           type: boolean
 *         description: Retorna apenas vendedores (lista unica de codigo/nome)
 *         example: true
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *         description: Retorna todos os registros ignorando paginacao
 *         example: true
 *     responses:
 *       200:
 *         description: Lista de entidades
 *         content:
 *           application/json:
 *             examples:
 *               sucesso:
 *                 value:
 *                   success: true
 *                   data:
 *                     - codigo: "251"
 *                       nome: "Cliente Teste"
 *                       cnpjCpf: "12345678901"
 */

router.get(
  "/api/entidades",
  cacheRoute(300, "entidades"),
  async (req, res, next) => {
  try {
    const { single, all, vendedores, ...raw } = req.query;
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
    const limitValue = options.params.limit;
    const offsetValue = options.params.offset;

    if (all !== undefined) {
      options.all = all === "true";
    } else if (single === "true") {
      options.all = false;
    } else if (offsetValue !== undefined) {
      options.all = false;
    } else if (limitValue !== undefined) {
      options.all = Number(limitValue) === DEFAULT_LIMIT;
    } else {
      options.all = true;
    }

    if (vendedores === "true") {
      options.all = true;
    }

    const data = await entidadesService.listarEntidades(options, context);

    if (vendedores === "true") {
      const vendedoresMap = new Map();
      let lista = [];
      if (Array.isArray(data)) {
        lista = data;
      } else {
        for (const key of LIST_KEYS) {
          if (Array.isArray(data?.[key])) {
            lista = data[key];
            break;
          }
        }
      }

      for (const entidade of lista) {
        if (entidade.codigoVendedor && entidade.nomeVendedor) {
          vendedoresMap.set(entidade.codigoVendedor, {
            codigo: entidade.codigoVendedor,
            nome: entidade.nomeVendedor,
          });
        }
      }

      return res.json({
        success: true,
        data: Array.from(vendedoresMap.values()),
      });
    }

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
 * /api/entidades/{codigo}:
 *   get:
 *     summary: Busca entidade por codigo
 *     tags: [Entidades]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: "251"
 *     responses:
 *       200:
 *         description: Entidade encontrada
 */
router.get("/api/entidades/:codigo", async (req, res, next) => {
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

    const data = await entidadesService.obterEntidadePorCodigo(codigo, context);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/entidades:
 *   post:
 *     summary: Cria uma entidade (cliente/fornecedor)
 *     tags: [Entidades]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EntidadeWrapper'
 *           examples:
 *             basico:
 *               summary: Exemplo basico
 *               value:
 *                 entidade:
 *                   codigo: "3001"
 *                   nome: "Cliente Exemplo"
 *                   tipo: "1"
 *                   tipoPessoa: "0"
 *                   cnpjCpf: "12345678901"
 *             comExtras:
 *               summary: Com campos extras
 *               value:
 *                 entidade:
 *                   codigo: "3001"
 *                   nome: "Cliente Exemplo"
 *                   tipo: "1"
 *                   tipoPessoa: "0"
 *                   cnpjCpf: "12345678901"
 *                   extra1: "Observacao 1"
 *                   extra2: "Observacao 2"
 *                   extra3: "Categoria A"
 *                   extra4: "Segmento B"
 *                   extra5: "Regiao Norte"
 *                   extra6: "Vendedor XYZ"
 *                   extra7: "Prioridade Alta"
 *                   extra8: "Cliente VIP"
 *     responses:
 *       200:
 *         description: Entidade criada
 *         content:
 *           application/json:
 *             examples:
 *               sucesso:
 *                 value:
 *                   success: true
 */
router.post("/api/entidades", async (req, res, next) => {
  try {
    const payload = req.body?.entidade ? req.body.entidade : req.body;
    const context = {
      rota: req.path,
      metodo: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      tenantId: req.user?.tenantId,
    };

    if (!payload || typeof payload !== "object") {
      return res
        .status(400)
        .json({ success: false, error: "Payload invalido." });
    }

    if (!payload.nome) {
      return res
        .status(400)
        .json({ success: false, error: 'Campo "nome" e obrigatorio.' });
    }

    if (!payload.tipo) {
      return res
        .status(400)
        .json({ success: false, error: 'Campo "tipo" e obrigatorio.' });
    }

    const tipos = String(payload.tipo)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const tipoInvalido = tipos.some(
      (tipo) => !["1", "2", "3", "4", "5", "6"].includes(tipo),
    );
    if (tipoInvalido) {
      return res
        .status(400)
        .json({ success: false, error: 'Campo "tipo" invalido.' });
    }

    if (payload.tipoPessoa !== undefined) {
      const tipoPessoa = String(payload.tipoPessoa);
      if (!["0", "1"].includes(tipoPessoa)) {
        return res
          .status(400)
          .json({ success: false, error: 'Campo "tipoPessoa" invalido.' });
      }

      if (tipoPessoa === "1" && !payload.cnpjCpf) {
        return res.status(400).json({
          success: false,
          error: 'Campo "cnpjCpf" e obrigatorio para pessoa juridica.',
        });
      }
    }

    if (payload.cnpjCpf) {
      const apenasDigitos = String(payload.cnpjCpf).replace(/\D/g, "");
      if (apenasDigitos.length !== 11 && apenasDigitos.length !== 14) {
        return res
          .status(400)
          .json({ success: false, error: 'Campo "cnpjCpf" invalido.' });
      }
    }

    const data = await entidadesService.criarEntidade(
      req.body?.entidade ? req.body : { entidade: payload },
      context,
    );
    return res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/entidades:
 *   put:
 *     summary: Atualiza uma entidade
 *     tags: [Entidades]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EntidadeWrapper'
 *           examples:
 *             atualizacao:
 *               summary: Atualizacao basica
 *               value:
 *                 entidade:
 *                   codigo: "251"
 *                   nome: "Cliente Atualizado"
 *                   tipo: "1"
 *             atualizarExtras:
 *               summary: Atualizar campos extras
 *               value:
 *                 entidade:
 *                   codigo: "251"
 *                   nome: "Cliente Atualizado"
 *                   tipo: "1"
 *                   extra1: "Nova observacao 1"
 *                   extra2: "Nova observacao 2"
 *                   extra3: "Categoria B"
 *                   extra4: "Segmento C"
 *                   extra5: "Regiao Sul"
 *                   extra6: "Vendedor ABC"
 *                   extra7: "Prioridade Media"
 *                   extra8: "Cliente Premium"
 *     responses:
 *       200:
 *         description: Entidade atualizada
 *         content:
 *           application/json:
 *             examples:
 *               sucesso:
 *                 value:
 *                   success: true
 */
router.put("/api/entidades", async (req, res, next) => {
  try {
    const payload = req.body?.entidade ? req.body.entidade : req.body;
    const context = {
      rota: req.path,
      metodo: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      tenantId: req.user?.tenantId,
    };

    if (!payload || typeof payload !== "object") {
      return res
        .status(400)
        .json({ success: false, error: "Payload invalido." });
    }

    if (!payload.codigo) {
      return res
        .status(400)
        .json({ success: false, error: 'Campo "codigo" e obrigatorio.' });
    }

    if (!payload.nome) {
      return res
        .status(400)
        .json({ success: false, error: 'Campo "nome" e obrigatorio.' });
    }

    if (!payload.tipo) {
      return res
        .status(400)
        .json({ success: false, error: 'Campo "tipo" e obrigatorio.' });
    }

    const tipos = String(payload.tipo)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const tipoInvalido = tipos.some(
      (tipo) => !["1", "2", "3", "4", "5", "6"].includes(tipo),
    );
    if (tipoInvalido) {
      return res
        .status(400)
        .json({ success: false, error: 'Campo "tipo" invalido.' });
    }

    if (payload.tipoPessoa !== undefined) {
      const tipoPessoa = String(payload.tipoPessoa);
      if (!["0", "1"].includes(tipoPessoa)) {
        return res
          .status(400)
          .json({ success: false, error: 'Campo "tipoPessoa" invalido.' });
      }

      if (tipoPessoa === "1" && !payload.cnpjCpf) {
        return res.status(400).json({
          success: false,
          error: 'Campo "cnpjCpf" e obrigatorio para pessoa juridica.',
        });
      }
    }

    if (payload.cnpjCpf) {
      const apenasDigitos = String(payload.cnpjCpf).replace(/\D/g, "");
      if (apenasDigitos.length !== 11 && apenasDigitos.length !== 14) {
        return res
          .status(400)
          .json({ success: false, error: 'Campo "cnpjCpf" invalido.' });
      }
    }

    const data = await entidadesService.atualizarEntidade(
      req.body?.entidade ? req.body : { entidade: payload },
      context,
    );
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/entidades/{codigo}:
 *   delete:
 *     summary: Apaga entidade por codigo
 *     tags: [Entidades]
 *     parameters:
 *       - in: path
 *         name: codigo
 *         required: true
 *         schema:
 *           type: string
 *         example: "251"
 *     responses:
 *       200:
 *         description: Entidade apagada
 *         content:
 *           application/json:
 *             examples:
 *               sucesso:
 *                 value:
 *                   success: true
 */
router.delete("/api/entidades/:codigo", async (req, res, next) => {
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

    const data = await entidadesService.apagarEntidade(codigo, context);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
