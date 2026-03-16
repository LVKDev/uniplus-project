/**
 * Serviço de Auditoria
 * Fornece funcionalidades para listar e filtrar logs de auditoria
 *
 * Apenas SUPER_ADMIN ou usuários com permissão 'ver_auditoria' conseguem acessar
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

/**
 * Listar logs de auditoria com filtros opcionais
 *
 * @param {Object} filtros - Filtros opcionais
 * @param {string} filtros.unitId - Filtrar por unidade (ADMIN_UNIDADE vê só sua unit)
 * @param {string} filtros.userId - Filtrar por usuário que fez a ação
 * @param {string} filtros.acao - Filtrar por ação (CREATE, UPDATE, DELETE)
 * @param {string} filtros.recurso - Filtrar por recurso (produto, cliente, usuario)
 * @param {Date} filtros.dataInicio - Data inicial (ISO 8601)
 * @param {Date} filtros.dataFim - Data final (ISO 8601)
 * @param {number} filtros.limit - Quantidade de registros (padrão: 50, máx: 500)
 * @param {number} filtros.offset - Deslocamento para paginação (padrão: 0)
 * @param {Object} context - Informações do usuário autenticado
 * @param {string} context.userId - ID do usuário
 * @param {string} context.unitId - ID da unidade do usuário (ADMIN_UNIDADE)
 * @param {string} context.userRole - Role do usuário (SUPER_ADMIN, ADMIN_UNIDADE, FUNCIONARIO)
 *
 * @returns {Promise<{logs: Array, pagination: {total, limit, offset, pages, currentPage}}>}
 */
async function listarAuditoria(filtros = {}, context = {}) {
  try {
    // Validações
    if (!context.userId) {
      const error = new Error("Usuário não autenticado");
      error.status = 401;
      throw error;
    }

    const limit = Math.min(parseInt(filtros.limit) || 50, 500);
    const offset = parseInt(filtros.offset) || 0;

    // Construir where clause
    const where = {};

    // SUPER_ADMIN vê tudo, ADMIN_UNIDADE vê só sua unit, FUNCIONARIO não vê nada
    if (context.userRole === "ADMIN_UNIDADE") {
      where.unitId = context.unitId;
    } else if (context.userRole === "FUNCIONARIO") {
      // FUNCIONARIO não consegue acessar auditoria (já bloqueado no middleware)
      const error = new Error("Permissão negada para acessar auditoria");
      error.status = 403;
      throw error;
    }

    // Filtros opcionais
    if (filtros.userId) {
      where.userId = filtros.userId;
    }

    if (filtros.acao) {
      where.acao = filtros.acao.toUpperCase();
    }

    if (filtros.recurso) {
      where.recurso = filtros.recurso.toLowerCase();
    }

    // Filtro por data
    if (filtros.dataInicio || filtros.dataFim) {
      where.timestamp = {};
      if (filtros.dataInicio) {
        where.timestamp.gte = new Date(filtros.dataInicio);
      }
      if (filtros.dataFim) {
        where.timestamp.lte = new Date(filtros.dataFim);
      }
    }

    // Contar total
    const total = await prisma.auditLog.count({ where });

    // Buscar com paginação (ordenar por timestamp DESC = mais recentes primeiro)
    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            email: true,
          },
        },
        unit: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
      orderBy: {
        timestamp: "desc",
      },
      take: limit,
      skip: offset,
    });

    const pages = Math.ceil(total / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    return {
      success: true,
      data: logs.map((log) => ({
        id: log.id,
        timestamp: log.timestamp,
        usuario: log.author?.email || "Sistema",
        unidade: log.unit?.nome || "-",
        acao: log.acao,
        recurso: log.recurso,
        detalhes: log.detalhes,
      })),
      pagination: {
        total,
        limit,
        offset,
        pages,
        currentPage,
      },
    };
  } catch (error) {
    console.error("❌ Erro ao listar auditoria:", error.message);
    throw error;
  }
}

/**
 * Registrar uma ação de auditoria
 *
 * @param {string} unitId - ID da unidade
 * @param {string} userId - ID do usuário que fez a ação
 * @param {string} acao - Tipo de ação (CREATE, UPDATE, DELETE, ATUALIZAR, LISTAR, etc)
 * @param {string} recurso - Recurso afetado (produto, cliente, usuario, etc)
 * @param {Object} detalhes - Dados adicionais (antes/depois, payload, etc)
 */
async function registrarAuditoria(
  unitId,
  userId,
  acao,
  recurso,
  detalhes = {},
) {
  try {
    await prisma.auditLog.create({
      data: {
        unitId,
        userId,
        acao: acao.toUpperCase(),
        recurso: recurso.toLowerCase(),
        detalhes: detalhes || {},
      },
    });
  } catch (error) {
    // Log de auditoria não deve quebrar a aplicação
    console.error("⚠️ Aviso: Erro ao registrar auditoria:", error.message);
  }
}

/**
 * Exportações
 */
module.exports = {
  listarAuditoria,
  registrarAuditoria,
};
