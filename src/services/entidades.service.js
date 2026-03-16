const auditService = require("./audit.service");
const uniplusService = require("./uniplus.service");
const { validarAcessoMultiTenant } = require("./multitenant.service");

const AUDIT_TABLE = "entidades_log";
const RESOURCE = "entidades";

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

async function listarEntidades(options = {}, context = {}) {
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
    const data = await uniplusService.listarEntidades(options);
    await registrarAuditoria({
      codigo: null,
      payload: options?.params || options,
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
        payload: options?.params || options,
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

async function obterEntidadePorCodigo(codigo, context = {}) {
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
    const data = await uniplusService.obterEntidadePorCodigo(codigo);
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

async function criarEntidade(dados, context = {}) {
  try {
    const { userId, userRole, tenantId } = context;
    if (userId && userRole) {
      if (!["admin", "superadmin"].includes(userRole)) {
        const err = new Error(
          "Apenas Admin e SuperAdmin podem criar entidades",
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
    const resposta = await uniplusService.criarEntidade(dados);
    const codigo = resposta?.codigo || dados?.codigo || null;

    await registrarAuditoria({
      codigo,
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
        codigo: dados?.codigo || null,
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

async function atualizarEntidade(dados, context = {}) {
  try {
    const { userId, userRole, tenantId } = context;
    if (userId && userRole) {
      if (!["admin", "superadmin"].includes(userRole)) {
        const err = new Error(
          "Apenas Admin e SuperAdmin podem atualizar entidades",
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
    const resposta = await uniplusService.atualizarEntidade(dados);
    const codigo = resposta?.codigo || dados?.codigo || null;

    await registrarAuditoria({
      codigo,
      payload: dados,
      operacao: "ATUALIZAR",
      status: "SUCESSO",
      userId,
      tenantId,
      ...context,
    });

    return resposta;
  } catch (error) {
    try {
      await registrarAuditoria({
        codigo: dados?.codigo || null,
        payload: dados,
        operacao: "ATUALIZAR",
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

async function apagarEntidade(codigo, context = {}) {
  try {
    const resposta = await uniplusService.apagarEntidade(codigo);

    await registrarAuditoria({
      codigo,
      payload: { codigo },
      operacao: "APAGAR",
      status: "SUCESSO",
      ...context,
    });

    return resposta;
  } catch (error) {
    try {
      await registrarAuditoria({
        codigo,
        payload: { codigo },
        operacao: "APAGAR",
        status: "FALHA",
        ...context,
      });
    } catch (auditError) {
      error.auditError = auditError.message;
    }
    throw error;
  }
}

module.exports = {
  listarEntidades,
  obterEntidadePorCodigo,
  criarEntidade,
  atualizarEntidade,
  apagarEntidade,
};
