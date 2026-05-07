/**
 * Serviço de Clientes - SPRINT 4
 *
 * Integra cliente global Uniplus para buscar e editar clientes
 * Com auditoria de todas as operações
 */

const auditService = require("./audit.service");
const uniplusClient = require("../config/uniplus");

const AUDIT_TABLE = "entidades_log";
const RESOURCE = "clientes";
const ENTIDADES_PATH = "/v1/entidades";

function extractList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }

  const keys = ["data", "items", "registros", "records", "content", "conteudo"];
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) {
      return payload[key];
    }
  }

  return [];
}

function buildListResult(payload, params) {
  const items = extractList(payload);
  return {
    items,
    pagination: {
      limit: params.limit,
      offset: params.offset,
      total: payload?.total || items.length,
    },
  };
}

/**
 * Registra auditoria de operação
 */
async function registrarAuditoria({
  codigo,
  payload,
  operacao,
  status,
  rota,
  metodo,
  userId = null,
  unitId = null,
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
      unitId,
    });
  } catch (error) {
    console.error("⚠️ Erro ao registrar auditoria de cliente:", error.message);
  }
}

/**
 * Lista clientes (entidades tipo Cliente) com paginacao
 *
 * @param {object} filtros - {codigo?, nome?, cnpjCpf?, limit?, offset?}
 * @param {object} context - {userId, userRole, unitId}
 * @returns {Promise<object>} {items, pagination}
 */
async function listarClientes(filtros = {}, context = {}) {
  try {
    const { userId, unitId } = context;

    const params = {
      limit: filtros.limit || 25,
      offset: filtros.offset || 0,
    };

    if (filtros.codigo) params["codigo.eq"] = filtros.codigo;
    if (filtros.nome) params["nome.ge"] = filtros.nome;
    if (filtros.cnpjCpf) params["cnpjCpf.eq"] = filtros.cnpjCpf;

    const response = await uniplusClient.get(ENTIDADES_PATH, { params });
    const resultado = buildListResult(response.data, params);

    // Log de auditoria (leitura)
    await registrarAuditoria({
      codigo: null,
      payload: filtros,
      operacao: "LISTAR",
      status: "SUCESSO",
      rota: "/api/clientes",
      metodo: "GET",
      userId,
      unitId,
    });

    return resultado;
  } catch (error) {
    console.error("❌ Erro ao listar clientes:", error.message);

    await registrarAuditoria({
      codigo: null,
      payload: filtros,
      operacao: "LISTAR",
      status: "FALHA",
      rota: "/api/clientes",
      metodo: "GET",
      userId: context.userId,
      unitId: context.unitId,
    });

    throw error;
  }
}

/**
 * Obtém detalhes de um cliente específico
 *
 * @param {string} codigoCliente - Código do cliente (entidade)
 * @param {object} context - {userId, userRole, unitId}
 * @returns {Promise<object>} Cliente
 */
async function obterCliente(codigoCliente, context = {}) {
  try {
    if (!codigoCliente) {
      const error = new Error("Código do cliente é obrigatório");
      error.status = 400;
      throw error;
    }

    const resultado = await listarClientes({
      codigo: codigoCliente,
      limit: 1,
    }, context);
    const cliente = resultado.items?.[0];

    if (!cliente) {
      const error = new Error(`Cliente ${codigoCliente} não encontrado`);
      error.status = 404;
      throw error;
    }

    return cliente;
  } catch (error) {
    console.error(`❌ Erro ao obter cliente ${codigoCliente}:`, error.message);
    throw error;
  }
}

/**
 * Atualiza um cliente na Uniplus
 *
 * @param {string} codigoCliente - Código do cliente (entidade)
 * @param {object} dados - {nome?, endereco?, telefone?, email?, cidade?, estado?}
 * @param {object} context - {userId, userRole, unitId}
 * @returns {Promise<object>} Resultado da atualização
 */
async function atualizarCliente(codigoCliente, dados, context = {}) {
  let dadosValidados = {};
  try {
    const { userId, unitId } = context;

    if (!codigoCliente) {
      const error = new Error("Código do cliente é obrigatório");
      error.status = 400;
      throw error;
    }

    if (!dados || Object.keys(dados).length === 0) {
      const error = new Error("Nenhum dado para atualizar");
      error.status = 400;
      throw error;
    }

    // Validar campos esperados
    const dadosPermitidos = [
      "nome",
      "endereco",
      "telefone",
      "email",
      "cidade",
      "estado",
      "cnpjCpf",
      "ativo",
    ];

    for (const [chave, valor] of Object.entries(dados)) {
      if (
        dadosPermitidos.includes(chave) &&
        valor !== null &&
        valor !== undefined &&
        valor !== ""
      ) {
        // Validar email se presente
        if (chave === "email" && !isValidEmail(valor)) {
          throw new Error("Email inválido");
        }
        dadosValidados[chave] = valor;
      }
    }

    if (Object.keys(dadosValidados).length === 0) {
      throw new Error("Nenhum campo válido para atualizar");
    }

    const response = await uniplusClient.patch(
      `${ENTIDADES_PATH}/${codigoCliente}`,
      dadosValidados,
    );
    const resultado = response.data;

    // Log de auditoria
    await registrarAuditoria({
      codigo: codigoCliente,
      payload: { antes: null, depois: dadosValidados },
      operacao: "ATUALIZAR",
      status: "SUCESSO",
      rota: `/api/clientes/${codigoCliente}`,
      metodo: "PATCH",
      userId,
      unitId,
    });

    return resultado;
  } catch (error) {
    console.error(
      `❌ Erro ao atualizar cliente ${codigoCliente}:`,
      error.message,
    );

    await registrarAuditoria({
      codigo: codigoCliente,
      payload: { campos: Object.keys(dadosValidados) },
      operacao: "ATUALIZAR",
      status: "FALHA",
      rota: `/api/clientes/${codigoCliente}`,
      metodo: "PATCH",
      userId: context.userId,
      unitId: context.unitId,
    });

    throw error;
  }
}

/**
 * Simples validação de email (RFC básico)
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = {
  listarClientes,
  obterCliente,
  atualizarCliente,
};
