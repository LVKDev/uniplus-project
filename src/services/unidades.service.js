/**
 * Serviço de Unidades (Unit Service)
 * Gerencia CRUD de unidades com encriptação de credenciais Uniplus
 * Suporta DOIS formatos:
 * - LEGACY: username/password individual
 * - NEW: JSON completo com todos os dados Uniplus
 */

const { PrismaClient } = require("@prisma/client");
const bcryptjs = require("bcryptjs");
const axios = require("axios");
const {
  encryptCredentials,
  decryptCredentials,
  encryptCredentialsJSON,
  decryptCredentialsJSON,
} = require("../lib/encryption");

const prisma = new PrismaClient();

/**
 * Lista todas as unidades (sem credenciais)
 * Apenas SUPER_ADMIN pode listar
 * @returns {Promise<array>} Array de unidades
 */
async function listUnidades() {
  try {
    const units = await prisma.unit.findMany({
      select: {
        id: true,
        nome: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return units.map((unit) => ({
      id: unit.id,
      nome: unit.nome,
      usuarios_count: unit._count.users,
      created_at: unit.createdAt,
      updated_at: unit.updatedAt,
    }));
  } catch (error) {
    console.error("Erro ao listar unidades:", error);
    throw new Error("Falha ao listar unidades");
  }
}

/**
 * Busca uma unidade por ID (sem credenciais)
 * @param {string} unitId - ID da unidade
 * @returns {Promise<object>} Dados da unidade
 */
async function getUnidade(unitId) {
  try {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: {
        id: true,
        nome: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { users: true },
        },
      },
    });

    if (!unit) {
      return null;
    }

    return {
      id: unit.id,
      nome: unit.nome,
      usuarios_count: unit._count.users,
      created_at: unit.createdAt,
      updated_at: unit.updatedAt,
    };
  } catch (error) {
    console.error("Erro ao buscar unidade:", error);
    throw new Error("Falha ao buscar unidade");
  }
}

/**
 * Cria uma nova unidade com credenciais Uniplus encriptadas
 * @param {string} nome - Nome da unidade
 * @param {string} credencial_uniplus_user - Username Uniplus
 * @param {string} credencial_uniplus_pass - Password Uniplus
 * @returns {Promise<object>} Unidade criada (sem credenciais)
 */
async function createUnidade(
  nome,
  credencial_uniplus_user,
  credencial_uniplus_pass,
) {
  try {
    // Validações
    if (!nome || nome.trim() === "") {
      throw new Error("Nome da unidade é obrigatório");
    }

    if (!credencial_uniplus_user || credencial_uniplus_user.trim() === "") {
      throw new Error("Username Uniplus é obrigatório");
    }

    if (!credencial_uniplus_pass || credencial_uniplus_pass.trim() === "") {
      throw new Error("Password Uniplus é obrigatório");
    }

    // Verificar se unidade com este nome já existe
    const existingUnit = await prisma.unit.findUnique({
      where: { nome: nome.trim() },
    });

    if (existingUnit) {
      throw new Error("Unidade com este nome já existe");
    }

    // Encriptar credenciais
    const { user_encrypted, pass_encrypted } = encryptCredentials(
      credencial_uniplus_user.trim(),
      credencial_uniplus_pass.trim(),
    );

    // Criar unidade
    const unit = await prisma.unit.create({
      data: {
        nome: nome.trim(),
        credencial_uniplus_user: user_encrypted,
        credencial_uniplus_pass: pass_encrypted,
      },
      select: {
        id: true,
        nome: true,
        createdAt: true,
      },
    });

    return {
      id: unit.id,
      nome: unit.nome,
      success: true,
      created_at: unit.createdAt,
    };
  } catch (error) {
    console.error("Erro ao criar unidade:", error);
    throw error;
  }
}

/**
 * Atualiza credenciais Uniplus de uma unidade
 * @param {string} unitId - ID da unidade
 * @param {string} credencial_uniplus_user - Username Uniplus
 * @param {string} credencial_uniplus_pass - Password Uniplus
 * @returns {Promise<object>} Sucesso
 */
async function updateUnidadeCredentials(
  unitId,
  credencial_uniplus_user,
  credencial_uniplus_pass,
) {
  try {
    // Validações
    if (!credencial_uniplus_user || credencial_uniplus_user.trim() === "") {
      throw new Error("Username Uniplus é obrigatório");
    }

    if (!credencial_uniplus_pass || credencial_uniplus_pass.trim() === "") {
      throw new Error("Password Uniplus é obrigatório");
    }

    // Verificar se unidade existe
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      throw new Error("Unidade não encontrada");
    }

    // Encriptar credenciais
    const { user_encrypted, pass_encrypted } = encryptCredentials(
      credencial_uniplus_user.trim(),
      credencial_uniplus_pass.trim(),
    );

    // Atualizar
    await prisma.unit.update({
      where: { id: unitId },
      data: {
        credencial_uniplus_user: user_encrypted,
        credencial_uniplus_pass: pass_encrypted,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao atualizar credenciais:", error);
    throw error;
  }
}

/**
 * Deleta uma unidade (soft delete)
 * IMPORTANTE: Apenas deleta se não houver usuários
 * @param {string} unitId - ID da unidade
 * @returns {Promise<object>} Sucesso
 */
async function deleteUnidade(unitId) {
  try {
    // Verificar se unidade existe
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      include: { users: { take: 1 } },
    });

    if (!unit) {
      throw new Error("Unidade não encontrada");
    }

    // Impedir deleção se houver usuários
    if (unit.users.length > 0) {
      throw new Error(
        "Não é possível deletar unidade com usuários. Remova todos os usuários primeiro.",
      );
    }

    // Deletar
    await prisma.unit.delete({
      where: { id: unitId },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao deletar unidade:", error);
    throw error;
  }
}

/**
 * Cria uma unidade com credenciais Uniplus COMPLETAS em JSON
 * NOVO FORMATO: Armazena TODOS os dados em um único campo encriptado
 * @param {string} nome - Nome da unidade
 * @param {object} credenciaisUniplus - Objeto com TODOS os dados:
 *   {
 *     base_url: string,
 *     server_url: string,
 *     client_id: string,
 *     client_secret: string,
 *     token: string (opcional),
 *     auth_basic: string,
 *     tenant: string,
 *     access_key: string,
 *     limit: number (opcional)
 *   }
 * @returns {Promise<object>} Unidade criada (sem credenciais)
 */
async function createUnidadeWithFullCredentials(nome, credenciaisUniplus) {
  try {
    // Validações
    if (!nome || nome.trim() === "") {
      throw new Error("Nome da unidade é obrigatório");
    }

    if (!credenciaisUniplus || typeof credenciaisUniplus !== "object") {
      throw new Error("Credenciais Uniplus deve ser um objeto");
    }

    // Validar campos obrigatórios
    const camposObrigatorios = [
      "base_url",
      "server_url",
      "client_id",
      "client_secret",
      "auth_basic",
      "tenant",
      "access_key",
    ];
    for (const campo of camposObrigatorios) {
      if (!credenciaisUniplus[campo] || credenciaisUniplus[campo].trim?.() === "") {
        throw new Error(`Campo obrigatório faltando: ${campo}`);
      }
    }

    // Verificar se unidade com este nome já existe
    const existingUnit = await prisma.unit.findUnique({
      where: { nome: nome.trim() },
    });

    if (existingUnit) {
      throw new Error("Unidade com este nome já existe");
    }

    // Encriptar JSON completo
    const credenciaisEncriptadas = encryptCredentialsJSON(credenciaisUniplus);

    // Criar unidade
    const unit = await prisma.unit.create({
      data: {
        nome: nome.trim(),
        credenciais_json: credenciaisEncriptadas,
      },
      select: {
        id: true,
        nome: true,
        createdAt: true,
      },
    });

    return {
      id: unit.id,
      nome: unit.nome,
      success: true,
      created_at: unit.createdAt,
      message: "Unidade criada com sucesso com credenciais encriptadas",
    };
  } catch (error) {
    console.error("Erro ao criar unidade com credenciais JSON:", error);
    throw error;
  }
}

/**
 * Obtém credenciais COMPLETAS desencriptadas de uma unidade
 * IMPORTANTE: Apenas para uso interno!
 * NUNCA retornar estas credenciais ao cliente
 * @param {string} unitId - ID da unidade
 * @returns {Promise<object>} Objeto com todos os dados Uniplus desencriptados
 */
async function getUnidadeFullCredentials(unitId) {
  try {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: {
        credenciais_json: true,
        credencial_uniplus_user: true, // Fallback para legacy
        credencial_uniplus_pass: true, // Fallback para legacy
      },
    });

    if (!unit) {
      throw new Error("Unidade não encontrada");
    }

    // Se tem credenciais_json (novo formato)
    if (unit.credenciais_json) {
      return decryptCredentialsJSON(unit.credenciais_json);
    }

    // Senão, desencriptar legacy (username/password)
    if (unit.credencial_uniplus_user && unit.credencial_uniplus_pass) {
      const creds = decryptCredentials(
        unit.credencial_uniplus_user,
        unit.credencial_uniplus_pass,
      );
      // Retornar no novo formato por compatibilidade
      return {
        auth_basic: creds.username, // username na verdade contém auth_basic?
        // Retornar com campos mapeados
        username: creds.username,
        password: creds.password,
      };
    }

    throw new Error("Nenhuma credencial configurada para esta unidade");
  } catch (error) {
    console.error("Erro ao obter credenciais completas:", error);
    throw error;
  }
}

/**
 * Atualiza credenciais COMPLETAS de uma unidade (novo formato JSON)
 * @param {string} unitId - ID da unidade
 * @param {object} credenciaisUniplus - Novo objeto com todos os dados
 * @returns {Promise<object>} Sucesso
 */
async function updateUnidadeFullCredentials(unitId, credenciaisUniplus) {
  try {
    if (!credenciaisUniplus || typeof credenciaisUniplus !== "object") {
      throw new Error("Credenciais Uniplus deve ser um objeto");
    }

    // Validar campos obrigatórios (mesmos de criação)
    const camposObrigatorios = [
      "base_url",
      "server_url",
      "client_id",
      "client_secret",
      "auth_basic",
      "tenant",
      "access_key",
    ];
    for (const campo of camposObrigatorios) {
      if (!credenciaisUniplus[campo] || credenciaisUniplus[campo].trim?.() === "") {
        throw new Error(`Campo obrigatório faltando: ${campo}`);
      }
    }

    // Verificar se unidade existe
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
    });

    if (!unit) {
      throw new Error("Unidade não encontrada");
    }

    // Encriptar novo JSON
    const credenciaisEncriptadas = encryptCredentialsJSON(credenciaisUniplus);

    // Atualizar
    await prisma.unit.update({
      where: { id: unitId },
      data: {
        credenciais_json: credenciaisEncriptadas,
      },
    });

    return { success: true, message: "Credenciais atualizadas com sucesso" };
  } catch (error) {
    console.error("Erro ao atualizar credenciais JSON:", error);
    throw error;
  }
}

/**
 * Obtém credenciais de uma unidade
 * @param {string} unitId - ID da unidade
 * @returns {Promise<object>} Credenciais descriptografadas
 */
async function getUnidadeCredentials(unitId) {
  try {
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: {
        credencial_uniplus_user: true,
        credencial_uniplus_pass: true,
      },
    });

    if (!unit) {
      throw new Error("Unidade não encontrada");
    }

    // Decriptar
    const creds = decryptCredentials(
      unit.credencial_uniplus_user,
      unit.credencial_uniplus_pass,
    );

    return creds;
  } catch (error) {
    console.error("Erro ao obter credenciais:", error);
    throw error;
  }
}

/**
 * Cria uma unidade + admin user automaticamente
 * @param {string} nome - Nome da unidade
 * @param {string} adminEmail - Email do admin
 * @param {string} adminSenha - Senha do admin (será hashada)
 * @param {string} uniplusclientId - CLIENT_ID Uniplus
 * @param {string} uniplusclientSecret - CLIENT_SECRET Uniplus
 * @returns {Promise<object>} Dados da unidade e admin criados
 */
async function createUnidadeWithAdmin(
  nome,
  adminEmail,
  adminSenha,
  uniplusclientId,
  uniplusclientSecret,
) {
  try {
    // Validações
    if (!nome || nome.trim() === "") {
      throw new Error("Nome da unidade é obrigatório");
    }

    if (!adminEmail || adminEmail.trim() === "") {
      throw new Error("Email do admin é obrigatório");
    }

    if (!adminSenha || adminSenha.trim() === "") {
      throw new Error("Senha do admin é obrigatória");
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      throw new Error("Email do admin inválido");
    }

    // Validar senha (8+ chars, maiúscula, minúscula, número)
    const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!senhaRegex.test(adminSenha)) {
      throw new Error(
        "Senha deve ter 8+ caracteres, maiúscula, minúscula e número",
      );
    }

    if (!uniplusclientId || uniplusclientId.trim() === "") {
      throw new Error("CLIENT_ID Uniplus é obrigatório");
    }

    if (!uniplusclientSecret || uniplusclientSecret.trim() === "") {
      throw new Error("CLIENT_SECRET Uniplus é obrigatório");
    }

    // Validar credenciais Uniplus (testar token)
    try {
      const authBasic = Buffer.from(
        `${uniplusclientId}:${uniplusclientSecret}`,
      ).toString("base64");
      const baseUrl = process.env.UNIPLUS_SERVER_URL || "https://next-01.webuniplus.com";
      
      const response = await axios.post(
        `${baseUrl}/api-public/v1/geral/token`,
        {},
        {
          headers: {
            Authorization: `Basic ${authBasic}`,
            "Content-Type": "application/json",
          },
          timeout: 5000,
        },
      );

      if (!response.data.access_token) {
        throw new Error("Não foi possível autenticar com Uniplus");
      }
    } catch (uniError) {
      console.error("Erro ao validar credenciais Uniplus:", uniError.message);
      throw new Error(
        `Erro ao validar credenciais Uniplus: ${uniError.message}`,
      );
    }

    // Verificar se unidade com este nome já existe
    const existingUnit = await prisma.unit.findUnique({
      where: { nome: nome.trim() },
    });

    if (existingUnit) {
      throw new Error("Unidade com este nome já existe");
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail.trim() },
    });

    if (existingUser) {
      throw new Error("Email já cadastrado no sistema");
    }

    // Encriptar credenciais Uniplus (usando novo formato JSON)
    const credenciaisUniplus = {
      client_id: uniplusclientId.trim(),
      client_secret: uniplusclientSecret.trim(),
    };
    const credenciaisEncriptadas = encryptCredentialsJSON(credenciaisUniplus);

    // Hash da senha do admin
    const senhaHash = await bcryptjs.hash(adminSenha, 10);

    // Criar unidade PRIMEIRO
    const unit = await prisma.unit.create({
      data: {
        nome: nome.trim(),
        credenciais_json: credenciaisEncriptadas,
      },
      select: {
        id: true,
        nome: true,
        createdAt: true,
      },
    });

    // Depois criar o usuário admin para essa unidade
    const { ROLES, PERMISSOES_POR_ROLE } = require("../config/constants");

    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail.trim(),
        password: senhaHash,
        role: ROLES.ADMIN_UNIDADE,
        unit_id: unit.id,
        permissions: PERMISSOES_POR_ROLE[ROLES.ADMIN_UNIDADE] || [],
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return {
      unidade: {
        id: unit.id,
        nome: unit.nome,
        created_at: unit.createdAt,
      },
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        created_at: adminUser.createdAt,
      },
      success: true,
      message: "Unidade e admin criados com sucesso",
    };
  } catch (error) {
    console.error("Erro ao criar unidade com admin:", error);
    throw error;
  }
}

module.exports = {
  // Legacy
  listUnidades,
  getUnidade,
  createUnidade,
  updateUnidadeCredentials,
  deleteUnidade,
  getUnidadeCredentials,

  // New - Full JSON credentials
  createUnidadeWithFullCredentials,
  getUnidadeFullCredentials,
  updateUnidadeFullCredentials,

  // With Admin
  createUnidadeWithAdmin,
};
