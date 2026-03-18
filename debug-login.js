const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { loginUser } = require('./src/services/auth.service');

const prisma = new PrismaClient();

async function debugLogin() {
  try {
    console.log('=== Debug Login ===\n');
    
    // 1. Buscar usuário direto
    console.log('1. Buscando usuário...');
    const user = await prisma.user.findUnique({
      where: { email: 'admin@cerionuniplus.com.br' },
      include: { permissions: true },
    });
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      return;
    }
    console.log('✅ Usuário encontrado:', user.email);
    console.log('   isActive:', user.isActive);
    console.log('   permissions:', user.permissions);
    
    // 2. Verificar senha
    console.log('\n2. Verificando senha...');
    const password = 'SuperAdmin@2026';
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    console.log('✅ Senha match:', passwordMatch);
    
    // 3. Tentar loginUser
    console.log('\n3. Chamando loginUser()...');
    const result = await loginUser('admin@cerionuniplus.com.br', 'SuperAdmin@2026');
    
    if (result) {
      console.log('✅ Login bem-sucedido!');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('❌ loginUser retornou null');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugLogin();
