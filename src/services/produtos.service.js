/**
 * Serviço de Produtos - SPRINT 4
 *
 * Integra cliente global Uniplus para buscar e editar produtos
 * Com auditoria de todas as operações
 */

const auditService = require("./audit.service");
const uniplusClient = require("../config/uniplus");
const uniplusService = require("./uniplus.service");
const { connectRedis } = require("../lib/redis");

const AUDIT_TABLE = "produtos_log";
const RESOURCE = "produtos";
const PRODUTOS_PATH = "/v1/produtos";

const CATALOG_CACHE_KEY = "produtos:catalogo:completo";
const CATALOG_CACHE_TTL = 600;

let syncInProgress = null;

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

    const options = {};
    if (filtros.codigo) options.codigo = filtros.codigo;
    if (filtros.nome) options.nome = filtros.nome;
    if (filtros.limit !== undefined) options.limit = filtros.limit;
    if (filtros.offset !== undefined) options.offset = filtros.offset;
    if (filtros.all !== undefined) options.all = filtros.all;

    const data = await uniplusService.listarProdutos(options);
    const resultado = buildListResult(data, {
      limit: filtros.limit,
      offset: filtros.offset || 0,
    });

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

/**
 * Busca todos os produtos da Uniplus e salva no Redis.
 * Previne syncs simultâneos reutilizando a Promise em andamento.
 */
async function sincronizarCatalogoProdutos() {
  if (syncInProgress) {
    return syncInProgress;
  }

  syncInProgress = (async () => {
    try {
      console.log("[produtos-cache] Sincronizando catálogo completo...");
      const data = await uniplusService.listarProdutos({ all: true });
      const todos = extractList(data);
      const lista = todos.filter((p) => !p.inativo);

      console.log(
        `[produtos-cache] ${lista.length} ativos de ${todos.length} total.`,
      );

      const redis = await connectRedis();
      await redis.set(
        CATALOG_CACHE_KEY,
        JSON.stringify(lista),
        "EX",
        CATALOG_CACHE_TTL,
      );

      console.log(
        `[produtos-cache] ${lista.length} produtos salvos no Redis (TTL ${CATALOG_CACHE_TTL}s).`,
      );
      return lista;
    } finally {
      syncInProgress = null;
    }
  })();

  return syncInProgress;
}

/**
 * Retorna todos os produtos do cache Redis, ou dispara sincronização se vazio.
 */
async function buscarCatalogoProdutos() {
  const redis = await connectRedis();
  const cached = await redis.get(CATALOG_CACHE_KEY);

  if (cached) {
    const lista = JSON.parse(cached);
    console.log(`[produtos-cache] Cache HIT: ${lista.length} produtos.`);
    return lista;
  }

  console.log("[produtos-cache] Cache MISS — sincronizando...");
  return sincronizarCatalogoProdutos();
}

module.exports = {
  listarProdutos,
  obterProduto,
  atualizarProduto,
  apagarProduto,
  buscarCatalogoProdutos,
  sincronizarCatalogoProdutos,
};
