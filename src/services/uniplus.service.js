const uniplusClient = require("../config/uniplus");
const {
  DEFAULT_LIMIT,
  MAX_PAGE_SIZE,
  MAX_PAGES,
  ALL_LIMIT,
  LIST_KEYS,
} = require("../config/constants");

// Base path for UniPlus DAVs (pedidos).
const DAVS_PATH = "/v1/davs";
const ENTIDADES_PATH = "/v1/entidades";
const PRODUTOS_PATH = "/v1/produtos";
const ORDEM_SERVICO_PATH = "/v1/ordem-servico";
const VENDAS_PATH = "/v2/venda";
const VENDAS_ITENS_PATH = "/v2/venda-item";
const MOVIMENTACAO_ESTOQUE_PATH = "/v2/movimentacao-estoque";
const ARQUIVOS_PATH = "/v1/arquivos/buscar";
const TIPO_DOCUMENTO_FINANCEIRO_PATH = "/v1/tipo-documento-financeiro";
const GOURMET_CONTA_PATH = "/v1/gourmet/conta";

function extrairLista(payload) {
  if (Array.isArray(payload)) {
    return { list: payload, wrapperKey: null };
  }

  if (payload && typeof payload === "object") {
    for (const key of LIST_KEYS) {
      if (Array.isArray(payload[key])) {
        return { list: payload[key], wrapperKey: key };
      }
    }
  }

  return { list: null, wrapperKey: null };
}

async function listarTodasPaginas(path, baseParams = {}) {
  const params = { ...baseParams };
  const limit = Number(params.limit) || DEFAULT_LIMIT;
  let offset = Number(params.offset) || 0;
  let pagina = 0;
  let acumuladoArray = [];
  let acumuladoWrapper = null;
  let wrapperKey = null;

  while (pagina < MAX_PAGES) {
    const response = await uniplusClient.get(path, {
      params: {
        ...params,
        limit,
        offset,
      },
    });

    const data = response.data;
    const { list, wrapperKey: currentKey } = extrairLista(data);
    if (!list) {
      return data;
    }

    if (currentKey) {
      if (!acumuladoWrapper) {
        wrapperKey = currentKey;
        acumuladoWrapper = { ...data, [wrapperKey]: [] };
      }

      acumuladoWrapper[wrapperKey] = acumuladoWrapper[wrapperKey].concat(list);

      if (list.length < limit) {
        return acumuladoWrapper;
      }
    } else {
      acumuladoArray = acumuladoArray.concat(list);
      if (list.length < limit) {
        return acumuladoArray;
      }
    }

    offset += limit;
    pagina += 1;
  }

  const err = new Error("Limite de paginas excedido ao listar registros.");
  err.status = 500;
  throw err;
}

async function listarPedidos(options = {}) {
  try {
    const params = options.params ? { ...options.params } : {};

    if (!options.params) {
      if (options.offset !== undefined) params.offset = options.offset;
      if (options.limit !== undefined) params.limit = options.limit;
      if (options.cliente) params["cliente.eq"] = options.cliente;
      if (options.codigo) params["codigo.eq"] = options.codigo;
      if (options.status) params["status.eq"] = options.status;
    }

    if (options.all === true) {
      const pageLimit = Math.min(ALL_LIMIT, MAX_PAGE_SIZE);
      return await listarTodasPaginas(DAVS_PATH, { ...params, limit: pageLimit });
    }

    if (params.limit !== undefined) {
      params.limit = Math.min(Number(params.limit), MAX_PAGE_SIZE);
    }

    const response = await uniplusClient.get(DAVS_PATH, { params });
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao listar pedidos na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function listarEntidades(options = {}) {
  try {
    const params = options.params ? { ...options.params } : {};

    if (options.limit !== undefined && params.limit === undefined) {
      params.limit = options.limit;
    }
    if (options.offset !== undefined && params.offset === undefined) {
      params.offset = options.offset;
    }

    if (!options.params) {
      if (options.offset !== undefined) {
        params.offset = options.offset;
      }

      if (options.limit !== undefined) {
        params.limit = options.limit;
      }

      if (options.codigo) {
        params["codigo.eq"] = options.codigo;
      }

      if (options.nome) {
        params["nome.ge"] = options.nome;
      }

      if (options.cnpjCpf) {
        params["cnpjCpf.eq"] = options.cnpjCpf;
      }
    }

    const carregarTudo =
      options.all === true ||
      (options.all === undefined &&
        params.limit === undefined &&
        params.offset === undefined);
    if (carregarTudo) {
      const pageLimit = Math.min(ALL_LIMIT, MAX_PAGE_SIZE);
      return await listarTodasPaginas(ENTIDADES_PATH, {
        ...params,
        limit: pageLimit,
      });
    }

    if (params.limit !== undefined) {
      params.limit = Math.min(Number(params.limit), MAX_PAGE_SIZE);
    }

    const response = await uniplusClient.get(ENTIDADES_PATH, { params });
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao listar entidades na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function listarProdutos(options = {}) {
  try {
    const params = options.params ? { ...options.params } : {};

    if (options.limit !== undefined && params.limit === undefined) {
      params.limit = options.limit;
    }
    if (options.offset !== undefined && params.offset === undefined) {
      params.offset = options.offset;
    }

    if (!options.params) {
      if (options.offset !== undefined) {
        params.offset = options.offset;
      }

      if (options.limit !== undefined) {
        params.limit = options.limit;
      }

      if (options.codigo) {
        params["codigo.eq"] = options.codigo;
      }

      if (options.nome) {
        params["nome.ge"] = options.nome;
      }
    }

    const carregarTudo =
      options.all === true ||
      (options.all === undefined &&
        params.limit === undefined &&
        params.offset === undefined);
    if (carregarTudo) {
      const pageLimit = Math.min(ALL_LIMIT, MAX_PAGE_SIZE);
      return await listarTodasPaginas(PRODUTOS_PATH, {
        ...params,
        limit: pageLimit,
      });
    }

    if (params.limit !== undefined) {
      params.limit = Math.min(Number(params.limit), MAX_PAGE_SIZE);
    }

    const response = await uniplusClient.get(PRODUTOS_PATH, { params });
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao listar produtos na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function listarOrdensServico(options = {}) {
  try {
    const params = options.params ? { ...options.params } : {};
    const response = await uniplusClient.get(ORDEM_SERVICO_PATH, { params });
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao listar ordens de servico na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function listarVendas(options = {}) {
  try {
    const params = options.params ? { ...options.params } : {};
    const response = await uniplusClient.get(VENDAS_PATH, { params });
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao listar vendas na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function listarVendasItens(options = {}) {
  try {
    const params = options.params ? { ...options.params } : {};
    const response = await uniplusClient.get(VENDAS_ITENS_PATH, { params });
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao listar itens de venda na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function listarMovimentacaoEstoque(options = {}) {
  try {
    const params = options.params ? { ...options.params } : {};
    const response = await uniplusClient.get(MOVIMENTACAO_ESTOQUE_PATH, {
      params,
    });
    return response.data;
  } catch (error) {
    const err = new Error(
      "Falha ao listar movimentacao de estoque na UniPlus.",
    );
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function listarArquivos(options = {}) {
  try {
    const params = options.params ? { ...options.params } : {};
    const response = await uniplusClient.get(ARQUIVOS_PATH, { params });
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao listar arquivos na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function listarTiposDocumentoFinanceiro(options = {}) {
  try {
    const params = options.params ? { ...options.params } : {};
    const response = await uniplusClient.get(TIPO_DOCUMENTO_FINANCEIRO_PATH, {
      params,
    });
    return response.data;
  } catch (error) {
    const err = new Error(
      "Falha ao listar tipos de documentos financeiros na UniPlus.",
    );
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function obterTipoDocumentoFinanceiroPorCodigo(codigo) {
  try {
    const response = await uniplusClient.get(
      `${TIPO_DOCUMENTO_FINANCEIRO_PATH}/${codigo}`,
    );
    return response.data;
  } catch (error) {
    const err = new Error(
      "Falha ao obter tipo de documento financeiro na UniPlus.",
    );
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function listarContasGourmet(options = {}) {
  try {
    const params = options.params ? { ...options.params } : {};
    const response = await uniplusClient.get(GOURMET_CONTA_PATH, { params });
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao listar contas Gourmet na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function criarContaGourmet(dados) {
  try {
    const response = await uniplusClient.post(GOURMET_CONTA_PATH, dados);
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao criar conta Gourmet na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function obterPedidoPorCodigo(codigo) {
  try {
    const response = await uniplusClient.get(`${DAVS_PATH}/${codigo}`);
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao obter pedido na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function obterOrdemServicoPorCodigo(codigo) {
  try {
    const response = await uniplusClient.get(`${ORDEM_SERVICO_PATH}/${codigo}`);
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao obter ordem de servico na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function obterEntidadePorCodigo(codigo) {
  try {
    const response = await uniplusClient.get(`${ENTIDADES_PATH}/${codigo}`);
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao obter entidade na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function obterProdutoPorCodigo(codigo) {
  try {
    const response = await uniplusClient.get(`${PRODUTOS_PATH}/${codigo}`);
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao obter produto na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function criarProduto(dados) {
  try {
    const response = await uniplusClient.post(PRODUTOS_PATH, dados);
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao criar produto na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function atualizarProduto(dados) {
  try {
    const response = await uniplusClient.put(PRODUTOS_PATH, dados);
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao atualizar produto na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function apagarProduto(codigo) {
  try {
    const response = await uniplusClient.delete(`${PRODUTOS_PATH}/${codigo}`);
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao apagar produto na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function criarPedido(dados) {
  try {
    const response = await uniplusClient.post(DAVS_PATH, dados);
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao criar pedido na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function atualizarPedido(dados) {
  try {
    const response = await uniplusClient.put(DAVS_PATH, dados);
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao atualizar pedido na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function apagarPedido(codigo) {
  try {
    const response = await uniplusClient.delete(`${DAVS_PATH}/${codigo}`);
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao apagar pedido na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function criarEntidade(dados) {
  try {
    const response = await uniplusClient.post(ENTIDADES_PATH, dados);
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao criar entidade na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function atualizarEntidade(dados) {
  try {
    const response = await uniplusClient.put(ENTIDADES_PATH, dados);
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao atualizar entidade na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

async function apagarEntidade(codigo) {
  try {
    const response = await uniplusClient.delete(`${ENTIDADES_PATH}/${codigo}`);
    return response.data;
  } catch (error) {
    const err = new Error("Falha ao apagar entidade na UniPlus.");
    err.status = error.status || 500;
    err.details = error.details || error.message;
    throw err;
  }
}

module.exports = {
  listarPedidos,
  criarPedido,
  atualizarPedido,
  apagarPedido,
  obterPedidoPorCodigo,
  listarEntidades,
  obterEntidadePorCodigo,
  criarEntidade,
  atualizarEntidade,
  apagarEntidade,
  listarProdutos,
  obterProdutoPorCodigo,
  criarProduto,
  atualizarProduto,
  apagarProduto,
  listarOrdensServico,
  obterOrdemServicoPorCodigo,
  listarVendas,
  listarVendasItens,
  listarMovimentacaoEstoque,
  listarArquivos,
  listarTiposDocumentoFinanceiro,
  obterTipoDocumentoFinanceiroPorCodigo,
  listarContasGourmet,
  criarContaGourmet,
};
