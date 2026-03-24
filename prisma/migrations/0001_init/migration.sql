-- Create table for audit logs (MySQL version)
CREATE TABLE IF NOT EXISTS `pedidos_log` (
  `id` VARCHAR(25) PRIMARY KEY,
  `codigo` LONGTEXT,
  `payload` JSON NOT NULL,
  `operacao` LONGTEXT NOT NULL,
  `status` LONGTEXT NOT NULL,
  `data_operacao` DATETIME(3) NOT NULL
);

