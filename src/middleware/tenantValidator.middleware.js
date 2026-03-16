/**
 * Middleware de Validação de Tenant/Unidade
 * Bloqueia acesso cross-unit: garante que unit_id do usuário corresponde ao unit_id solicitado
 */

/**
 * Bloqueia acesso cross-unit
 * Valida que o unit_id do usuário (req.user.unit_id) corresponde ao da rota
 * @param {string} paramName - Nome do parâmetro na rota (default: 'unitId')
 * @returns {function} Middleware Express
 */
function validateTenant(paramName = "unitId") {
  return (req, res, next) => {
    // Se não houver usuário autenticado, passar para próximo (auth já bloqueou)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Não autenticado",
      });
    }

    // Super Admin bypass (apenas para debugging)
    // Em produção, pode-se remover isso
    const SUPER_ADMIN = "SUPER_ADMIN";
    if (req.user.role === SUPER_ADMIN) {
      return next();
    }

    // Extrair unit_id do parâmetro da rota
    const unitIdFromRoute = req.params[paramName];

    // Se houver unit_id na rota, validar
    if (unitIdFromRoute) {
      if (req.user.unit_id !== unitIdFromRoute) {
        return res.status(403).json({
          success: false,
          error:
            "Acesso negado: você não tem permissão para acessar esta unidade",
          userUnit: req.user.unit_id,
          requestedUnit: unitIdFromRoute,
        });
      }
    }

    // Validar que o usuário tem um unit_id válido
    if (!req.user.unit_id) {
      return res.status(403).json({
        success: false,
        error: "Usuário sem unidade atribuída",
      });
    }

    next();
  };
}

/**
 * Middleware global de tenant validation
 * Adiciona unit_id automaticamente ao req para queries de banco
 * Garante que o usuário sempre acessa dados da sua unidade
 */
function globalTenantValidation(req, res, next) {
  if (req.user) {
    // Passar unit_id para o request para fácil acesso
    req.unit_id = req.user.unit_id;
  }
  next();
}

module.exports = {
  validateTenant,
  globalTenantValidation,
};
