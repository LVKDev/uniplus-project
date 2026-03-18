const { createClient } = require("@supabase/supabase-js");

// Supabase client (optional - usando DATABASE_URL com Prisma)
// Nota: DATABASE_URL com Prisma é a abordagem principal.
// Este client é mantido apenas para compatibilidade legacy.
const supabaseUrl =
  process.env.SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

module.exports = supabase;
