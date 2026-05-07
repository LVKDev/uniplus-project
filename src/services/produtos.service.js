/**
 * Serviço de Produtos - SPRINT 4
 *
 * Integra cliente global Uniplus para buscar e editar produtos
 * Com auditoria de todas as operações
 */

const auditService = require("./audit.service");
const uniplusClient = require("../config/uniplus");

const AUDIT_TABLE = "produtos_log";
const RESOURCE = "produtos";
const PRODUTOS_PATH = "/v1/produtos";

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
    console.error("⚠️ Erro ao registrar auditoria de produto:", error.message);
    // Não interrompe uma operação bem-sucedida se a auditoria falhar
  }
}

/**
 * Lista produtos com paginacao
 *
 * @param {object} filtros - {codigo?, nome?, limit?, offset?}
 * @param {object} context - {userId, userRole, unitId}
 * @returns {Promise<object>} {items, pagination}
 */
async function listarProdutos(filtros = {}, context = {}) {
  try {
    const { userId, unitId } = context;

    const params = {
      limit: filtros.limit || 25,
      offset: filtros.offset || 0,
    };

    if (filtros.codigo) params["codigo.eq"] = filtros.codigo;
    if (filtros.nome) params["nome.ge"] = filtros.nome;

    const response = await uniplusClient.get(PRODUTOS_PATH, { params });
    const resultado = buildListResult(response.data, params);

    // Log de auditoria (leitura)
    await registrarAuditoria({
      codigo: null,
      payload: filtros,
      operacao: "LISTAR",
      status: "SUCESSO",
      rota: "/api/produtos",
      metodo: "GET",
      userId,
      unitId,
    });

    return resultado;
  } catch (error) {
    console.error("❌ Erro ao listar produtos:", error.message);

    await registrarAuditoria({
      codigo: null,
      payload: filtros,
      operacao: "LISTAR",
      status: "FALHA",
      rota: "/api/produtos",
      metodo: "GET",
      userId: context.userId,
      unitId: context.unitId,
    });

    throw error;
  }
}

/**
 * Obtém detalhes de um produto específico
 *
 * @param {string} codigoProduto - Código do produto
 * @param {object} context - {userId, userRole, unitId}
 * @returns {Promise<object>} Produto
 */
async function obterProduto(codigoProduto, context = {}) {
  try {
    if (!codigoProduto) {
      const error = new Error("Código do produto é obrigatório");
      error.status = 400;
      throw error;
    }

    const resultado = await listarProdutos({
      codigo: codigoProduto,
      limit: 1,
    }, context);
    const produto = resultado.items?.[0];

    if (!produto) {
      const error = new Error(`Produto ${codigoProduto} não encontrado`);
      error.status = 404;
      throw error;
    }

    return produto;
  } catch (error) {
    console.error(`❌ Erro ao obter produto ${codigoProduto}:`, error.message);
    throw error;
  }
}

/**
 * Atualiza um produto na Uniplus
 *
 * @param {string} codigoProduto - Código do produto
 * @param {object} dados - {preco?, nome?, descricao?}
 * @param {object} context - {userId, userRole, unitId}
 * @returns {Promise<object>} Resultado da atualização
 */
async function atualizarProduto(codigoProduto, dados, context = {}) {
  try {
    const { userId, unitId } = context;

    if (!codigoProduto) {
      const error = new Error("Código do produto é obrigatório");
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
      "preco",
      "nome",
      "descricao",
      "ativo",
      "referencia",
    ];
    const dadosValidados = {};

    for (const [chave, valor] of Object.entries(dados)) {
      if (
        dadosPermitidos.includes(chave) &&
        valor !== null &&
        valor !== undefined
      ) {
        // Validação específica de preço
        if (chave === "preco" && (typeof valor !== "number" || valor < 0)) {
          throw new Error("Preço deve ser um número positivo");
        }
        dadosValidados[chave] = valor;
      }
    }

    if (Object.keys(dadosValidados).length === 0) {
      throw new Error("Nenhum campo válido para atualizar");
    }

    const response = await uniplusClient.patch(
      `${PRODUTOS_PATH}/${codigoProduto}`,
      dadosValidados,
    );
    const resultado = response.data;

    // Log de auditoria
    await registrarAuditoria({
      codigo: codigoProduto,
      payload: { antes: null, depois: dadosValidados },
      operacao: "ATUALIZAR",
      status: "SUCESSO",
      rota: `/api/produtos/${codigoProduto}`,
      metodo: "PATCH",
      userId,
      unitId,
    });

    return resultado;
  } catch (error) {
    console.error(
      `❌ Erro ao atualizar produto ${codigoProduto}:`,
      error.message,
    );

    await registrarAuditoria({
      codigo: codigoProduto,
      payload: dados,
      operacao: "ATUALIZAR",
      status: "FALHA",
      rota: `/api/produtos/${codigoProduto}`,
      metodo: "PATCH",
      userId: context.userId,
      unitId: context.unitId,
    });

    throw error;
  }
}

/**
 * Remove um produto na Uniplus.
 *
 * @param {string} codigoProduto - Código do produto
 * @param {object} context - {userId, unitId}
 * @returns {Promise<object>} Resultado da remoção
 */
async function apagarProduto(codigoProduto, context = {}) {
  try {
    const { userId, unitId } = context;

    if (!codigoProduto) {
      const error = new Error("Código do produto é obrigatório");
      error.status = 400;
      throw error;
    }

    const response = await uniplusClient.delete(
      `${PRODUTOS_PATH}/${codigoProduto}`,
    );
    const resultado = response.data;

    await registrarAuditoria({
      codigo: codigoProduto,
      payload: { codigo: codigoProduto },
      operacao: "APAGAR",
      status: "SUCESSO",
      rota: `/api/produtos/${codigoProduto}`,
      metodo: "DELETE",
      userId,
      unitId,
    });

    return resultado;
  } catch (error) {
    console.error(
      `❌ Erro ao apagar produto ${codigoProduto}:`,
      error.message,
    );

    await registrarAuditoria({
      codigo: codigoProduto,
      payload: { codigo: codigoProduto },
      operacao: "APAGAR",
      status: "FALHA",
      rota: `/api/produtos/${codigoProduto}`,
      metodo: "DELETE",
      userId: context.userId,
      unitId: context.unitId,
    });

    throw error;
  }
}

module.exports = {
  listarProdutos,
  obterProduto,
  atualizarProduto,
  apagarProduto,
};
