const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const API_LOG_TABLE = "api_logs";

async function registrarAuditoria(
  { table, recurso, rota, metodo, codigo, payload, operacao, status },
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

  // Registra auditoria na tabela específica se informada
  if (table) {
    try {
      const modelName = table
        .replace(/_log$/, "Log")
        .replace(/_/g, "")
        .replace(/^\w/, (c) => c.toUpperCase());
      // Mapear nomes das tabelas para modelos do Prisma
      const modelMap = {
        pedidos_log: "PedidoLog",
        entidades_log: "EntidadeLog",
        produtos_log: "ProdutoLog",
        ordens_servico_log: "OrdemServicoLog",
        health_log: "HealthLog",
      };

      const model = modelMap[table];
      if (model && prisma[model[0].toLowerCase() + model.slice(1)]) {
        await prisma[model[0].toLowerCase() + model.slice(1)].create({
          data: base,
        });
      }
    } catch (error) {
      errors.push({ table, message: error.message });
    }
  }

  // Registra também no API_LOG_TABLE
  try {
    const apiLog = {
      ...base,
      recurso: recurso || "desconhecido",
      rota: rota || null,
      metodo: metodo || null,
    };
    await prisma.apiLog.create({ data: apiLog });
  } catch (error) {
    errors.push({ table: API_LOG_TABLE, message: error.message });
  }

  if (errors.length && !ignoreFailure) {
    const err = new Error("Falha ao registrar auditoria no banco de dados.");
    err.details = errors
      .map((item) => `${item.table}: ${item.message}`)
      .join(" | ");
    throw err;
  }
}

module.exports = {
  registrarAuditoria,
};
