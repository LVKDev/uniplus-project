// Auditoria simplificada - registra logs silenciosamente sem bloquear a aplicação
// Se Prisma estiver disponível, usa o banco; senão, apenas loga no console

let prisma = null;

try {
  const { PrismaClient } = require("@prisma/client");
  prisma = new PrismaClient();
} catch (error) {
  console.warn("⚠️  @prisma/client nao disponivel. Auditoria desativada.");
}

const API_LOG_TABLE = "api_logs";

async function registrarAuditoria(
  { table, recurso, rota, metodo, codigo, payload, operacao, status },
  { ignoreFailure = true } = {},
) {
  try {
    // Se Prisma não estiver disponível, apenas loga no console (sem erro)
    if (!prisma) {
      console.log(`[AUDIT] ${operacao} - ${recurso} (${status})`);
      return;
    }

    const base = {
      codigo: codigo ?? null,
      payload: payload ?? {},
      operacao,
      status,
      dataOperacao: new Date(),
    };

    // Registra auditoria na tabela específica se informada
    if (table) {
      try {
        const modelMap = {
          pedidos_log: "pedidoLog",
          entidades_log: "entidadeLog",
          produtos_log: "produtoLog",
          ordens_servico_log: "ordemServicoLog",
          health_log: "healthLog",
        };

        const modelName = modelMap[table];
        if (modelName && prisma[modelName]) {
          await prisma[modelName].create({ data: base });
        }
      } catch (error) {
        console.warn(`[AUDIT ERROR] Falha ao registrar em ${table}:`, error.message);
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
      if (prisma.apiLog) {
        await prisma.apiLog.create({ data: apiLog });
      }
    } catch (error) {
      console.warn(`[AUDIT ERROR] Falha ao registrar API log:`, error.message);
    }
  } catch (error) {
    // Nunca falha - apenas loga o erro
    console.warn("[AUDIT ERROR]", error.message);
  }
}

module.exports = {
  registrarAuditoria,
};
  registrarAuditoria,
};
