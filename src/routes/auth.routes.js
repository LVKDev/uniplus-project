const express = require("express");
const {
  loginUser,
  registerUser,
  getUserById,
} = require("../services/auth.service");
const { authenticate, authorize } = require("../middleware/auth.middleware");

const router = express.Router();

/**
 * POST /auth/login
 * Faz login de um usuário
 * Body: { email, password }
 * Response: { success, user, message }
 * Cookies: authToken (HttpOnly)
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar entrada
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email e senha são obrigatórios",
      });
    }

    // Fazer login
    const result = await loginUser(email, password);

    if (!result) {
      return res.status(401).json({
        success: false,
        message: "Email ou senha incorretos",
      });
    }

    // Configurar cookie com HttpOnly
    res.cookie("authToken", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS em produção
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    });

    res.status(200).json({
      success: true,
      message: "Login realizado com sucesso",
      user: result.user,
      token: result.token, // Também retornar token se cliente quiser usar no header
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao fazer login",
    });
  }
});

/**
 * POST /auth/logout
 * Faz logout do usuário (limpa o cookie)
 * Protected: Deve estar autenticado
 * Response: { success, message }
 */
router.post("/logout", authenticate, (req, res) => {
  // Limpar cookie
  res.clearCookie("authToken");

  res.status(200).json({
    success: true,
    message: "Logout realizado com sucesso",
  });
});

/**
 * GET /auth/me
 * Retorna dados do usuário autenticado
 * Protected: Deve estar autenticado
 * Response: { success, user }
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar dados do usuário",
    });
  }
});

/**
 * POST /auth/register
 * Cria um novo usuário (apenas SuperAdmin)
 * Protected: Deve ser SuperAdmin
 * Body: { email, password, role, tenantName }
 * Response: { success, user, token, message }
 */
router.post(
  "/register",
  authenticate,
  authorize(["superadmin"]),
  async (req, res) => {
    try {
      const { email, password, role, tenantName } = req.body;

      // Validar entrada
      if (!email || !password || !role || !tenantName) {
        return res.status(400).json({
          success: false,
          message: "Email, senha, role e tenantName são obrigatórios",
        });
      }

      // Validar role
      if (!["admin", "cliente"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Role inválido. Use: admin, cliente",
        });
      }

      // Registrar usuário
      const result = await registerUser(
        email,
        password,
        role,
        tenantName,
        req.user.id,
      );

      if (result.error) {
        return res.status(400).json({
          success: false,
          message: result.error,
        });
      }

      res.status(201).json({
        success: true,
        message: "Usuário criado com sucesso",
        user: result.user,
        token: result.token,
      });
    } catch (error) {
      console.error("Erro ao registrar usuário:", error);
      res.status(500).json({
        success: false,
        message: "Erro ao registrar usuário",
      });
    }
  },
);

/**
 * GET /auth/validate
 * Valida o token atual (sem retornar user completo)
 * Protected: Deve estar autenticado
 * Response: { success, valid, user }
 */
router.get("/validate", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    valid: true,
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = router;
