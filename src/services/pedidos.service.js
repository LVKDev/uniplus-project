const auditService = require("./audit.service");
const uniplusService = require("./uniplus.service");

const AUDIT_TABLE = "pedidos_log";
const RESOURCE = "pedidos";

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
  // Saving raw JSON is useful for traceability and future reprocessing.
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
    console.error("⚠️ Erro ao registrar auditoria de pedido:", error.message);
  }
}

async function listarPedidos(options = {}, context = {}) {
  try {
    const { userId, tenantId } = context;

    const data = await uniplusService.listarPedidos(options);
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

async function obterPedidoPorCodigo(codigo, context = {}) {
  try {
    const { userId, tenantId } = context;

    const data = await uniplusService.obterPedidoPorCodigo(codigo);
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

async function criarPedido(dados, context = {}) {
  try {
    const { userId, tenantId } = context;

    const resposta = await uniplusService.criarPedido(dados);
    const codigo = resposta?.codigo || resposta?.id || null;

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
        payload: { cliente: dados?.cliente, itensCount: dados?.itens?.length },
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

async function atualizarPedido(dados, context = {}) {
  try {
    const { userId, tenantId } = context;

    const resposta = await uniplusService.atualizarPedido(dados);
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
        payload: { codigo: dados?.codigo, cliente: dados?.cliente },
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

async function apagarPedido(codigo, context = {}) {
  try {
    const { userId, tenantId } = context;

    const resposta = await uniplusService.apagarPedido(codigo);

    await registrarAuditoria({
      codigo,
      payload: { codigo },
      operacao: "APAGAR",
      status: "SUCESSO",
      userId,
      tenantId,
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
  listarPedidos,
  criarPedido,
  atualizarPedido,
  apagarPedido,
  obterPedidoPorCodigo,
};
