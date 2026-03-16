const uniplusService = require("./uniplus.service");
const auditService = require("./audit.service");
const { validarAcessoMultiTenant } = require("./multitenant.service");

const AUDIT_TABLE = "gourmet_log";
const RESOURCE = "gourmet";

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

async function listarContas(options = {}, context = {}) {
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
    const data = await uniplusService.listarContasGourmet(options);
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

async function criarConta(dados, context = {}) {
  try {
    const { userId, userRole, tenantId } = context;
    if (userId && userRole) {
      if (!["admin", "superadmin"].includes(userRole)) {
        const err = new Error(
          "Apenas Admin e SuperAdmin podem criar contas Gourmet",
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
    const resposta = await uniplusService.criarContaGourmet(dados);
    await registrarAuditoria({
      codigo: null,
      payload: dados,
      operacao: "CRIAR",
      status: "SUCESSO",
      userId,
      tenantId,
      ...context,
    });
    return resposta;
  } catch (error) {
    try {
      await registrarAuditoria({
        codigo: null,
        payload: dados,
        operacao: "CRIAR",
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
  listarContas,
  criarConta,
};
