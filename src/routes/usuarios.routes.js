/**
 * Rotas de Usuários (Admin de Unidade)
 * Apenas usuários com role ADMIN_UNIDADE podem criar/editar na sua unidade
 */

const express = require("express");
const { ROLES } = require("../config/constants");
const { requireRole } = require("../lib/rbac");
const {
  listUsuarios,
  getUsuario,
  createUsuario,
  updateUsuarioPermissions,
  updateUsuario,
  deleteUsuario,
} = require("../services/usuarios.service");

const router = express.Router();

/**
 * GET /api/usuarios
 * Lista usuários da unidade do admin
 * Protected: ADMIN_UNIDADE ou SUPER_ADMIN
 */
router.get(
  "/",
  requireRole([ROLES.ADMIN_UNIDADE, ROLES.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const { unit_id: userUnit } = req.user;
      const userRole = req.user.role;

      // Se for ADMIN_UNIDADE, busca da sua unidade
      // Se for SUPER_ADMIN, precisa passar unit_id como query param
      let unitId = userUnit;

      if (userRole === ROLES.SUPER_ADMIN && req.query.unit_id) {
        unitId = req.query.unit_id;
      }

      if (!unitId) {
        return res.status(400).json({
          success: false,
          error: "unit_id não informado",
        });
      }

      const usuarios = await listUsuarios(unitId, userRole, userUnit);

      res.status(200).json({
        success: true,
        data: usuarios,
        count: usuarios.length,
      });
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Erro ao listar usuários",
      });
    }
  },
);

/**
 * GET /api/usuarios/:userId
 * Busca um usuário específico
 * Protected: ADMIN_UNIDADE ou SUPER_ADMIN
 */
router.get(
  "/:userId",
  requireRole([ROLES.ADMIN_UNIDADE, ROLES.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const { userId } = req.params;

      const usuario = await getUsuario(userId);

      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: "Usuário não encontrado",
        });
      }

      // Validar que é da mesma unidade (se for ADMIN_UNIDADE)
      if (
        req.user.role === ROLES.ADMIN_UNIDADE &&
        usuario.unit_id !== req.user.unit_id
      ) {
        return res.status(403).json({
          success: false,
          error: "Acesso negado",
        });
      }

      res.status(200).json({
        success: true,
        data: usuario,
      });
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Erro ao buscar usuário",
      });
    }
  },
);

/**
 * POST /api/usuarios
 * Cria um novo usuário/funcionário
 * Protected: ADMIN_UNIDADE ou SUPER_ADMIN
 * Body: {
 *   email: string (obrigatório),
 *   password: string (obrigatório, 8+ caracteres),
 *   role: string (ADMIN_UNIDADE ou FUNCIONARIO),
 *   permissions: array (opcional)
 * }
 */
router.post(
  "/",
  requireRole([ROLES.ADMIN_UNIDADE, ROLES.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const { email, password, role, permissions } = req.body;
      const { unit_id: userUnit } = req.user;

      // Validar entrada
      if (!email || !password || !role) {
        return res.status(400).json({
          success: false,
          error: "Email, senha e role são obrigatórios",
        });
      }

      // ADMIN_UNIDADE só pode criar na sua unidade
      if (req.user.role === ROLES.ADMIN_UNIDADE) {
        // ADMIN_UNIDADE não pode criar outro ADMIN_UNIDADE
        if (role === ROLES.ADMIN_UNIDADE) {
          return res.status(403).json({
            success: false,
            error: "Você não pode criar outro Admin de Unidade",
          });
        }
      }

      const usuario = await createUsuario(
        email,
        password,
        role,
        userUnit,
        permissions,
      );

      res.status(201).json({
        success: true,
        data: usuario,
        message: "Usuário criado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao criar usuário:", error);

      const statusCode =
        error.message.includes("obrigatório") ||
        error.message.includes("inválido") ||
        error.message.includes("já existe")
          ? 400
          : 500;

      res.status(statusCode).json({
        success: false,
        error: error.message || "Erro ao criar usuário",
      });
    }
  },
);

/**
 * PATCH /api/usuarios/:userId/permissions
 * Atualiza permissões de um usuário
 * Protected: ADMIN_UNIDADE ou SUPER_ADMIN
 * Body: {
 *   permissions: array (lista de permissões)
 * }
 */
router.patch(
  "/:userId/permissions",
  requireRole([ROLES.ADMIN_UNIDADE, ROLES.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { permissions } = req.body;

      // Verificar se usuário é da mesma unidade
      const usuario = await getUsuario(userId);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: "Usuário não encontrado",
        });
      }

      if (
        req.user.role === ROLES.ADMIN_UNIDADE &&
        usuario.unit_id !== req.user.unit_id
      ) {
        return res.status(403).json({
          success: false,
          error: "Acesso negado",
        });
      }

      const result = await updateUsuarioPermissions(userId, permissions);

      res.status(200).json({
        success: true,
        data: result,
        message: "Permissões atualizadas com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar permissões:", error);
      res.status(error.message.includes("não encontrado") ? 404 : 500).json({
        success: false,
        error: error.message || "Erro ao atualizar permissões",
      });
    }
  },
);

/**
 * PATCH /api/usuarios/:userId
 * Atualiza informações do usuário
 * Protected: ADMIN_UNIDADE ou SUPER_ADMIN
 * Body: {
 *   email?: string,
 *   role?: string,
 *   isActive?: boolean
 * }
 */
router.patch(
  "/:userId",
  requireRole([ROLES.ADMIN_UNIDADE, ROLES.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { email, role, isActive } = req.body;

      // Verificar se usuário é da mesma unidade
      const usuario = await getUsuario(userId);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: "Usuário não encontrado",
        });
      }

      if (
        req.user.role === ROLES.ADMIN_UNIDADE &&
        usuario.unit_id !== req.user.unit_id
      ) {
        return res.status(403).json({
          success: false,
          error: "Acesso negado",
        });
      }

      const updated = await updateUsuario(userId, { email, role, isActive });

      res.status(200).json({
        success: true,
        data: updated,
        message: "Usuário atualizado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);

      const statusCode = error.message.includes("não encontrado")
        ? 404
        : error.message.includes("inválido")
          ? 400
          : 500;

      res.status(statusCode).json({
        success: false,
        error: error.message || "Erro ao atualizar usuário",
      });
    }
  },
);

/**
 * DELETE /api/usuarios/:userId
 * Deleta um usuário
 * Protected: ADMIN_UNIDADE ou SUPER_ADMIN
 */
router.delete(
  "/:userId",
  requireRole([ROLES.ADMIN_UNIDADE, ROLES.SUPER_ADMIN]),
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Verificar se usuário é da mesma unidade
      const usuario = await getUsuario(userId);
      if (!usuario) {
        return res.status(404).json({
          success: false,
          error: "Usuário não encontrado",
        });
      }

      if (
        req.user.role === ROLES.ADMIN_UNIDADE &&
        usuario.unit_id !== req.user.unit_id
      ) {
        return res.status(403).json({
          success: false,
          error: "Acesso negado",
        });
      }

      const result = await deleteUsuario(userId);

      res.status(200).json({
        success: true,
        data: result,
        message: "Usuário deletado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);

      const statusCode = error.message.includes("não encontrado")
        ? 404
        : error.message.includes("Super Admin")
          ? 403
          : 500;

      res.status(statusCode).json({
        success: false,
        error: error.message || "Erro ao deletar usuário",
      });
    }
  },
);

module.exports = router;
