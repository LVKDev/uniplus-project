const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  try {
    // ========================================
    // LIMPAR DADOS EXISTENTES (opcional)
    // ========================================
    // Descomente para resetar o banco
    // await prisma.userPermission.deleteMany({});
    // await prisma.user.deleteMany({});
    // await prisma.unit.deleteMany({});

    // ========================================
    // CRIAR SUPER ADMIN
    // ========================================
    const superadminEmail =
      process.env.SUPERADMIN_EMAIL || "superadmin@uniplus.com";
    const superadminPassword =
      process.env.SUPERADMIN_PASSWORD || "SuperAdmin@123";

    let superadmin = await prisma.user.findUnique({
      where: { email: superadminEmail },
    });

    if (!superadmin) {
      superadmin = await prisma.user.create({
        data: {
          email: superadminEmail,
          passwordHash: await hashPassword(superadminPassword),
          role: "SUPER_ADMIN",
          isActive: true,
        },
      });
      console.log("✅ SuperAdmin criado:", superadmin.email);
    } else {
      console.log("✅ SuperAdmin já existe:", superadmin.email);
    }

    // ========================================
    // CRIAR UNIDADES EXEMPLO
    // ========================================
    let unidade1 = await prisma.unit.findUnique({
      where: { nome: "Unidade São Paulo" },
    });

    if (!unidade1) {
      unidade1 = await prisma.unit.create({
        data: {
          nome: "Unidade São Paulo",
          credencial_uniplus_user: "user_sp", // Em produção, seria encriptado
          credencial_uniplus_pass: "pass_sp",
        },
      });
      console.log("✅ Unidade criada:", unidade1.nome);
    } else {
      console.log("✅ Unidade já existe:", unidade1.nome);
    }

    let unidade2 = await prisma.unit.findUnique({
      where: { nome: "Unidade Rio de Janeiro" },
    });

    if (!unidade2) {
      unidade2 = await prisma.unit.create({
        data: {
          nome: "Unidade Rio de Janeiro",
          credencial_uniplus_user: "user_rj",
          credencial_uniplus_pass: "pass_rj",
        },
      });
      console.log("✅ Unidade criada:", unidade2.nome);
    } else {
      console.log("✅ Unidade já existe:", unidade2.nome);
    }

    // ========================================
    // CRIAR USERS PARA UNIDADE 1
    // ========================================

    // Admin de Unidade
    let adminU1 = await prisma.user.findUnique({
      where: { email: "admin@sp.com" },
    });

    if (!adminU1) {
      adminU1 = await prisma.user.create({
        data: {
          email: "admin@sp.com",
          passwordHash: await hashPassword("Admin@123"),
          role: "ADMIN_UNIDADE",
          unitId: unidade1.id,
          isActive: true,
          permissions: {
            create: [
              { resource: "ver_produtos", action: "READ" },
              { resource: "editar_produtos", action: "WRITE" },
              { resource: "ver_clientes", action: "READ" },
              { resource: "editar_clientes", action: "WRITE" },
              { resource: "gerenciar_usuarios", action: "WRITE" },
              { resource: "ver_auditoria", action: "READ" },
            ],
          },
        },
      });
      console.log("✅ Admin de Unidade criado (SP):", adminU1.email);
    } else {
      console.log("✅ Admin de Unidade já existe (SP):", adminU1.email);
    }

    // Funcionário
    let funcU1 = await prisma.user.findUnique({
      where: { email: "funcionario@sp.com" },
    });

    if (!funcU1) {
      funcU1 = await prisma.user.create({
        data: {
          email: "funcionario@sp.com",
          passwordHash: await hashPassword("Func@123"),
          role: "FUNCIONARIO",
          unitId: unidade1.id,
          isActive: true,
          permissions: {
            create: [
              { resource: "ver_produtos", action: "READ" },
              { resource: "ver_clientes", action: "READ" },
            ],
          },
        },
      });
      console.log("✅ Funcionário criado (SP):", funcU1.email);
    } else {
      console.log("✅ Funcionário já existe (SP):", funcU1.email);
    }

    // ========================================
    // CRIAR USERS PARA UNIDADE 2
    // ========================================

    // Admin de Unidade
    let adminU2 = await prisma.user.findUnique({
      where: { email: "admin@rj.com" },
    });

    if (!adminU2) {
      adminU2 = await prisma.user.create({
        data: {
          email: "admin@rj.com",
          passwordHash: await hashPassword("Admin@123"),
          role: "ADMIN_UNIDADE",
          unitId: unidade2.id,
          isActive: true,
          permissions: {
            create: [
              { resource: "ver_produtos", action: "READ" },
              { resource: "editar_produtos", action: "WRITE" },
              { resource: "ver_clientes", action: "READ" },
              { resource: "editar_clientes", action: "WRITE" },
              { resource: "gerenciar_usuarios", action: "WRITE" },
              { resource: "ver_auditoria", action: "READ" },
            ],
          },
        },
      });
      console.log("✅ Admin de Unidade criado (RJ):", adminU2.email);
    } else {
      console.log("✅ Admin de Unidade já existe (RJ):", adminU2.email);
    }

    // Funcionário
    let funcU2 = await prisma.user.findUnique({
      where: { email: "funcionario@rj.com" },
    });

    if (!funcU2) {
      funcU2 = await prisma.user.create({
        data: {
          email: "funcionario@rj.com",
          passwordHash: await hashPassword("Func@123"),
          role: "FUNCIONARIO",
          unitId: unidade2.id,
          isActive: true,
          permissions: {
            create: [
              { resource: "ver_produtos", action: "READ" },
              { resource: "ver_clientes", action: "READ" },
            ],
          },
        },
      });
      console.log("✅ Funcionário criado (RJ):", funcU2.email);
    } else {
      console.log("✅ Funcionário já existe (RJ):", funcU2.email);
    }

    console.log("\n✨ Seed completado com sucesso!");
    console.log("\n📝 Credenciais de teste:");
    console.log("--------------------------------------");
    console.log("SuperAdmin:");
    console.log(`  Email: ${superadminEmail}`);
    console.log(`  Senha: ${superadminPassword}`);
    console.log("\nAdmin Unidade SP:");
    console.log("  Email: admin@sp.com");
    console.log("  Senha: Admin@123");
    console.log("\nFuncionário SP:");
    console.log("  Email: funcionario@sp.com");
    console.log("  Senha: Func@123");
    console.log("\nAdmin Unidade RJ:");
    console.log("  Email: admin@rj.com");
    console.log("  Senha: Admin@123");
    console.log("\nFuncionário RJ:");
    console.log("  Email: funcionario@rj.com");
    console.log("  Senha: Func@123");
    console.log("--------------------------------------\n");
  } catch (error) {
    console.error("❌ Erro no seed:", error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error("Falha no seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
