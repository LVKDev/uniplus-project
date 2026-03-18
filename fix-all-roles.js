const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function fixAllRoles() {
  console.log("🔧 Corrigindo roles de TODOS os usuários...\\n");

  // 1. Corrigir 'superadmin' -> 'SUPER_ADMIN'
  const updated1 = await p.user.updateMany({
    where: { role: "superadmin" },
    data: { role: "SUPER_ADMIN" },
  });

  console.log(`✅ ${updated1.count} usuários com role 'superadmin' corrigidos`);

  // 2. Listar todos finais
  const allUsers = await p.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      unitId: true,
      isActive: true,
    },
    orderBy: { email: "asc" },
  });

  console.log("\\n📋 Todos os usuários (FINAL):");
  allUsers.forEach((u) => {
    const unit = u.unitId ? `Unit: ${u.unitId}` : "Unit: Nenhuma";
    console.log(
      `  - ${u.email.padEnd(35)} | Role: ${u.role.padEnd(15)} | ${unit}`
    );
  });

  await p.$disconnect();
}

fixAllRoles().catch(console.error);
