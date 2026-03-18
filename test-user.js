const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

async function test() {
  const user = await p.user.findUnique({
    where: { email: "admin@cerionuniplus.com.br" },
    select: {
      id: true,
      email: true,
      role: true,
      unitId: true,
      isActive: true,
      permissions: {
        select: {
          resource: true,
          action: true,
        },
      },
    },
  });

  console.log("Usuário no banco:");
  console.log(JSON.stringify(user, null, 2));
  
  await p.$disconnect();
}

test().catch(console.error);
