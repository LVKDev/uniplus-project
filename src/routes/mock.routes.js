const express = require("express");

// Mock data for demonstração and testing
const MOCK_DATA = {
  pedidos: [
    {
      codigo: 1,
      cliente: 123,
      filial: 1,
      status: "8",
      data: "2025-03-24T10:30:00Z",
      itens: [{ produto: 456, quantidade: 5, valor: 100.0 }],
    },
    {
      codigo: 2,
      cliente: 456,
      filial: 1,
      status: "8",
      data: "2025-03-24T11:45:00Z",
      itens: [{ produto: 789, quantidade: 10, valor: 50.0 }],
    },
  ],
  entidades: [
    { codigo: 123, nome: "Empresa Teste LTDA", tipo: "C", status: "A" },
    { codigo: 456, nome: "Fornecedor ABC S.A.", tipo: "F", status: "A" },
  ],
  produtos: [
    { codigo: 456, nome: "Produto Teste 1", preco: 100.0, estoque: 50 },
    { codigo: 789, nome: "Produto Teste 2", preco: 50.0, estoque: 100 },
  ],
};

const router = express.Router();

/**
 * Mock endpoints for testing without UniPlus credentials
 * Prefix: /mock
 */

/**
 * GET /mock/pedidos
 * Returns mock order data
 */
router.get("/mock/pedidos", (req, res) => {
  const { limit = 10, offset = 0, single = false } = req.query;
  const data = MOCK_DATA.pedidos;

  if (single === "true" || single === true) {
    return res.json({
      success: true,
      data: data[0] || null,
    });
  }

  const paginated = data.slice(Number(offset), Number(offset) + Number(limit));
  res.json({
    success: true,
    data: paginated,
    pagination: {
      total: data.length,
      limit: Number(limit),
      offset: Number(offset),
    },
  });
});

/**
 * GET /mock/pedidos/:codigo
 * Returns single mock order by code
 */
router.get("/mock/pedidos/:codigo", (req, res) => {
  const { codigo } = req.params;
  const pedido = MOCK_DATA.pedidos.find((p) => p.codigo === Number(codigo));

  if (!pedido) {
    return res.status(404).json({
      success: false,
      error: "Pedido não encontrado",
    });
  }

  res.json({ success: true, data: pedido });
});

/**
 * GET /mock/entidades
 * Returns mock entity data
 */
router.get("/mock/entidades", (req, res) => {
  const { limit = 10, offset = 0 } = req.query;
  const data = MOCK_DATA.entidades;
  const paginated = data.slice(Number(offset), Number(offset) + Number(limit));

  res.json({
    success: true,
    data: paginated,
    pagination: {
      total: data.length,
      limit: Number(limit),
      offset: Number(offset),
    },
  });
});

/**
 * GET /mock/entidades/:codigo
 * Returns single mock entity by code
 */
router.get("/mock/entidades/:codigo", (req, res) => {
  const { codigo } = req.params;
  const entidade = MOCK_DATA.entidades.find((e) => e.codigo === Number(codigo));

  if (!entidade) {
    return res.status(404).json({
      success: false,
      error: "Entidade não encontrada",
    });
  }

  res.json({ success: true, data: entidade });
});

/**
 * GET /mock/produtos
 * Returns mock product data
 */
router.get("/mock/produtos", (req, res) => {
  const { limit = 10, offset = 0 } = req.query;
  const data = MOCK_DATA.produtos;
  const paginated = data.slice(Number(offset), Number(offset) + Number(limit));

  res.json({
    success: true,
    data: paginated,
    pagination: {
      total: data.length,
      limit: Number(limit),
      offset: Number(offset),
    },
  });
});

/**
 * GET /mock/produtos/:codigo
 * Returns single mock product by code
 */
router.get("/mock/produtos/:codigo", (req, res) => {
  const { codigo } = req.params;
  const produto = MOCK_DATA.produtos.find((p) => p.codigo === Number(codigo));

  if (!produto) {
    return res.status(404).json({
      success: false,
      error: "Produto não encontrado",
    });
  }

  res.json({ success: true, data: produto });
});

/**
 * POST /mock/pedidos
 * Create mock order
 */
router.post("/mock/pedidos", (req, res) => {
  const novoPedido = {
    codigo: Math.max(...MOCK_DATA.pedidos.map((p) => p.codigo)) + 1,
    ...req.body,
    data: new Date().toISOString(),
  };

  MOCK_DATA.pedidos.push(novoPedido);

  res.status(201).json({
    success: true,
    data: novoPedido,
    message: "Pedido criado com sucesso (mock)",
  });
});

/**
 * PUT /mock/pedidos
 * Update mock order
 */
router.put("/mock/pedidos", (req, res) => {
  const { codigo, ...updates } = req.body;

  if (!codigo) {
    return res.status(400).json({
      success: false,
      error: 'Campo "codigo" é obrigatório',
    });
  }

  const index = MOCK_DATA.pedidos.findIndex((p) => p.codigo === codigo);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: "Pedido não encontrado",
    });
  }

  MOCK_DATA.pedidos[index] = {
    ...MOCK_DATA.pedidos[index],
    ...updates,
    codigo,
  };

  res.json({
    success: true,
    data: MOCK_DATA.pedidos[index],
    message: "Pedido atualizado com sucesso (mock)",
  });
});

/**
 * DELETE /mock/pedidos/:codigo
 * Delete mock order
 */
router.delete("/mock/pedidos/:codigo", (req, res) => {
  const { codigo } = req.params;
  const index = MOCK_DATA.pedidos.findIndex((p) => p.codigo === Number(codigo));

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: "Pedido não encontrado",
    });
  }

  const deleted = MOCK_DATA.pedidos.splice(index, 1)[0];

  res.json({
    success: true,
    data: deleted,
    message: "Pedido deletado com sucesso (mock)",
  });
});

/**
 * GET /mock/info
 * Returns information about mock endpoints
 */
router.get("/mock/info", (req, res) => {
  res.json({
    success: true,
    message: "Mock endpoints para testes sem credenciais UniPlus",
    endpoints: {
      "GET /mock/pedidos": "Lista pedidos (com paginação)",
      "GET /mock/pedidos/:codigo": "Obter pedido por código",
      "POST /mock/pedidos": "Criar novo pedido (mock)",
      "PUT /mock/pedidos": "Atualizar pedido (mock)",
      "DELETE /mock/pedidos/:codigo": "Deletar pedido (mock)",
      "GET /mock/entidades": "Lista entidades",
      "GET /mock/entidades/:codigo": "Obter entidade por código",
      "GET /mock/produtos": "Lista produtos",
      "GET /mock/produtos/:codigo": "Obter produto por código",
      "GET /mock/info": "Informações sobre endpoints mock",
    },
    examples: {
      "List orders": "/mock/pedidos?limit=10&offset=0",
      "Single order": "/mock/pedidos?single=true",
      "Get order by code": "/mock/pedidos/1",
      "Get entities": "/mock/entidades?limit=10",
      "Get products": "/mock/produtos?limit=10",
    },
  });
});

module.exports = router;
