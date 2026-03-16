# 🚀 GUIA DE TESTE LOCAL - Uniplus Project

## Pré-requisitos

- ✅ Node.js 18+
- ✅ npm (já instalado com Node)
- ✅ Postgres (ou Supabase remoto - já configurado)
- ✅ Arquivo `.env` na raiz (já existe)

---

## ⚡ QUICKSTART (5 minutos)

### **1️⃣ Instalar dependências**

```bash
cd c:\Users\luiza\Documents\GitHub\uniplus-project
npm install
```

### **2️⃣ Setup do Banco de Dados**

```bash
# Rodar migrations (cria tabelas)
npm run db:migrate

# Seed de dados (cria SUPER_ADMIN e 2 unidades de teste)
npm run db:seed
```

### **3️⃣ Rodar servidor**

```bash
npm start
# OU com auto-reload (para desenvolvimento)
npm run dev
```

Verá:

```
✅ Server running on http://localhost:3000
```

---

## 🧪 TESTE 1: Login com SUPER_ADMIN

### **A) No Navegador**

1. Abra: http://localhost:3000
2. Login:
   - **Email**: `admin@cerionuniplus.com.br` (ou `superadmin@uniplus.local`)
   - **Senha**: `SuperAdmin@2026`
3. Verá: **Dashboard com aba "SUPER_ADMIN"**

### **B) Via cURL (Terminal)**

```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cerionuniplus.com.br","senha":"SuperAdmin@2026"}'

# Response esperado:
# {
#   "success": true,
#   "token": "eyJhbGc...",
#   "user": {
#     "id": "uuid",
#     "email": "admin@cerionuniplus.com.br",
#     "role": "SUPER_ADMIN",
#     "permissions": ["ver_produtos", "editar_produtos", "ver_clientes", ...]
#   }
# }
```

---

## 🧪 TESTE 2: SUPER_ADMIN criar Unidade

### **Via Dashboard**

1. Após login, vá para aba **"Unidades"**
2. Preencha:
   - **Nome**: `Empresa Teste`
   - **Uniplus User**: `seu-usuario`
   - **Uniplus Pass**: `sua-senha`
3. Clique **"Criar Unidade"**
4. Verá na tabela a nova unidade criada ✅

### **Via cURL**

```bash
# Primeiro, faça login para pegar o token (veja TESTE 1)
TOKEN="seu-token-aqui"

curl -X POST "http://localhost:3000/api/unidades" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Empresa Test via API",
    "credencial_uniplus_user": "usuario123",
    "credencial_uniplus_pass": "senha123"
  }'

# Response:
# {
#   "success": true,
#   "unit_id": "uuid-novo-gerado",
#   "message": "Unidade criada com sucesso"
# }
```

---

## 🧪 TESTE 3: Listar Unidades

```bash
TOKEN="seu-token-aqui"

curl -X GET "http://localhost:3000/api/unidades" \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": "uuid",
#       "nome": "Empresa Teste"
#     }
#   ]
# }
```

---

## 🧪 TESTE 4: SUPER_ADMIN criar Usuário (em uma unidade)

### **Via Dashboard**

1. Faça login como SUPER_ADMIN
2. Vá para aba **"Unidades"**
3. Clique em uma unidade (ex: "Empresa Teste")
4. Vá para **"Usuários da Unidade"**
5. Clique **"Criar Usuário"** e preencha:
   - **Nome**: `João Funcionário`
   - **Email**: `joao@empresa.com.br`
   - **Senha**: `Joa@123456` (8+ chars, maiúscula, número)
   - **Permissões**: Selecione as desejadas
6. Salve ✅

### **Via cURL**

```bash
TOKEN="seu-token-aqui"
UNIT_ID="uuid-da-unidade"

curl -X POST "http://localhost:3000/api/usuarios" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "unit_id": "'$UNIT_ID'",
    "nome": "Maria Admin",
    "email": "maria@empresa.com.br",
    "senha": "Maria@123456",
    "permissions": ["ver_produtos", "editar_produtos", "ver_clientes"]
  }'

# Response:
# {
#   "success": true,
#   "user_id": "uuid-novo",
#   "message": "Usuário criado com sucesso"
# }
```

---

## 🧪 TESTE 5: ADMIN_UNIDADE listar Usuários de sua unidade

```bash
TOKEN="admin-unidade-token"

curl -X GET "http://localhost:3000/api/usuarios" \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": "uuid",
#       "email": "joao@empresa.com.br",
#       "nome": "João Funcionário",
#       "role": "FUNCIONARIO",
#       "permissions": ["ver_produtos", "editar_produtos", ...]
#     }
#   ]
# }
```

---

## 🧪 TESTE 6: SUPER_ADMIN acessar Auditoria

```bash
TOKEN="super-admin-token"

# Listar todos os logs de auditoria
curl -X GET "http://localhost:3000/api/auditoria?limit=25&offset=0" \
  -H "Authorization: Bearer $TOKEN"

# Filtrar por ação (CREATE, UPDATE, DELETE)
curl -X GET "http://localhost:3000/api/auditoria?acao=CREATE&recurso=usuario" \
  -H "Authorization: Bearer $TOKEN"

# Response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": "uuid",
#       "timestamp": "2026-03-16T10:30:00Z",
#       "usuario": "admin@cerionuniplus.com.br",
#       "unidade": "Empresa Teste",
#       "acao": "CREATE",
#       "recurso": "usuario",
#       "detalhes": {...}
#     }
#   ],
#   "pagination": {total: 50, limit: 25, offset: 0, pages: 2, currentPage: 1}
# }
```

---

## 🧪 TESTE 7: Segurança - Unit Isolation

### **User A tenta ver dados de Unit B → 403 Forbidden**

```bash
# Token do User A (Unit "Empresa Teste")
TOKEN_USER_A="token-user-a"

# Tenta acessar /api/produtos (que filtra por unit_id automaticamente)
curl -X GET "http://localhost:3000/api/produtos" \
  -H "Authorization: Bearer $TOKEN_USER_A"

# Se User A tentar forçar unit_id de outra unidade...
curl -X GET "http://localhost:3000/api/produtos?unitId=outra-unit-uuid" \
  -H "Authorization: Bearer $TOKEN_USER_A"

# Response: 403 Forbidden (bloqueado por globalTenantValidation)
# {
#   "success": false,
#   "error": "Acesso negado para esta unidade"
# }
```

---

## 🧪 TESTE 8: Segurança - Permissões

### **FUNCIONARIO sem editar_produtos tenta fazer PATCH → 403**

```bash
TOKEN_FUNC="token-funcionario-sem-permissao"

curl -X PATCH "http://localhost:3000/api/produtos/001" \
  -H "Authorization: Bearer $TOKEN_FUNC" \
  -H "Content-Type: application/json" \
  -d '{"preco": 150.00}'

# Response: 403 Forbidden
# {
#   "success": false,
#   "error": "Permissão negada para editar_produtos"
# }
```

---

## 🧪 TESTE 9: Rate Limiting

### **Testar limite de login: 5 tentativas por 15 minutos**

```bash
# Tentar login 6 vezes com email errado...
for i in {1..6}; do
  echo "Tentativa $i:"
  curl -X POST "http://localhost:3000/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","senha":"wrong"}'
  echo ""
done

# Resultado:
# Tentativas 1-5: 400 Bad Request (email ou senha inválidos)
# Tentativa 6: 429 Too Many Requests
# "Muitas tentativas de login. Tente novamente em 15 minutos."
```

---

## 🧪 TESTE 10: CORS Bloqueado

### **Request de origin não autorizado → 403**

```bash
curl -X OPTIONS "http://localhost:3000/api/produtos" \
  -H "Origin: https://non-authorized-site.com"

# Response: 403 CORS policy violation
# {
#   "success": false,
#   "error": "CORS policy: Origin not allowed"
# }

# Mas localhost:3000 é permitido:
curl -X OPTIONS "http://localhost:3000/api/produtos" \
  -H "Origin: http://localhost:3000"

# Response: 200 OK (CORS headers adicionados)
```

---

## 📊 TESTES AUTOMATIZADOS

```bash
# Rodar todos os testes
npm test

# Apenas testes de segurança
npm run test:security

# Apenas testes de rate limit/CORS
npm run test:ratelimit

# Com cobertura de código
npm run test:coverage
```

---

## 🔐 Dados de Teste Criados por Seed

Após `npm run db:seed`, terá:

### **Super Admin**

- Email: `admin@cerionuniplus.com.br`
- Senha: `SuperAdmin@2026`
- Role: `SUPER_ADMIN`
- Permissões: TODAS ✅

### **Unidades** (2 de teste)

1. `Empresa Teste 1`
2. `Empresa Teste 2`

### **Usuários** (por unidade)

1. **Admin Unidade** (ADMIN_UNIDADE)
   - Permissões: Todas menos SUPER_ADMIN
2. **Funcionário** (FUNCIONARIO)
   - Permissões: ver_produtos, ver_clientes

---

## � SEGURANÇA: Armazenar Credenciais Uniplus por Unidade

### **O Problema Original**

No `.env` você tinha credenciais GLOBAIS compartilhadas por TODAS as unidades, o que é inseguro em multi-tenant. Agora cada unidade tem suas **PRÓPRIAS credenciais encriptadas**.

### **A Solução**

✅ **AES-256-GCM enсriptação** de JSON completo
✅ **Armazenamento seguro** em banco de dados (nunca em plaintext)
✅ **Isolamento por unidade** - cada unidade tem credenciais diferentes
✅ **Backup automático** - credenciais nunca saem do servidor

### **Estrutura de Credenciais Uniplus (JSON)**

Cada unidade armazena um objeto JSON com TODOS os dados necessários:

```json
{
  "base_url": "https://next-01.webuniplus.com/public-api",
  "server_url": "https://next-01.webuniplus.com",
  "client_id": "homologacao",
  "client_secret": "a50037cd-92f5-4bfd-8d52-f81cb5e6a08e",
  "token": "",
  "auth_basic": "Z2FsZWdvYWd1YWVnYXM6YjdkZTA0ODItYzhmOS00MGQxLWFhM2EtZjQ3ZjZlODEwYzIy",
  "tenant": "galegoaguaegas",
  "access_key": "b7de0482-c8f9-40d1-aa3a-f47f6e810c22",
  "limit": 100
}
```

---

## 🧪 TESTE 11: Criar Unidade com Credenciais Uniplus Completas

### **Novo Endpoint: POST /api/unidades/full-credentials**

```bash
TOKEN="super-admin-token"

curl -X POST "http://localhost:3000/api/unidades/full-credentials" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Empresa Galegoaguaegas",
    "credenciais_uniplus": {
      "base_url": "https://next-01.webuniplus.com/public-api",
      "server_url": "https://next-01.webuniplus.com",
      "client_id": "homologacao",
      "client_secret": "a50037cd-92f5-4bfd-8d52-f81cb5e6a08e",
      "token": "",
      "auth_basic": "Z2FsZWdvYWd1YWVnYXM6YjdkZTA0ODItYzhmOS00MGQxLWFhM2EtZjQ3ZjZlODEwYzIy",
      "tenant": "galegoaguaegas",
      "access_key": "b7de0482-c8f9-40d1-aa3a-f47f6e810c22",
      "limit": 100
    }
  }'

# Response esperado:
# {
#   "success": true,
#   "data": {
#     "id": "uuid-nova",
#     "nome": "Empresa Galegoaguaegas",
#     "success": true,
#     "created_at": "2026-03-16T...",
#     "message": "Unidade criada com sucesso com credenciais encriptadas"
#   }
# }
```

### **No Dashboard**

1. Faça login como SUPER_ADMIN
2. Vá para aba **"Unidades"**
3. Clique **"Criar Unidade"** (novo formulário com campos Uniplus completos)
4. Preencha:
   - **Nome**: Qualquer nome para a unidade
   - **Base URL**: https://next-01.webuniplus.com/public-api
   - **Server URL**: https://next-01.webuniplus.com
   - **Client ID**: Seu ID de integração Uniplus
   - **Client Secret**: Sua secret de integração
   - **Auth Basic**: String base64 com credenciais
   - **Tenant**: Nome do tenant Uniplus
   - **Access Key**: Chave de acesso
   - **Limit**: Número máximo de registros por request
5. **Salvar** ✅

---

## 🧪 TESTE 12: Atualizar Credenciais de Uma Unidade

### **Novo Endpoint: PUT /api/unidades/:unitId/full-credentials**

```bash
TOKEN="super-admin-token"
UNIT_ID="uuid-da-unidade"

curl -X PUT "http://localhost:3000/api/unidades/$UNIT_ID/full-credentials" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "credenciais_uniplus": {
      "base_url": "https://next-01.webuniplus.com/public-api",
      "server_url": "https://next-01.webuniplus.com",
      "client_id": "novo_client_id",
      "client_secret": "novo_secret_aqui",
      "token": "",
      "auth_basic": "novo_auth_basic_base64",
      "tenant": "novo_tenant",
      "access_key": "nova_access_key",
      "limit": 200
    }
  }'

# Response esperado:
# {
#   "success": true,
#   "data": {
#     "success": true,
#     "message": "Credenciais atualizadas com sucesso"
#   }
# }
```

### **Via Dashboard**

1. Após login, vá para aba **"Unidades"**
2. Clique na unidade que quer atualizar
3. Clique **"Editar Credenciais Uniplus"**
4. Atualize os campos desejados
5. **Salvar** ✅

---

## 🔒 Como as Credenciais são Protegidas?

### **1. Encriptação AES-256-GCM**

```javascript
// Em src/lib/encryption.js
encryptCredentialsJSON(credenciais);
// ↓ Converte objeto para JSON string
// ↓ Encripta com AES-256-GCM
// ↓ IV (16 bytes) + AuthTag (16 bytes) + EncryptedData
// ↓ Retorna base64 para armazenamento seguro
```

### **2. Armazenamento no Banco**

- Campo `credenciais_json` em cifra (base64)
- Nunca pode ser lido sem a chave `ENCRYPTION_KEY` do `.env`
- Chave `ENCRYPTION_KEY` tem 32 bytes (256 bits) = segurança máxima

### **3. Decriptação Apenas no servidor**

```javascript
// getUnidadeFullCredentials() desencripta apenas quando NECESSÁRIO
// Para fazer chamadas à API Uniplus
// NUNCA retorna credenciais ao cliente (JSON response)
```

### **4. Nunca Expostas ao Cliente**

```javascript
// ❌ NUNCA fazemos isso:
res.json({ credenciais_uniplus: decryptedCreds });

// ✅ SEMPRE fazemos assim:
res.json({ success: true }); // Sem credenciais!
// A decriptação acontece apenas no servidor
// para fazer chamadas internas à Uniplus API
```

---

## 📋 Checklist de Segurança - Credenciais

- [x] Credenciais encriptadas com AES-256-GCM (arquivo: src/lib/encryption.js)
- [x] ENCRYPTION_KEY com 32 bytes em hex (arquivo: .env)
- [x] Campo credenciais_json adicionado a unidades (migration: 0005_add_credenciais_json)
- [x] Endpoints protegidos por SUPER_ADMIN (POST/PUT /api/unidades/full-credentials)
- [x] Decriptação apenas no servidor (função: getUnidadeFullCredentials)
- [x] Nunca retorna credenciais ao cliente (validado no código)
- [x] Cada unidade tem credenciais independentes (isolamento multi-tenant)
- [x] Fallback para legacy username/password (backwards compatibility)

---

### **Erro: "Cannot find module '@prisma/client'"**

```bash
npm install
```

### **Erro: "DATABASE_URL not configured"**

Verifique `.env` tem `DATABASE_URL`:

```bash
grep DATABASE_URL .env
```

### **Erro: "JWT_SECRET not found"**

Verifique `.env` tem `JWT_SECRET`:

```bash
grep JWT_SECRET .env
```

### **Porta 3000 já em uso**

```bash
# Mude PORT no .env para 3001
PORT=3001
```

### **Banco de dados vazio / migração falhou**

```bash
# Rodar migrations de novo
npm run db:migrate

# Ou resetar tudo (CUIDADO: deleta dados!)
npx prisma migrate reset
```

---

## ✅ Checklist de Teste Completo

- [ ] npm install
- [ ] npm run db:migrate
- [ ] npm run db:seed
- [ ] npm start (ou npm run dev)
- [ ] Login como SUPER_ADMIN ✅
- [ ] Criar nova unidade (legacy username/password) ✅
- [ ] Criar unidade com credenciais JSON completas ✅ (NOVO)
- [ ] Atualizar credenciais de unidade ✅ (NOVO)
- [ ] Criar novo usuário em unidade ✅
- [ ] Login como ADMIN_UNIDADE ✅
- [ ] Listar usuários da unidade ✅
- [ ] Copy token SUPER_ADMIN em teste cURL ✅
- [ ] Testar /api/auditoria ✅
- [ ] Testar permissão 403 (FUNCIONARIO sem editar_produtos) ✅
- [ ] Testar rate limit (6+ logins = 429) ✅
- [ ] Verificar credenciais encriptadas no banco ✅ (NOVO)
- [ ] Rodar `npm test` ✅

---

**🎯 Pronto!** Sistema 100% seguro com multi-tenancy, permissões granulares e credenciais Uniplus protegidas por unidade. 🚀
