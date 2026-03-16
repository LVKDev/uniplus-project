const express = require("express");

const portalService = require("../services/portal-comercial.service");

const router = express.Router();

/**
 * @openapi
 * /api/portal/bloquear-contrato/{cpfcnpj}:
 *   post:
 *     summary: Agenda bloqueio de contrato no Portal Comercial
 *     tags: [PortalComercial]
 *     parameters:
 *       - in: path
 *         name: cpfcnpj
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345678901"
 *     responses:
 *       200:
 *         description: Bloqueio agendado
 */
router.post(
  "/api/portal/bloquear-contrato/:cpfcnpj",
  async (req, res, next) => {
    try {
      const { cpfcnpj } = req.params;
      if (!cpfcnpj) {
        return res
          .status(400)
          .json({ success: false, error: "CPF/CNPJ obrigatorio." });
      }

      const context = {
        rota: req.path,
        metodo: req.method,
        userId: req.user?.id,
        userRole: req.user?.role,
        tenantId: req.user?.tenantId,
      };
      const data = await portalService.bloquearContrato(cpfcnpj, context);
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/portal/desbloquear-contrato/{cpfcnpj}:
 *   post:
 *     summary: Desbloqueia contrato no Portal Comercial
 *     tags: [PortalComercial]
 *     parameters:
 *       - in: path
 *         name: cpfcnpj
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345678901"
 *     responses:
 *       200:
 *         description: Contrato desbloqueado
 */
router.post(
  "/api/portal/desbloquear-contrato/:cpfcnpj",
  async (req, res, next) => {
    try {
      const { cpfcnpj } = req.params;
      if (!cpfcnpj) {
        return res
          .status(400)
          .json({ success: false, error: "CPF/CNPJ obrigatorio." });
      }

      const context = {
        rota: req.path,
        metodo: req.method,
        userId: req.user?.id,
        userRole: req.user?.role,
        tenantId: req.user?.tenantId,
      };
      const data = await portalService.desbloquearContrato(cpfcnpj, context);
      return res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @openapi
 * /api/portal/contratos:
 *   get:
 *     summary: Lista contratos (Portal Comercial)
 *     tags: [PortalComercial]
 *     responses:
 *       200:
 *         description: Lista de contratos
 */
router.get("/api/portal/contratos", async (req, res, next) => {
  try {
    const context = {
      rota: req.path,
      metodo: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      tenantId: req.user?.tenantId,
    };
    const data = await portalService.listarContratos(context);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/portal/contratos/{status}:
 *   get:
 *     summary: Lista contratos por status (Portal Comercial)
 *     tags: [PortalComercial]
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         example: "5"
 *     responses:
 *       200:
 *         description: Lista de contratos
 */
router.get("/api/portal/contratos/:status", async (req, res, next) => {
  try {
    const { status } = req.params;
    const context = {
      rota: req.path,
      metodo: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      tenantId: req.user?.tenantId,
    };
    const data = await portalService.listarContratosPorStatus(status, context);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/portal/contrato/{cpfcnpj}:
 *   get:
 *     summary: Consulta contrato por CPF/CNPJ (Portal Comercial)
 *     tags: [PortalComercial]
 *     parameters:
 *       - in: path
 *         name: cpfcnpj
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345678901"
 *     responses:
 *       200:
 *         description: Contrato encontrado
 */
router.get("/api/portal/contrato/:cpfcnpj", async (req, res, next) => {
  try {
    const { cpfcnpj } = req.params;
    const context = {
      rota: req.path,
      metodo: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      tenantId: req.user?.tenantId,
    };
    const data = await portalService.obterContratoPorCpfCnpj(cpfcnpj, context);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/portal/contrato/{cpfcnpj}/{status}:
 *   get:
 *     summary: Consulta contrato por CPF/CNPJ e status (Portal Comercial)
 *     tags: [PortalComercial]
 *     parameters:
 *       - in: path
 *         name: cpfcnpj
 *         required: true
 *         schema:
 *           type: string
 *         example: "12345678901"
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *         example: "5"
 *     responses:
 *       200:
 *         description: Contrato encontrado
 */
router.get("/api/portal/contrato/:cpfcnpj/:status", async (req, res, next) => {
  try {
    const { cpfcnpj, status } = req.params;
    const context = {
      rota: req.path,
      metodo: req.method,
      userId: req.user?.id,
      userRole: req.user?.role,
      tenantId: req.user?.tenantId,
    };
    const data = await portalService.obterContratoPorCpfCnpjEStatus(
      cpfcnpj,
      status,
      context,
    );
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
