#!/usr/bin/env node

require("dotenv").config();
const jwt = require("jsonwebtoken");

const args = process.argv.slice(2);

// Parâmetros: node generate-token.js <userId> <email> <role> [expiresIn]
const userId = args[0] || "ac996991-8f8f-4ed5-9ec0-5ea4c4420126";
const email =
  args[1] || process.env.SUPERADMIN_EMAIL || "admin@galegoaguaegas.com.br";
const role = args[2] || "superadmin";
const expiresIn = args[3] || process.env.JWT_EXPIRE || "24h";

if (!process.env.JWT_SECRET) {
  console.error("❌ Erro: JWT_SECRET não definido no .env");
  process.exit(1);
}

try {
  const token = jwt.sign(
    {
      id: userId,
      email: email,
      role: role,
    },
    process.env.JWT_SECRET,
    { expiresIn },
  );

  console.log("\n📝 JWT Gerado com Sucesso!\n");
  console.log("━".repeat(80));
  console.log(`ID:        ${userId}`);
  console.log(`Email:     ${email}`);
  console.log(`Role:      ${role}`);
  console.log(`Expira:    ${expiresIn}`);
  console.log("━".repeat(80));
  console.log(`\nToken:\n\n${token}\n`);

  // Também verificar o token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  console.log("━".repeat(80));
  console.log("Decodificado:");
  console.log(JSON.stringify(decoded, null, 2));
  console.log("━".repeat(80) + "\n");
} catch (error) {
  console.error("❌ Erro ao gerar token:", error.message);
  process.exit(1);
}
