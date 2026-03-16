-- CreateTable Unit (Unidade/Tenant multi-tenant)
CREATE TABLE "units" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "nome" text NOT NULL,
    "credencial_uniplus_user" text,
    "credencial_uniplus_pass" text,
    "created_at" timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamptz(6) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- AlterTable User: Add unit_id e mudar role
ALTER TABLE "users" ADD COLUMN "unit_id" uuid;
ALTER TABLE "users" ADD COLUMN "is_active" boolean NOT NULL DEFAULT true;

-- CreateIndex Unit
CREATE UNIQUE INDEX "units_nome_key" ON "units"("nome");

-- CreateForeignKey User.unitId -> Unit.id
ALTER TABLE "users" ADD CONSTRAINT "users_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE;

-- CreateIndex User.unit_id
CREATE INDEX "users_unit_id_idx" ON "users"("unit_id");

-- CreateTable AuditLog (auditoria de ações)
CREATE TABLE "audit_logs" (
    "id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "unit_id" uuid NOT NULL,
    "user_id" uuid NOT NULL,
    "acao" text NOT NULL,
    "recurso" text NOT NULL,
    "detalhes" jsonb,
    "timestamp" timestamptz(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateForeignKey AuditLog.unitId -> Unit.id
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE;

-- CreateForeignKey AuditLog.userId -> User.id
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- CreateIndex AuditLog
CREATE INDEX "audit_logs_unit_id_idx" ON "audit_logs"("unit_id");
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");
