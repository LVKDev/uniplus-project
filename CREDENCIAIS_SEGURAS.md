# 🔐 Guia: Armazenamento Seguro de Credenciais Uniplus por Unidade

## 1. Visão Geral da Arquitetura

### **Antes (Inseguro)**

```
.env -> UNIPLUS_CLIENT_ID, CLIENT_SECRET
        ↓
    TODAS as unidades usam as MESMAS credenciais
    ❌ Multi-tenant compromised
    ❌ Uma unidade consegue acessar dados de outras
```

### **Depois (Seguro)**

```
Unit A: {credenciais_json: ENCRYPTED_JSON_A}
Unit B: {credenciais_json: ENCRYPTED_JSON_B}
Unit C: {credenciais_json: ENCRYPTED_JSON_C}
        ↓
    Cada unidade tem credenciais ÚNICAS e ENCRIPTADAS
    ✅ Isolamento completo
    ✅ Multi-tenant seguro
```

---

## 2. Fluxo de Encriptação e Decriptação

### **Ao CRIAR uma Unidade**

```javascript
// 1. Usuario (SUPER_ADMIN) envia credenciais via API
POST /api/unidades/full-credentials
{
  "nome": "Empresa XYZ",
  "credenciais_uniplus": {
    "base_url": "...",
    "client_id": "...",
    "client_secret": "..."  // ← Sensível!
    // ... outros campos
  }
}

// 2. Backend recebe JSON
const { credenciais_uniplus } = req.body

// 3. Valida campos obrigatórios
if (!credenciais_uniplus.client_id) throw Error

// 4. ENCRIPTA JSON completo
const encrypted = encryptCredentialsJSON(credenciais_uniplus)
// Resultado: "base64_cifrado_aleatorio"

// 5. Armazena ENCRIPTADO no banco
await prisma.unit.create({
  data: {
    nome: "Empresa XYZ",
    credenciais_json: encrypted  // ← Seguro!
  }
})

// 6. Responde ao cliente SEM revelar credenciais
res.json({ success: true, unit_id: "uuid" })
```

### **Ao USAR as Credenciais (Chamadas Internas)**

```javascript
// 1. Uma rota precisa chamar Uniplus API
// Ex: GET /api/produtos -> precisa de credenciais da unidade

// 2. Backend desencripta APENAS o que precisa
const creds = await getUnidadeFullCredentials(unit_id)
// Resultado: objeto JSON desencriptado EM MEMÓRIA

// 3. Usa credenciais para chamar Uniplus
const response = await uniplumClient.getProdutos(creds)
// Credenciais passadas por REFERÊNCIA, não retornadas

// 4. NUNCA envia credenciais ao cliente
res.json({ produtos: [...] })  // ← Sem credenciais!
```

---

## 3. Técnicas de Encriptação

### **Algoritmo: AES-256-GCM**

- **Tipo**: Authenticated Encryption (data + autenticidade)
- **Chave**: 32 bytes (256 bits) = máxima segurança
- **IV**: 16 bytes aleatórios por encriptação = impossível prever
- **AuthTag**: 16 bytes para verificar integridade

### **Estrutura do Cifrado**

```
Dado original: { "client_id": "abc123", ... }
              ↓ (JSON stringify)
        JSON text string
              ↓ (AES-256-GCM encrypt)
    IV (16 bytes) + AuthTag (16 bytes) + Encrypted Data
              ↓ (base64 encode)
     "aAbBcCdDeEfFgGhHiIjJkKlMmNnOoPpQq..."
              ↓ (armazena no banco)
     credenciais_json = "aAbBcCdDeEfFgGhHiIjJkKlMmNnOoPpQq..."
```

### **Descritação Reversa**

```
"aAbBcCdDeEfFgGhHiIjJkKlMmNnOoPpQq..."
              ↓ (base64 decode)
    IV + AuthTag + Encrypted Data
              ↓ (AES-256-GCM decrypt)
        JSON text string
              ↓ (JSON parse)
{ "client_id": "abc123", ... }
```

---

## 4. Código: Como Funciona a Encriptação

### **Arquivo: src/lib/encryption.js**

```javascript
// Encriptação
function encryptCredentialsJSON(credenciais) {
  // Passo 1: Validar objeto
  if (!credenciais || typeof credenciais !== "object") {
    throw new Error("Credenciais devem ser um objeto");
  }

  // Passo 2: Converter para string JSON
  const jsonString = JSON.stringify(credenciais);
  // Resultado: "{\"base_url\":\"...\",\"client_id\":\"...\"}"

  // Passo 3: Encriptar texto
  return encrypt(jsonString);
  // Função encrypt():
  //   - Gera IV aleatório (16 bytes)
  //   - Cria cipher AES-256-GCM com ENCRYPTION_KEY
  //   - Encripta jsonString
  //   - Obtém AuthTag
  //   - Concatena IV + AuthTag + EncryptedData
  //   - Converte para base64
  //   - Retorna string base64
}

// Decriptação
function decryptCredentialsJSON(encryptedJSON) {
  if (!encryptedJSON) return null;

  try {
    // Passo 1: Decriptar texto
    const jsonString = decrypt(encryptedJSON);
    // Função decrypt():
    //   - Converte base64 para bytes
    //   - Extrai IV (primeiros 16 bytes)
    //   - Extrai AuthTag (próximos 16 bytes)
    //   - Extrai EncryptedData (resto)
    //   - Cria decipher AES-256-GCM
    //   - Define AuthTag
    //   - Decripta EncryptedData
    //   - Retorna string JSON

    // Passo 2: Converter JSON string para objeto
    return JSON.parse(jsonString);
    // Resultado: { base_url: "...", client_id: "..." }
  } catch (error) {
    throw new Error("Falha ao decriptar credenciais");
  }
}
```

---

## 5. ENCRYPTION_KEY: Onde Vem?

### **Setup Inicial**

**Opção 1: Gerar Chave Aleatória**

```bash
# No terminal/PowerShell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Resultado exemplo:
# 0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Copiar para .env
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

**Opção 2: Usar Chave Existente**

```bash
# Se já tem no .env
grep ENCRYPTION_KEY .env

# Copiar o valor e manter seguro
```

### **Segurança da Chave**

✅ **MUITA NESTA CHAVE**: 32 bytes (256 bits)
✅ **ALEATÓRIA**: Gerada por crypto.randomBytes()
✅ **ÚNICA POR AMBIENTE**: .env local ≠ .env staging ≠ .env prod
✅ **NUNCA COMITAR**: Adicione .env ao .gitignore

⚠️ **PERIGO**: Se perder essa chave, NÃO consegue decriptar dados existentes!
⚠️ **PERIGO**: Se vazar essa chave, É POSSÍVEL decriptar TUDO!

### **Backup da Chave**

```bash
# Guarde em lugar seguro (gestor de senhas, cofre seguro)
ENCRYPTION_KEY=seu_valor_aqui

# Backup seguro:
# 1. 1Password, LastPass, Bitwarden
# 2. AWS Secrets Manager, Azure Key Vault, GCP Secret Manager
# 3. Cópia física em cofre bancário
```

---

## 6. Endpoints de Credenciais

### **POST /api/unidades/full-credentials**

- **Quem pode**: SUPER_ADMIN
- **O que faz**: Cria unidade com credenciais JSON encriptadas
- **Campos obrigatórios**: base_url, server_url, client_id, client_secret, auth_basic, tenant, access_key
- **Response**: `{ success: true, unit_id: "uuid" }` (SEM credenciais)
- **Segurança**: HTTPS only, rate limit, validação de campos

### **PUT /api/unidades/:unitId/full-credentials**

- **Quem pode**: SUPER_ADMIN
- **O que faz**: Atualiza credenciais encriptadas existentes
- **Campos obrigatórios**: Mesmos de criação
- **Response**: `{ success: true }` (SEM credenciais)
- **Segurança**: Não retorna dados antigos, apenas confirma sucesso

### **GET /api/unidades/:unitId (INTERNO APENAS)**

- **Quem pode**: Serviços internos (não exposto ao cliente)
- **O que faz**: Retorna credenciais desencriptadas EM MEMÓRIA
- **Uso**: Apenas para chamar Uniplus API
- **Segurança**: Nunca serializa em JSON response

---

## 7. Isolamento Multi-Tenant com Credenciais

### **Cenário: Unit A acessa dados de Unit B?**

```
User A (Unit A)
├─ token JWT tem unit_id = "uuid_a"
├─ credenciais = Credenciais_Unit_A (encriptadas)
│
└─ Tenta acessar: GET /api/produtos?unitId=uuid_b
   ├─ Middleware validaTenant()
   │  └─ if (user.unit_id !== uuid_b) → 403 Forbidden ✅
   │
   └─ Bloqueia mesmo se credenciais de Unit B fossem conhecidas
      └─ Por que? Porque credenciais são desencriptadas apenas
         quando unit_id == user.unit_id
```

---

## 8. Exemplo Real: Fluxo Completo

### **Cenário**: Empresa XYZ com 2 unidades, cada uma com credenciais diferentes

**Setup**

```bash
# Acesso à API
TOKEN_SUPER_ADMIN="jwt_token_here"

# Unidade 1: "Matriz São Paulo"
UNIT_ID_1="uuid-1111"

# Unidade 2: "Filial Rio de Janeiro"
UNIT_ID_2="uuid-2222"
```

**1. Criar Unidade 1**

```bash
curl -X POST "http://localhost:3000/api/unidades/full-credentials" \
  -H "Authorization: Bearer $TOKEN_SUPER_ADMIN" \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Matriz São Paulo",
    "credenciais_uniplus": {
      "base_url": "https://next-01.webuniplus.com/public-api",
      "server_url": "https://next-01.webuniplus.com",
      "client_id": "sp_001",
      "client_secret": "secret_sp_001",
      "auth_basic": "base64_sp_001",
      "tenant": "tenant_sp",
      "access_key": "key_sp_001",
      "limit": 100
    }
  }'

# Resposta:
# { "success": true, "unit_id": "uuid-1111" }

# No banco, armazenado como:
# units.credenciais_json = "aAbBcCdDeEfF..." (encriptado)
```

**2. Criar Unidade 2**

```bash
curl -X POST "http://localhost:3000/api/unidades/full-credentials" \
  -H "Authorization: Bearer $TOKEN_SUPER_ADMIN" \
  -d '{
    "nome": "Filial Rio de Janeiro",
    "credenciais_uniplus": {
      "base_url": "https://next-01.webuniplus.com/public-api",
      "client_id": "rj_002",
      "client_secret": "secret_rj_002",
      ...
    }
  }'

# Resposta:
# { "success": true, "unit_id": "uuid-2222" }

# No banco:
# units.credenciais_json = "xXyYzZaAbBcC..." (encriptado DIFERENTE)
```

**3. User da Unit 1 faz login**

```bash
curl -X POST "http://localhost:3000/auth/login" \
  -d '{"email":"vendedor@sp.com","senha":"..."}'

# Resposta:
# {
#   "token": "jwt_com_unit_id=uuid-1111",
#   "unit_id": "uuid-1111",
#   "role": "FUNCIONARIO"
# }
```

**4. User pede produtos**

```bash
curl -X GET "http://localhost:3000/api/produtos" \
  -H "Authorization: Bearer jwt_com_unit_id=uuid-1111"

# Backend:
# 1. Valida JWT → user.unit_id = uuid-1111 ✅
# 2. Desencripta credenciais_json da Unit 1 → credenciais_sp ✅
# 3. Chama Uniplus com credenciais_sp
# 4. Retorna apenas produtos da Unit 1 (filtrados por requisição Uniplus)

# Response:
# { "produtos": [...] }  // Sem credenciais!
```

**5. User da Unit 1 tenta acessar dados da Unit 2?**

```bash
curl -X GET "http://localhost:3000/api/produtos?unitId=uuid-2222" \
  -H "Authorization: Bearer jwt_com_unit_id=uuid-1111"

# Backend:
# 1. Valida JWT → user.unit_id = uuid-1111 ✅
# 2. Requisição pede dados de uuid-2222 ❌
# 3. validaTenant() middleware: uuid-1111 ≠ uuid-2222
# 4. RETORNA 403 Forbidden

# Response:
# { "error": "Acesso negado para esta unidade" }
```

---

## 9. Checklist de Implementação

- [x] Função `encryptCredentialsJSON()` em encryption.js
- [x] Função `decryptCredentialsJSON()` em encryption.js
- [x] Campo `credenciais_json` no schema Prisma
- [x] Migration 0005 criada e aplicada
- [x] Função `createUnidadeWithFullCredentials()` no service
- [x] Função `getUnidadeFullCredentials()` no service
- [x] Função `updateUnidadeFullCredentials()` no service
- [x] Endpoint `POST /api/unidades/full-credentials` na rota
- [x] Endpoint `PUT /api/unidades/:unitId/full-credentials` na rota
- [x] Validações de campos obrigatórios
- [x] Nunca retorna credenciais ao cliente (auditoria de código)
- [x] Testes de encriptação/decriptação
- [x] Testes de isolamento multi-tenant
- [x] Documentação completa (este arquivo)

---

## 10. FAQs

### **P: E se eu esquecer a ENCRYPTION_KEY?**

R: Credenciais existentes no banco NUNCA poderão ser decriptadas. Você precisará:

1. Limpar credenciais antigas (SQL DELETE)
2. Guardar ENCRYPTION_KEY nova em lugar seguro
3. Re-criar credenciais das unidades

### **P: Como faço backup seguro das credenciais?**

R: O banco PostgreSQL JÁ tem backup. Credenciais em cifra no banco = seguro.
Guarde apenas a ENCRYPTION_KEY em gestor de senhas externo.

### **P: Posso mudar ENCRYPTION_KEY?**

R: ❌ Não sem perder acesso aos dados. Se for mudar:

1. Decriptar TUDO com chave antiga
2. Re-encriptar TUDO com chave nova
3. Atualizar .env
   É operacional complexo, não recomendo.

### **P: As credenciais viajam criptografadas?**

R: Sim! Use HTTPS (TLS/SSL) para encriptar a comunicação inteira.
`curl https://...` (não http://)

### **P: Posso armazenar a ENCRYPTION_KEY no banco?**

R: ❌ NÃO! Seria circula infectada. Sempre em .env ou gestor de senhas.

---

**Conclusão**: Suas credenciais Uniplus estão agora 🔐 **MILITARES** 🔐 de seguras!
