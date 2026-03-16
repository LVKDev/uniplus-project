const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Valida se um usuário pode acessar um recurso baseado em sua role e tenant
 * @param {string} userId - ID do usuário
 * @param {string} userRole - Role do usuário (superadmin, admin, cliente)
 * @param {string} tenantId - Tenant ID do recurso (se aplicável)
 * @returns {Promise<object>} { canAccess: boolean, reason?: string }
 */
async function validarAcessoMultiTenant(userId, userRole, tenantId = null) {
  try {
    // SuperAdmin pode acessar tudo
    if (userRole === "superadmin") {
      return { canAccess: true, reason: "SuperAdmin" };
    }

    // Buscar usuário e seu tenantId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        tenantId: true,
      },
    });

    if (!user) {
      return { canAccess: false, reason: "Usuário não encontrado" };
    }

    // Admin pode acessar dados do seu tenant
    if (userRole === "admin") {
      if (!tenantId || tenantId === user.tenantId) {
        return { canAccess: true, reason: "Admin do tenant" };
      }
      return { canAccess: false, reason: "Admin de tenant diferente" };
    }

    // Cliente pode acessar apenas dados do seu tenant
    if (userRole === "cliente") {
      if (!tenantId || tenantId === user.tenantId) {
        return { canAccess: true, reason: "Cliente do tenant" };
      }
      return { canAccess: false, reason: "Cliente de tenant diferente" };
    }

    return { canAccess: false, reason: "Role desconhecida" };
  } catch (error) {
    console.error("Erro ao validar acesso multi-tenant:", error);
    return { canAccess: false, reason: "Erro ao validar acesso" };
  }
}

/**
 * Retorna contexto de auditoria com userId e tenantId
 * @param {object} user - Objeto user do req.user (do JWT)
 * @returns {object} { userId, tenantId }
 */
function obterContextoAuditoria(user) {
  return {
    userId: user?.id || null,
    tenantId: user?.tenantId || null,
  };
}

/**
 * Cria um logger com contexto do usuário
 * @param {object} user - Objeto user do req.user
 * @returns {object} Logger com métodos para diferentes níveis
 */
function criarLoggerComContexto(user) {
  const contexto = obterContextoAuditoria(user);

  return {
    info: (msg, data = {}) => {
      console.log(`[${contexto.userId?.substring(0, 8)}] ${msg}`, data);
    },
    warn: (msg, data = {}) => {
      console.warn(`[${contexto.userId?.substring(0, 8)}] ⚠️ ${msg}`, data);
    },
    error: (msg, data = {}) => {
      console.error(`[${contexto.userId?.substring(0, 8)}] ❌ ${msg}`, data);
    },
  };
}

module.exports = {
  validarAcessoMultiTenant,
  obterContextoAuditoria,
  criarLoggerComContexto,
};
