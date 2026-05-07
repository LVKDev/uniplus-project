const auditService = require("./audit.service");
const uniplusService = require("./uniplus.service");

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
  try {
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
  } catch (error) {
    console.error("⚠️ Erro ao registrar auditoria de entidade:", error.message);
  }
}

async function listarEntidades(options = {}, context = {}) {
  try {
    const { userId, tenantId } = context;
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
    const { userId, tenantId } = context;
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
    const { userId, tenantId } = context;
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
    const { userId, tenantId } = context;
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
