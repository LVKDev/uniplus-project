const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function checkUsers() {
  console.log("📋 Todos os usuários:\n");
  const users = await p.user.findMany({
    select: { id: true, email: true, role: true, unitId: true, isActive: true },
    orderBy: { email: "asc" }
  });
  
  users.forEach(u => {
    const unit = u.unitId ? u.unitId.substring(0, 8) : "----";
    const status = u.isActive ? "✅" : "❌";
    console.log(`${u.email.padEnd(35)} | ${u.role.padEnd(15)} | Unit: ${unit} | ${status}`);
  });
  
  // Específicamente o admin
  console.log("\n🔍 Especificamente admin@cerionuniplus.com.br:");
  const admin = await p.user.findUnique({
    where: { email: "admin@cerionuniplus.com.br" },
    select: { id: true, email: true, role: true, unitId: true, tenant_id: true }
  });
  
  if (admin) {
    console.log(JSON.stringify(admin, null, 2));
  } else {
    console.log("❌ Não encontrado!");
  }
  
  await p.$disconnect();
}

checkUsers().catch(console.error);
