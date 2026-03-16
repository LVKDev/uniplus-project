const supabase = require("../config/supabase");

const API_LOG_TABLE = "api_logs";

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
    userId = null,
    tenantId = null,
  },
  { ignoreFailure = false } = {},
) {
  const base = {
    codigo: codigo ?? null,
    payload: payload ?? {},
    operacao,
    status,
    data_operacao: new Date().toISOString(),
    user_id: userId,
    tenant_id: tenantId,
  };

  const errors = [];

  if (table) {
    const { error } = await supabase.from(table).insert(base);
    if (error) {
      errors.push({ table, message: error.message });
    }
  }

  const apiLog = {
    ...base,
    recurso: recurso || "desconhecido",
    rota: rota || null,
    metodo: metodo || null,
  };
  const { error: apiError } = await supabase.from(API_LOG_TABLE).insert(apiLog);
  if (apiError) {
    errors.push({ table: API_LOG_TABLE, message: apiError.message });
  }

  if (errors.length && !ignoreFailure) {
    const err = new Error("Falha ao registrar auditoria no Supabase.");
    err.details = errors
      .map((item) => `${item.table}: ${item.message}`)
      .join(" | ");
    throw err;
  }
}

module.exports = {
  registrarAuditoria,
};
