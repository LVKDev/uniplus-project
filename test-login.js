const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function testLogin() {
  try {
    // Buscar o SuperAdmin
    const user = await prisma.user.findUnique({
      where: { email: "admin@cerionuniplus.com.br" },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      console.log("❌ Usuário não encontrado");
      return;
    }

    console.log("✅ Usuário encontrado:", user.email);
    console.log("   Role:", user.role);
    console.log("   Ativo:", user.isActive);
    console.log(
      "   HashHash:",
      user.passwordHash ? "Sim (presente)" : "Não (vazio)",
    );

    // Testar senha
    const password = "SuperAdmin@2026";
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (passwordMatch) {
      console.log("✅ Senha CORRETA!");
    } else {
      console.log("❌ Senha INCORRETA");

      // Tentar recriar o hash e comparar
      const newHash = await bcrypt.hash(password, 10);
      console.log("\n   Hash armazenado    :", user.passwordHash);
      console.log("   Novo hash gerado   :", newHash);
    }
  } catch (error) {
    console.error("❌ Erro:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
