const auditService = require("./audit.service");
const uniplusService = require("./uniplus.service");
const {
  validarAcessoMultiTenant,
  obterContextoAuditoria,
} = require("./multitenant.service");

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

async function listarPedidos(options = {}, context = {}) {
  try {
    // Extrair userId e userRole do context
    const { userId, userRole, tenantId } = context;

    // Validar acesso multi-tenant
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
    // Extrair userId e userRole do context
    const { userId, userRole, tenantId } = context;

    // Validar acesso multi-tenant
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
    // Extrair userId e userRole do context
    const { userId, userRole, tenantId } = context;

    // Validar acesso multi-tenant (apenas admin e superadmin podem criar)
    if (userId && userRole) {
      if (!["admin", "superadmin"].includes(userRole)) {
        const err = new Error("Apenas Admin e SuperAdmin podem criar pedidos");
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

async function atualizarPedido(dados, context = {}) {
  try {
    // Extrair userId e userRole do context
    const { userId, userRole, tenantId } = context;

    // Validar acesso multi-tenant (apenas admin e superadmin podem atualizar)
    if (userId && userRole) {
      if (!["admin", "superadmin"].includes(userRole)) {
        const err = new Error(
          "Apenas Admin e SuperAdmin podem atualizar pedidos",
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

async function apagarPedido(codigo, context = {}) {
  try {
    // Extrair userId e userRole do context
    const { userId, userRole, tenantId } = context;

    // Validar acesso multi-tenant (apenas admin e superadmin podem apagar)
    if (userId && userRole) {
      if (!["admin", "superadmin"].includes(userRole)) {
        const err = new Error("Apenas Admin e SuperAdmin podem apagar pedidos");
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
