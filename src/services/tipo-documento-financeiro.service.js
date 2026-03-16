const uniplusService = require("./uniplus.service");
const auditService = require("./audit.service");
const { validarAcessoMultiTenant } = require("./multitenant.service");

const AUDIT_TABLE = "tipo_documento_financeiro_log";
const RESOURCE = "tipo-documento-financeiro";

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

async function listarTiposDocumentoFinanceiro(options = {}, context = {}) {
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
    const data = await uniplusService.listarTiposDocumentoFinanceiro(options);
    await registrarAuditoria({
      codigo: null,
      payload: options,
      operacao: "LISTAR",
      status: "SUCESSO",
      userId,
      tenantId,
      ...context,
    });
    return data;
  } catch (error) {
    try {
      await registrarAuditoria({
        codigo: null,
        payload: options,
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

async function obterTipoDocumentoFinanceiroPorCodigo(codigo, context = {}) {
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
    const data =
      await uniplusService.obterTipoDocumentoFinanceiroPorCodigo(codigo);
    await registrarAuditoria({
      codigo,
      payload: { codigo },
      operacao: "CONSULTAR",
      status: "SUCESSO",
      userId,
      tenantId,
      ...context,
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
        ...context,
      });
    } catch (auditError) {
      error.auditError = auditError.message;
    }
    throw error;
  }
}

module.exports = {
  listarTiposDocumentoFinanceiro,
  obterTipoDocumentoFinanceiroPorCodigo,
};
