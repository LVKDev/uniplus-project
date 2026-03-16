/**
 * Rotas de Configurações de Dados - SPRINT 4
 * Endpoints para dados de configuração (cidades, estados)
 */

const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const { getCidadesEstados } = require("../lib/uniplumClient");

const router = express.Router();

/**
 * GET /api/cidades-estados
 * Retorna lista de estados e cidades do Brasil
 * Protected: Apenas autenticado
 */
router.get("/cidades-estados", authenticate, async (req, res) => {
  try {
    const dados = getCidadesEstados();

    res.status(200).json({
      success: true,
      data: dados,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message || "Erro ao buscar cidades e estados",
    });
  }
});

module.exports = router;
