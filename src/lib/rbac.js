/**
 * RBAC Centralizado (Role-Based Access Control)
 * Lógica de autorização baseada em roles e permissões granulares
 */

const { ROLES, PERMISSOES_POR_ROLE } = require("../config/constants");

/**
 * Verifica se um usuário tem uma permissão específica
 * @param {object} user - Objeto do usuário (req.user)
 * @param {string} permission - Permissão a validar
 * @returns {boolean} true se tem permissão, false caso contrário
 */
function hasPermission(user, permission) {
  if (!user) return false;

  // Super Admin tem todas as permissões
  if (user.role === ROLES.SUPER_ADMIN) {
    return true;
  }

  // Verificar permissões específicas do usuário
  if (user.permissions && Array.isArray(user.permissions)) {
    return user.permissions.includes(permission);
  }

  return false;
}

/**
 * Verifica se um usuário tem um role específico
 * @param {object} user - Objeto do usuário (req.user)
 * @param {string|array} roles - Role(s) a validar
 * @returns {boolean} true se tem o/um dos roles
 */
function hasRole(user, roles) {
  if (!user) return false;

  const roleList = Array.isArray(roles) ? roles : [roles];
  return roleList.includes(user.role);
}

/**
 * Verifica se um usuário pertence à mesma unidade (unit_id)
 * @param {object} user - Objeto do usuário (req.user)
 * @param {string} unitId - ID da unidade a validar
 * @returns {boolean} true se pertence a mesma unidade
 */
function belongsToUnit(user, unitId) {
  if (!user || !unitId) return false;

  // Super Admin sempre tem acesso (em debug)
  if (user.role === ROLES.SUPER_ADMIN) {
    return true;
  }

  return user.unit_id === unitId;
}

/**
 * Middleware factory para validar permissão
 * Uso: router.get('/path', requirePermission('editar_produtos'), handler)
 * @param {string} permission - Permissão necessária
 * @returns {function} Middleware Express
 */
function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Não autenticado",
      });
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        success: false,
        error: "Permissão negada",
        required: permission,
      });
    }

    next();
  };
}

/**
 * Middleware factory para validar role
 * Uso: router.get('/path', requireRole(ROLES.ADMIN_UNIDADE), handler)
 * @param {string|array} roles - Role(s) necessário(s)
 * @returns {function} Middleware Express
 */
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Não autenticado",
      });
    }

    if (!hasRole(req.user, roles)) {
      return res.status(403).json({
        success: false,
        error: "Role insuficiente para acessar este recurso",
        required: roles,
      });
    }

    next();
  };
}

/**
 * Middleware factory para validar isolamento de unidade (tenant)
 * Uso: router.get('/path', requireSameUnit, handler)
 * Valida que req.params.unitId === req.user.unit_id
 * @returns {function} Middleware Express
 */
function requireSameUnit() {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Não autenticado",
      });
    }

    const unitIdFromParam = req.params.unitId;

    // Se houver unit_id no param, validar
    if (unitIdFromParam && !belongsToUnit(req.user, unitIdFromParam)) {
      return res.status(403).json({
        success: false,
        error: "Acesso negado: unidade diferente",
      });
    }

    next();
  };
}

module.exports = {
  hasPermission,
  hasRole,
  belongsToUnit,
  requirePermission,
  requireRole,
  requireSameUnit,
};
