-- Create generic API log table (MySQL version)
CREATE TABLE IF NOT EXISTS `api_logs` (
  `id` VARCHAR(25) NOT NULL PRIMARY KEY,
  `recurso` LONGTEXT NOT NULL,
  `rota` LONGTEXT,
  `metodo` LONGTEXT,
  `codigo` LONGTEXT,
  `payload` JSON NOT NULL,
  `operacao` LONGTEXT NOT NULL,
  `status` LONGTEXT NOT NULL,
  `data_operacao` DATETIME(3) NOT NULL
);

-- Create per-resource log tables
CREATE TABLE IF NOT EXISTS `entidades_log` (
  `id` VARCHAR(25) NOT NULL PRIMARY KEY,
  `codigo` LONGTEXT,
  `payload` JSON NOT NULL,
  `operacao` LONGTEXT NOT NULL,
  `status` LONGTEXT NOT NULL,
  `data_operacao` DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS `produtos_log` (
  `id` VARCHAR(25) NOT NULL PRIMARY KEY,
  `codigo` LONGTEXT,
  `payload` JSON NOT NULL,
  `operacao` LONGTEXT NOT NULL,
  `status` LONGTEXT NOT NULL,
  `data_operacao` DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS `ordens_servico_log` (
  `id` VARCHAR(25) NOT NULL PRIMARY KEY,
  `codigo` LONGTEXT,
  `payload` JSON NOT NULL,
  `operacao` LONGTEXT NOT NULL,
  `status` LONGTEXT NOT NULL,
  `data_operacao` DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS `health_log` (
  `id` VARCHAR(25) NOT NULL PRIMARY KEY,
  `codigo` LONGTEXT,
  `payload` JSON NOT NULL,
  `operacao` LONGTEXT NOT NULL,
  `status` LONGTEXT NOT NULL,
  `data_operacao` DATETIME(3) NOT NULL
);
