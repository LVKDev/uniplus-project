/**
 * Rotas de Clientes - SPRINT 4
 * Apenas usuários com permissão ver_clientes podem listar
 * Apenas usuários com permissão editar_clientes podem fazer PATCH
 */

const express = require("express");
const {
  listarClientes,
  obterCliente,
  atualizarCliente,
} = require("../services/clientes.service");
const {
  cacheRoute,
  invalidateCache,
} = require("../middleware/cache.middleware");

const router = express.Router();

/**
 * GET /api/clientes
 * Lista clientes da unidade
 * Protected: Requer permissão ver_clientes
 */
router.get(
  "/",
  cacheRoute(300, "clientes"),
  async (req, res) => {
    try {
      const { codigo, nome, cnpjCpf, limit, offset } = req.query;
      const { id: userId, unit_id: unitId, role: userRole } = req.user;

      const filtros = {};
      if (codigo) filtros.codigo = codigo;
      if (nome) filtros.nome = nome;
      if (cnpjCpf) filtros.cnpjCpf = cnpjCpf;
      if (limit === "all") {
        filtros.all = true;
      } else if (limit) {
        filtros.limit = parseInt(limit) || 25;
      }
      if (offset) filtros.offset = parseInt(offset) || 0;

      const resultado = await listarClientes(filtros, {
        userId,
        unitId,
        userRole,
      });

      res.status(200).json({
        success: true,
        data: resultado.items,
        pagination: resultado.pagination,
      });
    } catch (error) {
      console.error("Erro ao listar clientes:", error.message);
      res.status(error.status || 500).json({
        success: false,
        error: error.message || "Erro ao listar clientes",
      });
    }
  },
);

/**
 * GET /api/clientes/:codigoCliente
 * Busca um cliente específico
 * Protected: Requer permissão ver_clientes
 */
router.get(
  "/:codigoCliente",
  async (req, res) => {
    try {
      const { codigoCliente } = req.params;
      const { id: userId, unit_id: unitId, role: userRole } = req.user;

      const cliente = await obterCliente(codigoCliente, {
        userId,
        unitId,
        userRole,
      });

      res.status(200).json({
        success: true,
        data: cliente,
      });
    } catch (error) {
      console.error(
        `Erro ao obter cliente ${req.params.codigoCliente}:`,
        error.message,
      );
      res.status(error.status || 500).json({
        success: false,
        error: error.message || "Erro ao obter cliente",
      });
    }
  },
);

/**
 * PATCH /api/clientes/:codigoCliente
 * Edita um cliente (nome, endereco, telefone, email, etc)
 * Protected: Requer permissão editar_clientes
 */
router.patch(
  "/:codigoCliente",
  invalidateCache("clientes"),
  async (req, res) => {
    try {
      const { codigoCliente } = req.params;
      const { id: userId, unit_id: unitId, role: userRole } = req.user;
      const dados = req.body;

      if (!dados || Object.keys(dados).length === 0) {
        return res.status(400).json({
          success: false,
          error: "Nenhum dado para atualizar",
        });
      }

      const resultado = await atualizarCliente(codigoCliente, dados, {
        userId,
        unitId,
        userRole,
      });

      res.status(200).json({
        success: true,
        data: resultado,
        message: `Cliente ${codigoCliente} atualizado com sucesso`,
      });
    } catch (error) {
      console.error(
        `Erro ao atualizar cliente ${req.params.codigoCliente}:`,
        error.message,
      );
      res.status(error.status || 500).json({
        success: false,
        error: error.message || "Erro ao atualizar cliente",
      });
    }
  },
);

module.exports = router;
