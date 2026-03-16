-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_tenant_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN "unit_id" UUID;
ALTER TABLE "users" ALTER COLUMN "tenant_id" DROP NOT NULL;

-- CreateTable Units
CREATE TABLE IF NOT EXISTS "units" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "credencial_uniplus_user" TEXT,
    "credencial_uniplus_pass" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable AuditLogs
CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "acao" TEXT NOT NULL,
    "recurso" TEXT NOT NULL,
    "detalhes" JSONB,
    "timestamp" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex Units
CREATE UNIQUE INDEX IF NOT EXISTS "units_nome_key" ON "units"("nome");

-- CreateIndex AuditLogs
CREATE INDEX IF NOT EXISTS "audit_logs_unit_id_idx" ON "audit_logs"("unit_id");
CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex Users
CREATE INDEX IF NOT EXISTS "users_unit_id_idx" ON "users"("unit_id");

-- AddForeignKey User
ALTER TABLE "users" ADD CONSTRAINT "users_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "users" ADD CONSTRAINT "users_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey AuditLogs
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
