const auditService = require("./audit.service");
const uniplusService = require("./uniplus.service");
const { validarAcessoMultiTenant } = require("./multitenant.service");

const AUDIT_TABLE = "ordens_servico_log";
const RESOURCE = "ordens-servico";

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

async function listarOrdensServico(options = {}, context = {}) {
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
    const data = await uniplusService.listarOrdensServico(options);
    await registrarAuditoria({
      codigo: null,
      payload: options?.params || options,
      operacao: "LISTAR",
      status: "SUCESSO",
      userId,
      tenantId,
    });
    return data;
  } catch (error) {
    try {
      await registrarAuditoria({
        codigo: null,
        payload: options?.params || options,
        operacao: "LISTAR",
        status: "FALHA",
        userId: context?.userId,
        tenantId: context?.tenantId,
      });
    } catch (auditError) {
      error.auditError = auditError.message;
    }
    throw error;
  }
}

async function obterOrdemServicoPorCodigo(codigo, context = {}) {
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
    const data = await uniplusService.obterOrdemServicoPorCodigo(codigo);
    await registrarAuditoria({
      codigo,
      payload: { codigo },
      operacao: "CONSULTAR",
      status: "SUCESSO",
      userId,
      tenantId,
    });
    return data;
  } catch (error) {
    try {
      await registrarAuditoria({
        codigo,
        payload: { codigo },
        operacao: "CONSULTAR",
        status: "FALHA",
        userId: context?.userId,
        tenantId: context?.tenantId,
      });
    } catch (auditError) {
      error.auditError = auditError.message;
    }
    throw error;
  }
}

module.exports = {
  listarOrdensServico,
  obterOrdemServicoPorCodigo,
};
