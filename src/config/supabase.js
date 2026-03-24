const { createClient } = require("@supabase/supabase-js");

// Supabase client used for audit logging (creates/deletes).
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false },
  });
} else {
  console.warn(
    "⚠️  SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY nao fornecidos. Auditoria no Supabase desativada.",
  );
}

module.exports = supabase;
