const portalClient = require("../config/portal");
const auditService = require("./audit.service");
const { validarAcessoMultiTenant } = require("./multitenant.service");

const AUDIT_TABLE = "portal_comercial_log";
const RESOURCE = "portal-comercial";

async function registrarAuditoria({
  codigo,
  payload,
  operacao,
  status,
  rota,
  metodo,
  userId = null,
  tenantId = null,
}) {
  await auditService.registrarAuditoria({
    table: AUDIT_TABLE,
    recurso: RESOURCE,
    rota,
    metodo,
    codigo,
    payload,
    operacao,
    status,
    userId,
    tenantId,
  });
}

async function bloquearContrato(cpfCnpj, context = {}) {
  try {
    const { userId, userRole, tenantId } = context;
    if (userId && userRole) {
      if (!["admin", "superadmin"].includes(userRole)) {
        const err = new Error(
          "Apenas Admin e SuperAdmin podem bloquear contratos",
        );
        err.status = 403;
        throw err;
      }
      const { canAccess, reason } = await validarAcessoMultiTenant(
        userId,
        userRole,
        tenantId,
      );
      if (!canAccess) {
        const err = new Error(`Acesso negado: ${reason}`);
        err.status = 403;
        throw err;
      }
    }
    const response = await portalClient.post(`/bloquear-contrato/${cpfCnpj}`);
    await registrarAuditoria({
      codigo: cpfCnpj,
      payload: { cpfCnpj },
      operacao: "BLOQUEAR",
      status: "SUCESSO",
      userId,
      tenantId,
      ...context,
    });
    return response.data;
  } catch (error) {
    try {
      await registrarAuditoria({
        codigo: cpfCnpj,
        payload: { cpfCnpj },
        operacao: "BLOQUEAR",
        status: "FALHA",
        userId: context?.userId,
        tenantId: context?.tenantId,
        ...context,
      });
    } catch (auditError) {
      error.auditError = auditError.message;
    }
    throw error;
  }
}

async function desbloquearContrato(cpfCnpj, context = {}) {
  try {
    const { userId, userRole, tenantId } = context;
    if (userId && userRole) {
      if (!["admin", "superadmin"].includes(userRole)) {
        const err = new Error(
          "Apenas Admin e SuperAdmin podem desbloquear contratos",
        );
        err.status = 403;
        throw err;
      }
      const { canAccess, reason } = await validarAcessoMultiTenant(
        userId,
        userRole,
        tenantId,
      );
      if (!canAccess) {
        const err = new Error(`Acesso negado: ${reason}`);
        err.status = 403;
        throw err;
      }
    }
    const response = await portalClient.post(
      `/desbloquear-contrato/${cpfCnpj}`,
    );
    await registrarAuditoria({
      codigo: cpfCnpj,
      payload: { cpfCnpj },
      operacao: "DESBLOQUEAR",
      status: "SUCESSO",
      userId,
      tenantId,
      ...context,
    });
    return response.data;
  } catch (error) {
    try {
      await registrarAuditoria({
        codigo: cpfCnpj,
        payload: { cpfCnpj },
        operacao: "DESBLOQUEAR",
        status: "FALHA",
        userId: context?.userId,
        tenantId: context?.tenantId,
        ...context,
      });
    } catch (auditError) {
      error.auditError = auditError.message;
    }
    throw error;
  }
}

async function listarContratos(context = {}) {
  try {
    const { userId, userRole, tenantId } = context;
    if (userId && userRole) {
      const { canAccess, reason } = await validarAcessoMultiTenant(
        userId,
        userRole,
        tenantId,
      );
      if (!canAccess) {
        const err = new Error(`Acesso negado: ${reason}`);
        err.status = 403;
        throw err;
      }
    }
    const response = await portalClient.get("/contratos");
    await registrarAuditoria({
      codigo: null,
      payload: {},
      operacao: "LISTAR",
      status: "SUCESSO",
      userId,
      tenantId,
      ...context,
    });
    return response.data;
  } catch (error) {
    try {
      await registrarAuditoria({
        codigo: null,
        payload: {},
        operacao: "LISTAR",
        status: "FALHA",
        userId: context?.userId,
        tenantId: context?.tenantId,
        ...context,
      });
    } catch (auditError) {
      error.auditError = auditError.message;
    }
    throw error;
  }
}

async function listarContratosPorStatus(status, context = {}) {
  try {
    const { userId, userRole, tenantId } = context;
    if (userId && userRole) {
      const { canAccess, reason } = await validarAcessoMultiTenant(
        userId,
        userRole,
        tenantId,
      );
      if (!canAccess) {
        const err = new Error(`Acesso negado: ${reason}`);
        err.status = 403;
        throw err;
      }
    }
    const response = await portalClient.get(`/contratos/${status}`);
    await registrarAuditoria({
      codigo: null,
      payload: { status },
      operacao: "LISTAR",
      status: "SUCESSO",
      userId,
      tenantId,
      ...context,
    });
    return response.data;
  } catch (error) {
    try {
      await registrarAuditoria({
        codigo: null,
        payload: { status },
        operacao: "LISTAR",
        status: "FALHA",
        userId: context?.userId,
        tenantId: context?.tenantId,
        ...context,
      });
    } catch (auditError) {
      error.auditError = auditError.message;
    }
    throw error;
  }
}

async function obterContratoPorCpfCnpj(cpfCnpj, context = {}) {
  try {
    const { userId, userRole, tenantId } = context;
    if (userId && userRole) {
      const { canAccess, reason } = await validarAcessoMultiTenant(
        userId,
        userRole,
        tenantId,
      );
      if (!canAccess) {
        const err = new Error(`Acesso negado: ${reason}`);
        err.status = 403;
        throw err;
      }
    }
    const response = await portalClient.get(`/contrato/${cpfCnpj}`);
    await registrarAuditoria({
      codigo: cpfCnpj,
      payload: { cpfCnpj },
      operacao: "CONSULTAR",
      status: "SUCESSO",
      userId,
      tenantId,
      ...context,
    });
    return response.data;
  } catch (error) {
    try {
      await registrarAuditoria({
        codigo: cpfCnpj,
        payload: { cpfCnpj },
        operacao: "CONSULTAR",
        status: "FALHA",
        userId: context?.userId,
        tenantId: context?.tenantId,
        ...context,
      });
    } catch (auditError) {
      error.auditError = auditError.message;
    }
    throw error;
  }
}

async function obterContratoPorCpfCnpjEStatus(cpfCnpj, status, context = {}) {
  try {
    const { userId, userRole, tenantId } = context;
    if (userId && userRole) {
      const { canAccess, reason } = await validarAcessoMultiTenant(
        userId,
        userRole,
        tenantId,
      );
      if (!canAccess) {
        const err = new Error(`Acesso negado: ${reason}`);
        err.status = 403;
        throw err;
      }
    }
    const response = await portalClient.get(`/contrato/${cpfCnpj}/${status}`);
    await registrarAuditoria({
      codigo: cpfCnpj,
      payload: { cpfCnpj, status },
      operacao: "CONSULTAR",
      status: "SUCESSO",
      userId,
      tenantId,
      ...context,
    });
    return response.data;
  } catch (error) {
    try {
      await registrarAuditoria({
        codigo: cpfCnpj,
        payload: { cpfCnpj, status },
        operacao: "CONSULTAR",
        status: "FALHA",
        userId: context?.userId,
        tenantId: context?.tenantId,
        ...context,
      });
    } catch (auditError) {
      error.auditError = auditError.message;
    }
    throw error;
  }
}

module.exports = {
  bloquearContrato,
  desbloquearContrato,
  listarContratos,
  listarContratosPorStatus,
  obterContratoPorCpfCnpj,
  obterContratoPorCpfCnpjEStatus,
};
