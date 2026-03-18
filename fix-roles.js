const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function fixRoles() {
  console.log("🔧 Corrigindo roles dos usuários...\\n");

  // Atualizar SuperAdmin de 'superadmin' para 'SUPER_ADMIN'
  const superadmin = await p.user.update({
    where: { email: "admin@cerionuniplus.com.br" },
    data: { role: "SUPER_ADMIN" },
    select: {
      id: true,
      email: true,
      role: true,
      unitId: true,
    },
  });

  console.log("✅ SuperAdmin atualizado:");
  console.log(JSON.stringify(superadmin, null, 2));

  // Listar todos os usuários para verificar
  const allUsers = await p.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      unitId: true,
      isActive: true,
    },
  });

  console.log("\\n📋 Todos os usuários após atualização:");
  console.log(JSON.stringify(allUsers, null, 2));

  await p.$disconnect();
}

fixRoles().catch(console.error);
