const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Hash uma senha com bcryptjs
 * @param {string} password - Senha em texto plano
 * @returns {Promise<string>} Hash da senha
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Verifica se uma senha corresponde ao hash
 * @param {string} password - Senha em texto plano
 * @param {string} hash - Hash armazenado
 * @returns {Promise<boolean>} true se coincide, false caso contrário
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Cria um JWT (session token)
 * @param {string} userId - ID do usuário
 * @param {string} email - Email do usuário
 * @param {string} role - Role do usuário (SUPER_ADMIN, ADMIN_UNIDADE, FUNCIONARIO)
 * @param {string} unitId - ID da unidade (unit_id)
 * @param {array} permissions - Array de permissões do usuário
 * @returns {string} Token JWT assinado
 */
function createSession(userId, email, role, unitId = null, permissions = []) {
  const token = jwt.sign(
    {
      id: userId,
      email: email,
      role: role,
      unit_id: unitId,
      permissions: permissions,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || "1d",
    },
  );
  return token;
}

/**
 * Verifica e decodifica um JWT
 * @param {string} token - Token JWT
 * @returns {object|null} Dados decodificados ou null se inválido
 */
function verifySession(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Faz login de um usuário
 * @param {string} email - Email do usuário
 * @param {string} password - Senha em texto plano
 * @returns {Promise<{user, token}|null>} Usuário e token ou null se inválido
 */
async function loginUser(email, password) {
  try {
    // Buscar usuário pelo email com suas permissões
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        permissions: true,
      },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        unitId: true,
        tenantId: true,
        isActive: true,
        permissions: true,
      },
    });

    if (!user) {
      return null; // Usuário não encontrado
    }

    if (!user.isActive) {
      return null; // Usuário inativo
    }

    // Verificar senha
    const passwordMatch = await verifyPassword(password, user.passwordHash);
    if (!passwordMatch) {
      return null; // Senha incorreta
    }

    // Extrair lista de permissões (resource:action)
    const permissionsArray = user.permissions.map((p) => p.resource);

    // Gerar token com unit_id e permissões
    const token = createSession(
      user.id,
      user.email,
      user.role,
      user.unitId,
      permissionsArray,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        unit_id: user.unitId,
        tenant_id: user.tenantId,
        permissions: permissionsArray,
      },
      token,
    };
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    return null;
  }
}

/**
 * Cria um novo usuário (apenas SuperAdmin pode criar)
 * @param {string} email - Email do novo usuário
 * @param {string} password - Senha em texto plano
 * @param {string} role - Role (admin, cliente)
 * @param {string} tenantName - Nome do tenant (se role = cliente ou admin)
 * @param {string} createdByUserId - ID do usuário que está criando
 * @returns {Promise<{user, token}|{error: string}>} Usuário criado e token ou erro
 */
async function registerUser(
  email,
  password,
  role,
  tenantName,
  createdByUserId,
) {
  try {
    // Validar role
    if (!["admin", "cliente"].includes(role)) {
      return { error: "Role inválido. Use: admin, cliente" };
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return { error: "Usuário com este email já existe" };
    }

    // Verificar tenantName se necessário
    if (!tenantName || tenantName.trim() === "") {
      return { error: "tenantName é obrigatório" };
    }

    // Hash da senha
    const passwordHash = await hashPassword(password);

    // Criar tenant
    const tenant = await prisma.tenant.create({
      data: {
        nome: tenantName,
        createdBy: createdByUserId,
      },
    });

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        tenantId: tenant.id,
      },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
      },
    });

    // Gerar token
    const token = createSession(user.id, user.email, user.role);

    return {
      user,
      token,
    };
  } catch (error) {
    console.error("Erro ao registrar usuário:", error);
    return { error: error.message };
  }
}

/**
 * Retorna dados do usuário pelo ID
 * @param {string} userId - ID do usuário
 * @returns {Promise<object|null>} Dados do usuário ou null
 */
async function getUserById(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        tenantId: true,
        isActive: true,
        createdAt: true,
      },
    });
    return user;
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return null;
  }
}

/**
 * Atualiza a senha de um usuário
 * @param {string} userId - ID do usuário
 * @param {string} newPassword - Nova senha em texto plano
 * @returns {Promise<boolean>} true se sucesso, false se erro
 */
async function updatePassword(userId, newPassword) {
  try {
    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    return false;
  }
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSession,
  verifySession,
  loginUser,
  registerUser,
  getUserById,
  updatePassword,
};
