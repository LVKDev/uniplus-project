require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    const tables = await prisma.$queryRaw`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `;

    console.log("\n📊 Tabelas no banco:");
    console.log("─".repeat(50));
    tables.forEach((t) => console.log("  •", t.tablename));
    console.log("─".repeat(50));
    console.log(`Total: ${tables.length} tabelas\n`);
  } catch (error) {
    console.error("❌ Erro ao verificar banco:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
