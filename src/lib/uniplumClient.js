/**
 * Cliente Uniplus - Por Unidade
 *
 * Wrapper que descriptografa credenciais da unidade e monta cliente axios
 * para requisições à API Uniplus específica da unidade
 *
 * Uso:
 *   const client = await getUniplumClientForUnit(unitId);
 *   const produtos = await client.get('/public-api/produtos');
 */

const axios = require("axios");
const { PrismaClient } = require("@prisma/client");
const { decrypt } = require("./encryption");

const prisma = new PrismaClient();

// Configuração base do Uniplus (opcional - credenciais vão vir por unidade do banco)
// const UNIPLUS_BASE_URL = process.env.UNIPLUS_BASE_URL;
// const UNIPLUS_SERVER_URL = process.env.UNIPLUS_SERVER_URL ||
//   (UNIPLUS_BASE_URL ? UNIPLUS_BASE_URL.replace(/\/public-api\/?$/, "") : null);

// NOTE: Credenciais agora são armazenadas por unidade no banco de dados
// e desencriptadas dinamicamente via getUnidadeFullCredentials()
// Ver: src/services/unidades.service.js -> getUnidadeFullCredentials()

// Cache de tokens (unitId -> {token, expiresAt})
const tokenCache = new Map();

/**
 * Obtém token de acesso para as credenciais da unidade
 * @param {string} uniplumUser - Username Uniplus
 * @param {string} uniplumPass - Password Uniplus
 * @returns {Promise<string>} Access token
 */
async function getAccessToken(uniplumUser, uniplumPass) {
  try {
    // Verificar cache
    const cacheKey = `${uniplumUser}:${uniplumPass}`;
    const cached = tokenCache.get(cacheKey);

    if (cached && Date.now() < cached.expiresAt) {
      return cached.token;
    }

    // Base64 encode para Basic Auth
    const basicAuth = Buffer.from(`${uniplumUser}:${uniplumPass}`).toString(
      "base64",
    );

    // Requisitar token
    const authClient = axios.create({
      baseURL: UNIPLUS_SERVER_URL,
      timeout: 15000,
    });

    const response = await authClient.post(
      "/oauth/token",
      new URLSearchParams({
        grant_type: "client_credentials",
        scope: "public-api",
      }).toString(),
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );

    const { access_token: accessToken, expires_in: expiresIn } = response.data;

    if (!accessToken) {
      throw new Error("Token inválido na resposta da Uniplus");
    }

    // Cache do token (expira 60s antes)
    const ttlMs = (Number(expiresIn) || 3600) * 1000;
    tokenCache.set(cacheKey, {
      token: accessToken,
      expiresAt: Date.now() + ttlMs - 60_000,
    });

    return accessToken;
  } catch (error) {
    console.error("❌ Erro ao obter token Uniplus:", error.message);
    throw new Error(`Falha ao autenticar com Uniplus: ${error.message}`);
  }
}

/**
 * Obtém cliente axios configurado para a unidade
 * Descriptografa credenciais do banco e monta bearer token
 *
 * @param {string} unitId - ID da unidade
 * @returns {Promise<axios.AxiosInstance>} Cliente axios pronto para requisições
 */
async function getUniplumClientForUnit(unitId) {
  try {
    // 1. Buscar unidade no banco
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      const err = new Error(`Unidade não encontrada: ${unitId}`);
      err.status = 404;
      throw err;
    }

    // 2. Verificar se tem credenciais
    if (!unit.credencial_uniplus_user || !unit.credencial_uniplus_pass) {
      const err = new Error(
        `Credenciais Uniplus não configuradas para unidade ${unit.nome}`,
      );
      err.status = 400;
      throw err;
    }

    // 3. Descriptografar credenciais
    let uniplumUser, uniplumPass;
    try {
      uniplumUser = decrypt(unit.credencial_uniplus_user);
      uniplumPass = decrypt(unit.credencial_uniplus_pass);
    } catch (error) {
      const err = new Error(
        `Falha ao descriptografar credenciais: ${error.message}`,
      );
      err.status = 500;
      throw err;
    }

    // 4. Obter token de acesso
    const accessToken = await getAccessToken(uniplumUser, uniplumPass);

    // 5. Criar e retornar cliente axios
    const client = axios.create({
      baseURL: UNIPLUS_BASE_URL,
      timeout: 15000,
    });

    // Interceptor para adicionar Authorization header
    client.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${accessToken}`;
      return config;
    });

    // Interceptor para tratar erros
    client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado, limpar cache
          tokenCache.clear();
          console.warn(
            "⚠️ Token Uniplus expirado, será renovado na próxima requisição",
          );
        }
        return Promise.reject(error);
      },
    );

    return client;
  } catch (error) {
    console.error(
      `❌ Erro ao criar cliente Uniplus para unidade ${unitId}:`,
      error.message,
    );
    throw error;
  }
}

/**
 * Extrai lista de dados da resposta Uniplus
 * A API pode retornar dados em diferentes estruturas
 *
 * @param {object} response - Response data
 * @returns {array} Lista de items
 */
function extractList(response) {
  if (Array.isArray(response)) {
    return response;
  }

  // Tentar chaves comuns
  const keys = ["data", "items", "registros", "records", "content", "conteudo"];
  for (const key of keys) {
    if (Array.isArray(response[key])) {
      return response[key];
    }
  }

  // Se não encontrou, retorna array vazio
  console.warn(
    "⚠️ Não foi possível extrair lista da resposta:",
    Object.keys(response),
  );
  return [];
}

/**
 * Lista produtos da Uniplus
 *
 * @param {string} unitId - ID da unidade
 * @param {object} filtros - {codigo?, nome?, limit?, offset?}
 * @returns {Promise<object>} {items: [], pagination: {total, limit, offset}}
 */
async function getProdutos(unitId, filtros = {}) {
  try {
    const client = await getUniplumClientForUnit(unitId);

    const params = {
      limit: filtros.limit || 25,
      offset: filtros.offset || 0,
    };

    if (filtros.codigo) params.codigo = filtros.codigo;
    if (filtros.nome) params.nome = filtros.nome;

    const response = await client.get("/public-api/produtos", { params });
    const items = extractList(response.data);

    return {
      items,
      pagination: {
        limit: params.limit,
        offset: params.offset,
        total: response.data.total || items.length,
      },
    };
  } catch (error) {
    console.error(
      `❌ Erro ao buscar produtos da unidade ${unitId}:`,
      error.message,
    );
    throw error;
  }
}

/**
 * Atualiza um produto na Uniplus
 *
 * @param {string} unitId - ID da unidade
 * @param {string} codigoProduto - Código do produto
 * @param {object} dados - {preco?, nome?, descricao?}
 * @returns {Promise<object>} Resposta da Uniplus
 */
async function atualizarProduto(unitId, codigoProduto, dados) {
  try {
    if (!codigoProduto || !dados || Object.keys(dados).length === 0) {
      throw new Error("Código do produto e dados são obrigatórios");
    }

    const client = await getUniplumClientForUnit(unitId);
    const response = await client.patch(
      `/public-api/produtos/${codigoProduto}`,
      dados,
    );

    return response.data;
  } catch (error) {
    console.error(
      `❌ Erro ao atualizar produto ${codigoProduto} da unidade ${unitId}:`,
      error.message,
    );
    throw error;
  }
}

/**
 * Lista clientes (entidades tipo Cliente) da Uniplus
 *
 * @param {string} unitId - ID da unidade
 * @param {object} filtros - {codigo?, nome?, cnpjCpf?, limit?, offset?}
 * @returns {Promise<object>} {items: [], pagination: {total, limit, offset}}
 */
async function getClientes(unitId, filtros = {}) {
  try {
    const client = await getUniplumClientForUnit(unitId);

    const params = {
      tipo: "C", // Cliente
      limit: filtros.limit || 25,
      offset: filtros.offset || 0,
    };

    if (filtros.codigo) params.codigo = filtros.codigo;
    if (filtros.nome) params.nome = filtros.nome;
    if (filtros.cnpjCpf) params.cnpjCpf = filtros.cnpjCpf;

    const response = await client.get("/public-api/entidades", { params });
    const items = extractList(response.data);

    return {
      items,
      pagination: {
        limit: params.limit,
        offset: params.offset,
        total: response.data.total || items.length,
      },
    };
  } catch (error) {
    console.error(
      `❌ Erro ao buscar clientes da unidade ${unitId}:`,
      error.message,
    );
    throw error;
  }
}

/**
 * Atualiza um cliente na Uniplus
 *
 * @param {string} unitId - ID da unidade
 * @param {string} codigoCliente - Código do cliente (entidade)
 * @param {object} dados - {nome?, endereco?, telefone?, email?}
 * @returns {Promise<object>} Resposta da Uniplus
 */
async function atualizarCliente(unitId, codigoCliente, dados) {
  try {
    if (!codigoCliente || !dados || Object.keys(dados).length === 0) {
      throw new Error("Código do cliente e dados são obrigatórios");
    }

    const client = await getUniplumClientForUnit(unitId);
    const response = await client.patch(
      `/public-api/entidades/${codigoCliente}`,
      dados,
    );

    return response.data;
  } catch (error) {
    console.error(
      `❌ Erro ao atualizar cliente ${codigoCliente} da unidade ${unitId}:`,
      error.message,
    );
    throw error;
  }
}

/**
 * Estados e cidades do Brasil (seed local)
 * Usaremos para dropdown de localização
 */
function getCidadesEstados() {
  return [
    {
      estado: "SP",
      cidades: ["São Paulo", "Campinas", "Ribeirão Preto", "Bauru", "Sorocaba"],
    },
    {
      estado: "RJ",
      cidades: [
        "Rio de Janeiro",
        "Niterói",
        "Duque de Caxias",
        "São João de Meriti",
      ],
    },
    {
      estado: "MG",
      cidades: [
        "Belo Horizonte",
        "Uberlândia",
        "Juiz de Fora",
        "Montes Claros",
      ],
    },
    {
      estado: "BA",
      cidades: [
        "Salvador",
        "Feira de Santana",
        "Vitória da Conquista",
        "Ilhéus",
      ],
    },
    {
      estado: "SC",
      cidades: ["Florianópolis", "Blumenau", "Joinville", "Chapecó"],
    },
    {
      estado: "RS",
      cidades: ["Porto Alegre", "Caxias do Sul", "Pelotas", "Santa Maria"],
    },
    {
      estado: "PA",
      cidades: ["Belém", "Ananindeua", "Santarém", "Marabá"],
    },
    {
      estado: "CE",
      cidades: ["Fortaleza", "Caucaia", "Juazeiro do Norte", "Maracanaú"],
    },
    {
      estado: "PE",
      cidades: ["Recife", "Jaboatão dos Guararapes", "Olinda", "Caruaru"],
    },
    {
      estado: "PR",
      cidades: ["Curitiba", "Londrina", "Maringá", "Ponta Grossa"],
    },
  ];
}

module.exports = {
  getUniplumClientForUnit,
  getProdutos,
  atualizarProduto,
  getClientes,
  atualizarCliente,
  getCidadesEstados,
};
