const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  });
  console.log("Usuários no banco:");
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

checkUsers().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
