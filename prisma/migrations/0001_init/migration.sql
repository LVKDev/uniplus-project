CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS "pedidos_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "codigo" TEXT,
  "payload" JSONB NOT NULL,
  "operacao" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "data_operacao" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "pedidos_log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "entidades_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "codigo" TEXT,
  "payload" JSONB NOT NULL,
  "operacao" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "data_operacao" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "entidades_log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "produtos_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "codigo" TEXT,
  "payload" JSONB NOT NULL,
  "operacao" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "data_operacao" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "produtos_log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ordens_servico_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "codigo" TEXT,
  "payload" JSONB NOT NULL,
  "operacao" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "data_operacao" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "ordens_servico_log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "health_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "codigo" TEXT,
  "payload" JSONB NOT NULL,
  "operacao" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "data_operacao" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "health_log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "empresas_log" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "codigo" TEXT,
  "payload" JSONB NOT NULL,
  "operacao" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "data_operacao" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "empresas_log_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "api_logs" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "recurso" TEXT NOT NULL,
  "rota" TEXT,
  "metodo" TEXT,
  "codigo" TEXT,
  "payload" JSONB NOT NULL,
  "operacao" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "data_operacao" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "api_logs_pkey" PRIMARY KEY ("id")
);
