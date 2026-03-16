const { verifySession } = require("../services/auth.service");

/**
 * Middleware de autenticação
 * Verifica se há um token JWT válido no cookie ou header Authorization
 * Adiciona usuário decodificado ao req.user
 */
function authenticate(req, res, next) {
  try {
    // Tentar obter token do cookie
    let token = null;

    if (req.cookies && req.cookies.authToken) {
      token = req.cookies.authToken;
    }

    // Se não houver no cookie, tentar do header Authorization
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token não fornecido",
      });
    }

    // Verificar e decodificar token
    const decoded = verifySession(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Token inválido ou expirado",
      });
    }

    // Adicionar usuário ao objeto request
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Erro na autenticação:", error);
    res.status(401).json({
      success: false,
      message: "Erro ao validar token",
    });
  }
}

/**
 * Middleware de autorização
 * Verifica se o usuário tem uma das roles permitidas
 * @param {string[]} allowedRoles - Array de roles permitidas
 * @returns {function} Middleware function
 */
function authorize(allowedRoles) {
  return (req, res, next) => {
    // Verificar se usuário está autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuário não autenticado",
      });
    }

    // Verificar se role está permitida
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Acesso denied. Role insuficiente",
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });
    }

    next();
  };
}

/**
 * Middleware para logs de auditoria (opcional)
 * Registra todos os acessos à API
 */
function auditLog(req, res, next) {
  // Executar após a resposta ser enviada
  res.on("finish", () => {
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      userId: req.user ? req.user.id : "anonymous",
      userEmail: req.user ? req.user.email : null,
      ip: req.ip,
    };

    // Log básico (em produção, isso seria enviado para um serviço de logs)
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[AUDIT] ${logData.method} ${logData.path} - ${logData.status}`,
      );
    }
  });

  next();
}

/**
 * Middleware para tratamento de erros
 * Centraliza o tratamento de erros da API
 */
function errorHandler(err, req, res, next) {
  console.error("Erro:", err);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Erro interno do servidor";

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
}

module.exports = {
  authenticate,
  authorize,
  auditLog,
  errorHandler,
};
