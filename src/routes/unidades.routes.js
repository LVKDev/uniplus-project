/**
 * Rotas de Unidades (Super Admin)
 * Apenas usuários com role SUPER_ADMIN podem acessar
 */

const express = require("express");
const { ROLES } = require("../config/constants");
const { requireRole } = require("../lib/rbac");
const {
  listUnidades,
  getUnidade,
  createUnidade,
  updateUnidadeCredentials,
  deleteUnidade,
  createUnidadeWithFullCredentials,
  updateUnidadeFullCredentials,
} = require("../services/unidades.service");

const router = express.Router();

/**
 * GET /api/unidades
 * Lista todas as unidades (sem credenciais)
 * Protected: SUPER_ADMIN
 */
router.get("/", requireRole(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const unidades = await listUnidades();

    res.status(200).json({
      success: true,
      data: unidades,
      count: unidades.length,
    });
  } catch (error) {
    console.error("Erro ao listar unidades:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao listar unidades",
    });
  }
});

/**
 * GET /api/unidades/:unitId
 * Busca uma unidade específica
 * Protected: SUPER_ADMIN
 */
router.get("/:unitId", requireRole(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const { unitId } = req.params;

    const unidade = await getUnidade(unitId);

    if (!unidade) {
      return res.status(404).json({
        success: false,
        error: "Unidade não encontrada",
      });
    }

    res.status(200).json({
      success: true,
      data: unidade,
    });
  } catch (error) {
    console.error("Erro ao buscar unidade:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao buscar unidade",
    });
  }
});

/**
 * POST /api/unidades
 * Cria uma nova unidade com credenciais Uniplus
 * Protected: SUPER_ADMIN
 * Body: {
 *   nome: string (obrigatório),
 *   credencial_uniplus_user: string (obrigatório),
 *   credencial_uniplus_pass: string (obrigatório)
 * }
 */
router.post("/", requireRole(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const { nome, credencial_uniplus_user, credencial_uniplus_pass } = req.body;

    // Validar entrada
    if (!nome || !credencial_uniplus_user || !credencial_uniplus_pass) {
      return res.status(400).json({
        success: false,
        error: "Nome, username e password Uniplus são obrigatórios",
      });
    }

    // Criar unidade
    const unidade = await createUnidade(
      nome,
      credencial_uniplus_user,
      credencial_uniplus_pass,
    );

    res.status(201).json({
      success: true,
      data: unidade,
      message: "Unidade criada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao criar unidade:", error);

    // Diferenciar erro de validação vs erro de servidor
    const statusCode =
      error.message.includes("obrigatório") ||
      error.message.includes("já existe") ||
      error.message.includes("inválido")
        ? 400
        : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || "Erro ao criar unidade",
    });
  }
});

/**
 * PUT /api/unidades/:unitId
 * Atualiza credenciais Uniplus de uma unidade
 * Protected: SUPER_ADMIN
 * Body: {
 *   credencial_uniplus_user: string (obrigatório),
 *   credencial_uniplus_pass: string (obrigatório)
 * }
 */
router.put("/:unitId", requireRole(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const { unitId } = req.params;
    const { credencial_uniplus_user, credencial_uniplus_pass } = req.body;

    // Validar entrada
    if (!credencial_uniplus_user || !credencial_uniplus_pass) {
      return res.status(400).json({
        success: false,
        error: "Username e password Uniplus são obrigatórios",
      });
    }

    // Atualizar credenciais
    const result = await updateUnidadeCredentials(
      unitId,
      credencial_uniplus_user,
      credencial_uniplus_pass,
    );

    res.status(200).json({
      success: true,
      data: result,
      message: "Credenciais atualizadas com sucesso",
    });
  } catch (error) {
    console.error("Erro ao atualizar unidade:", error);

    // Diferenciar erro de validação vs erro de servidor
    const statusCode = error.message.includes("não encontrada")
      ? 404
      : error.message.includes("obrigatório")
        ? 400
        : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || "Erro ao atualizar unidade",
    });
  }
});

/**
 * POST /api/unidades/full-credentials
 * Cria uma unidade com credenciais Uniplus COMPLETAS (novo formato JSON)
 * Protected: SUPER_ADMIN
 * Body: {
 *   nome: string,
 *   credenciais_uniplus: {
 *     base_url: string,
 *     server_url: string,
 *     client_id: string,
 *     client_secret: string,
 *     token: string (opcional),
 *     auth_basic: string,
 *     tenant: string,
 *     access_key: string,
 *     limit: number
 *   }
 * }
 */
router.post(
  "/full-credentials",
  requireRole(ROLES.SUPER_ADMIN),
  async (req, res) => {
    try {
      const { nome, credenciais_uniplus } = req.body;

      // Validar entrada
      if (!nome || !credenciais_uniplus) {
        return res.status(400).json({
          success: false,
          error: "Nome e credenciais_uniplus são obrigatórios",
        });
      }

      // Criar unidade
      const unidade = await createUnidadeWithFullCredentials(
        nome,
        credenciais_uniplus,
      );

      res.status(201).json({
        success: true,
        data: unidade,
        message: unidade.message,
      });
    } catch (error) {
      console.error("Erro ao criar unidade com credenciais JSON:", error);

      const statusCode =
        error.message.includes("obrigatório") ||
        error.message.includes("já existe") ||
        error.message.includes("faltando")
          ? 400
          : 500;

      res.status(statusCode).json({
        success: false,
        error: error.message || "Erro ao criar unidade",
      });
    }
  },
);

/**
 * PUT /api/unidades/:unitId/full-credentials
 * Atualiza credenciais Uniplus COMPLETAS de uma unidade (novo formato JSON)
 * Protected: SUPER_ADMIN
 * Body: {
 *   credenciais_uniplus: {
 *     base_url: string,
 *     server_url: string,
 *     client_id: string,
 *     client_secret: string,
 *     token: string (opcional),
 *     auth_basic: string,
 *     tenant: string,
 *     access_key: string,
 *     limit: number
 *   }
 * }
 */
router.put(
  "/:unitId/full-credentials",
  requireRole(ROLES.SUPER_ADMIN),
  async (req, res) => {
    try {
      const { unitId } = req.params;
      const { credenciais_uniplus } = req.body;

      // Validar entrada
      if (!credenciais_uniplus) {
        return res.status(400).json({
          success: false,
          error: "credenciais_uniplus é obrigatório",
        });
      }

      // Atualizar credenciais
      const result = await updateUnidadeFullCredentials(
        unitId,
        credenciais_uniplus,
      );

      res.status(200).json({
        success: true,
        data: result,
        message: result.message,
      });
    } catch (error) {
      console.error("Erro ao atualizar unidade com credenciais JSON:", error);

      const statusCode = error.message.includes("não encontrada")
        ? 404
        : error.message.includes("obrigatório") ||
            error.message.includes("faltando")
          ? 400
          : 500;

      res.status(statusCode).json({
        success: false,
        error: error.message || "Erro ao atualizar unidade",
      });
    }
  },
);

/**
 * Deleta uma unidade (apenas se sem usuários)
 * Protected: SUPER_ADMIN
 */
router.delete("/:unitId", requireRole(ROLES.SUPER_ADMIN), async (req, res) => {
  try {
    const { unitId } = req.params;

    // Deletar unidade
    const result = await deleteUnidade(unitId);

    res.status(200).json({
      success: true,
      data: result,
      message: "Unidade deletada com sucesso",
    });
  } catch (error) {
    console.error("Erro ao deletar unidade:", error);

    // Diferenciar erro de validação
    const statusCode = error.message.includes("não encontrada")
      ? 404
      : error.message.includes("usuários")
        ? 409 // Conflict
        : 500;

    res.status(statusCode).json({
      success: false,
      error: error.message || "Erro ao deletar unidade",
    });
  }
});

module.exports = router;
