/**
 * Serviço de Produtos - SPRINT 4
 *
 * Integra uniplumClient para buscar e editar produtos da Uniplus
 * Com auditoria de todas as operações
 * Usa unitId para isolamento multi-tenant
 */

const auditService = require("./audit.service");
const {
  getProdutos: getUniplusProdutos,
  atualizarProduto: atualizarUniplusProduto,
} = require("../lib/uniplumClient");

const AUDIT_TABLE = "produtos_log";
const RESOURCE = "produtos";

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
 * Lista produtos da unidade com paginação
 *
 * @param {object} filtros - {codigo?, nome?, limit?, offset?}
 * @param {object} context - {userId, userRole, unitId}
 * @returns {Promise<object>} {items, pagination}
 */
async function listarProdutos(filtros = {}, context = {}) {
  try {
    const { userId, unitId } = context;

    if (!unitId) {
      const error = new Error("Unit ID não fornecido no contexto");
      error.status = 400;
      throw error;
    }

    // Chamar Uniplus via cliente descriptografado
    const resultado = await getUniplusProdutos(unitId, filtros);

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
    const { userId, unitId } = context;

    if (!unitId) {
      const error = new Error("Unit ID não fornecido");
      error.status = 400;
      throw error;
    }

    if (!codigoProduto) {
      const error = new Error("Código do produto é obrigatório");
      error.status = 400;
      throw error;
    }

    // Buscar produto específico por código
    const resultado = await getUniplusProdutos(unitId, {
      codigo: codigoProduto,
      limit: 1,
    });
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

    // Validações
    if (!unitId) {
      const error = new Error("Unit ID não fornecido");
      error.status = 400;
      throw error;
    }

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

    // Chamar Uniplus
    const resultado = await atualizarUniplusProduto(
      unitId,
      codigoProduto,
      dadosValidados,
    );

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

module.exports = {
  listarProdutos,
  obterProduto,
  atualizarProduto,
};
