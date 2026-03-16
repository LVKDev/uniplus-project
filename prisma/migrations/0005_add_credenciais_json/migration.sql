-- AddColumn to units table
-- Adiciona novo campo para armazenar credenciais Uniplus completas em JSON encriptado
ALTER TABLE "units" ADD COLUMN "credenciais_json" TEXT;

-- Adiciona índice para facilitar consultas futuras
CREATE INDEX "units_credenciais_json_idx" ON "units"(COALESCE("credenciais_json", ''));
