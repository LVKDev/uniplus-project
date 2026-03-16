#!/usr/bin/env node

require("dotenv").config();
const jwt = require("jsonwebtoken");

const token = process.argv[2];

if (!token) {
  console.error("❌ Uso: node verify-token.js <token>");
  console.error("\nExemplo:");
  console.error("  node verify-token.js eyJhbGciOiJIUzI1NiIsInR5cCI...");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("❌ Erro: JWT_SECRET não definido no .env");
  process.exit(1);
}

try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  console.log("\n✅ Token Válido!\n");
  console.log("━".repeat(60));
  console.log(JSON.stringify(decoded, null, 2));
  console.log("━".repeat(60));

  // Mostrar tempo até expiração
  const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
  const hours = Math.floor(expiresIn / 3600);
  const minutes = Math.floor((expiresIn % 3600) / 60);

  console.log(`\n⏰ Expira em: ${hours}h ${minutes}m\n`);
} catch (error) {
  if (error.name === "TokenExpiredError") {
    console.error("❌ Token Expirado!");
    console.error("Data de expiração:", new Date(error.expiredAt));
  } else if (error.name === "JsonWebTokenError") {
    console.error("❌ Token Inválido!");
  } else {
    console.error("❌ Erro:", error.message);
  }
  process.exit(1);
}
