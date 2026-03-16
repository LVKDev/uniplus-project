/**
 * Serviço de Usuários (User Service)
 * Gerencia CRUD de usuários/funcionários com permissões granulares
 */

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PERMISSOES_POR_ROLE, ROLES } = require("../config/constants");

const prisma = new PrismaClient();

/**
 * Hash uma senha com bcryptjs
 * @param {string} password - Senha em texto plano
 * @returns {Promise<string>} Hash da senha
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Valida força de senha
 * Requer: 8 caracteres, 1 maiúscula, 1 minúscula, 1 número
 * @param {string} password - Senha a validar
 * @returns {object} {valid: boolean, message?: string}
 */
function validatePasswordStrength(password) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.{8,})/;
  if (!regex.test(password)) {
    return {
      valid: false,
      message:
        "Senha deve ter 8+ caracteres, 1 maiúscula, 1 minúscula, 1 número",
    };
  }
  return { valid: true };
}

/**
 * Valida email
 * @param {string} email - Email a validar
 * @returns {boolean} true se válido
 */
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Lista todos os usuários da unidade (apenas ADMIN_UNIDADE pode listar sua unidade)
 * @param {string} unitId - ID da unidade
 * @param {string} userRole - Role do usuário autenticado
 * @param {string} userUnit - Unit_id do usuário autenticado
 * @returns {Promise<array>} Array de usuários da unidade
 */
async function listUsuarios(unitId, userRole, userUnit) {
  try {
    // ADMIN_UNIDADE só pode listar da sua própria unidade
    if (userRole === ROLES.ADMIN_UNIDADE && unitId !== userUnit) {
      throw new Error(
        "Acesso negado: você só pode listar usuários da sua unidade",
      );
    }

    const users = await prisma.user.findMany({
      where: { unitId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        permissions: {
          select: {
            resource: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map((user) => ({
      id: user.id,
      email: user.email,
      role: user.role,
      is_active: user.isActive,
      permissions: user.permissions.map((p) => p.resource),
      created_at: user.createdAt,
    }));
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    throw error;
  }
}

/**
 * Busca um usuário por ID
 * @param {string} userId - ID do usuário
 * @returns {Promise<object>} Dados do usuário
 */
async function getUsuario(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        unitId: true,
        isActive: true,
        createdAt: true,
        permissions: {
          select: {
            resource: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      unit_id: user.unitId,
      is_active: user.isActive,
      permissions: user.permissions.map((p) => p.resource),
      created_at: user.createdAt,
    };
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    throw error;
  }
}

/**
 * Cria um novo usuário/funcionário
 * @param {string} email - Email do usuário
 * @param {string} password - Senha em texto plano
 * @param {string} role - Role (ADMIN_UNIDADE, FUNCIONARIO)
 * @param {string} unitId - ID da unidade
 * @param {array} permissions - Array de permissões
 * @returns {Promise<object>} Usuário criado
 */
async function createUsuario(email, password, role, unitId, permissions = []) {
  try {
    // Validações
    if (!email || email.trim() === "") {
      throw new Error("Email é obrigatório");
    }

    if (!validateEmail(email)) {
      throw new Error("Email inválido");
    }

    if (!password || password.trim() === "") {
      throw new Error("Senha é obrigatória");
    }

    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      throw new Error(passwordCheck.message);
    }

    if (!role || !Object.values(ROLES).includes(role)) {
      throw new Error("Role inválido");
    }

    if (!unitId || unitId.trim() === "") {
      throw new Error("Unidade é obrigatória");
    }

    // Verificar se email já existe na unidade
    const existingUser = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (existingUser) {
      throw new Error("Usuário com este email já existe");
    }

    // Verificar se unidade existe
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      throw new Error("Unidade não encontrada");
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: email.trim(),
        passwordHash,
        role,
        unitId,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        unitId: true,
        isActive: true,
        createdAt: true,
      },
    });

    // Adicionar permissões padrão se não houver
    let permissionsToAdd = permissions;
    if (!permissionsToAdd || permissionsToAdd.length === 0) {
      // Auto-atribuir permissões baseado no role
      permissionsToAdd = PERMISSOES_POR_ROLE[role] || [];
    }

    // Criar registros de permissões
    if (permissionsToAdd && permissionsToAdd.length > 0) {
      await Promise.all(
        permissionsToAdd.map((perm) =>
          prisma.userPermission.create({
            data: {
              userId: user.id,
              resource: perm,
            },
          }),
        ),
      );
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      unit_id: user.unitId,
      is_active: user.isActive,
      permissions: permissionsToAdd,
      created_at: user.createdAt,
    };
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    throw error;
  }
}

/**
 * Atualiza permissões de um usuário
 * @param {string} userId - ID do usuário
 * @param {array} permissions - Array de permissões
 * @returns {Promise<object>} Sucesso
 */
async function updateUsuarioPermissions(userId, permissions = []) {
  try {
    // Verificar se usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Validar permissões
    if (!Array.isArray(permissions)) {
      throw new Error("Permissões deve ser um array");
    }

    // Deletar permissões antigas
    await prisma.userPermission.deleteMany({
      where: { userId },
    });

    // Adicionar novas permissões
    if (permissions && permissions.length > 0) {
      await Promise.all(
        permissions.map((perm) =>
          prisma.userPermission.create({
            data: {
              userId,
              resource: perm,
            },
          }),
        ),
      );
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar permissões:", error);
    throw error;
  }
}

/**
 * Atualiza informações básicas do usuário
 * @param {string} userId - ID do usuário
 * @param {object} data - Dados a atualizar {email?, role?, isActive?}
 * @returns {Promise<object>} Usuário atualizado
 */
async function updateUsuario(userId, data = {}) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Validar email se fornecido
    if (data.email && data.email !== user.email) {
      if (!validateEmail(data.email)) {
        throw new Error("Email inválido");
      }

      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existing) {
        throw new Error("Email já está em uso");
      }
    }

    // Validar role se fornecido
    if (data.role && !Object.values(ROLES).includes(data.role)) {
      throw new Error("Role inválido");
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.email && { email: data.email.trim() }),
        ...(data.role && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        unitId: true,
        isActive: true,
        createdAt: true,
        permissions: {
          select: {
            resource: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      role: updated.role,
      unit_id: updated.unitId,
      is_active: updated.isActive,
      permissions: updated.permissions.map((p) => p.resource),
      created_at: updated.createdAt,
    };
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }
}

/**
 * Deleta um usuário
 * @param {string} userId - ID do usuário
 * @returns {Promise<object>} Sucesso
 */
async function deleteUsuario(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    // Não permitir deletar Super Admin
    if (user.role === ROLES.SUPER_ADMIN) {
      throw new Error("Não é possível deletar Super Admin");
    }

    // Deletar permissões
    await prisma.userPermission.deleteMany({
      where: { userId },
    });

    // Deletar usuário
    await prisma.user.delete({
      where: { id: userId },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    throw error;
  }
}

module.exports = {
  hashPassword,
  validatePasswordStrength,
  validateEmail,
  listUsuarios,
  getUsuario,
  createUsuario,
  updateUsuarioPermissions,
  updateUsuario,
  deleteUsuario,
};
