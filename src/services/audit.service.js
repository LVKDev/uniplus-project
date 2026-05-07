const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const API_LOG_TABLE = "api_logs";

// Map table name strings to Prisma model delegates
const TABLE_DELEGATE = {
  pedidos_log: "pedidoLog",
  entidades_log: "entidadeLog",
  produtos_log: "produtoLog",
  ordens_servico_log: "ordemServicoLog",
  health_log: "healthLog",
  empresas_log: "empresaLog",
};

async function registrarAuditoria(
  {
    table,
    recurso,
    rota,
    metodo,
    codigo,
    payload,
    operacao,
    status,
  },
  { ignoreFailure = false } = {},
) {
  const base = {
    codigo: codigo ?? null,
    payload: payload ?? {},
    operacao,
    status,
    dataOperacao: new Date(),
  };

  const errors = [];

  // Write to specific resource log table if it has a Prisma model
  if (table && TABLE_DELEGATE[table]) {
    try {
      await prisma[TABLE_DELEGATE[table]].create({ data: base });
    } catch (err) {
      errors.push({ table, message: err.message });
    }
  }

  // Always write to api_logs (general audit trail)
  try {
    await prisma.apiLog.create({
      data: {
        ...base,
        recurso: recurso || "desconhecido",
        rota: rota ?? null,
        metodo: metodo ?? null,
      },
    });
  } catch (err) {
    errors.push({ table: API_LOG_TABLE, message: err.message });
  }

  if (errors.length && !ignoreFailure) {
    const err = new Error("Falha ao registrar auditoria.");
    err.details = errors
      .map((item) => `${item.table}: ${item.message}`)
      .join(" | ");
    throw err;
  }
}

module.exports = { registrarAuditoria };
