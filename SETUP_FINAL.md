# 🚀 Setup Final - UniPlus API + n8n

## 📊 Arquitetura Confirmada

```
┌─────────────────────────────────────────────────────────────┐
│                      EASYPANEL (166.0.186.92)               │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────┐         ┌──────────────────────┐  │
│  │   n8n (porta 3000)   │────────▶│  API Express         │  │
│  │   http:localhost     │         │  (porta 3000)        │  │
│  └──────────────────────┘         └──────────────────────┘  │
│                                            │                │
│                                            │ MySQL Prisma   │
│                                            ▼                │
└────────────────────────────────────────────────────────────┬─

                                              │
                    ┌─────────────────────────┴──────────────┐
                    │                                        │
                    ▼                                        ▼
        ┌─────────────────────┐              ┌──────────────────────┐
        │  DIRECTADMIN        │              │    UniPlus API       │
        │  (galegogas.wichat) │              │  (unisoftsistemas)   │
        │  MySQL 3306         │              │  com WAF             │
        └─────────────────────┘              └──────────────────────┘
```

---

## ✅ Checklist de Setup

### **1️⃣ Banco de Dados (DirectAdmin)**

```bash
# Verificar conexão
mysql -h galegogas.wichat.com.br -u galegogas_uniplus -p

# Senha: HaD3hzkwu6tZTMSFVEEa
# Database: galegogas_uniplus
```

### **2️⃣ Arquivos de Configuração**

```bash
# Copiar .env.test para .env no Easypanel
cp /app/.env.test /app/.env

# Verificar variáveis críticas:
cat .env | grep -E "DATABASE_URL|BASIC_AUTH|UNIPLUS"
```

### **3️⃣ Instalação de Dependências**

```bash
cd /app
npm install
# Ou se usar pnpm
pnpm install
```

### **4️⃣ Prisma Setup**

```bash
# Gerar cliente
npx prisma generate

# Rodas migrações (se não estiverem aplicadas)
npx prisma migrate deploy

# Ver seed (opcional)
npx prisma db seed
```

### **5️⃣ Iniciar API**

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

---

## 🧪 Teste Rápido da API

### **Via curl (localhost):**

```bash
curl -X GET "http://localhost:3000/api/produtos?limit=1" \
  -H "Authorization: Basic YWRtaW46Y2VyaW9uMzYzNzM4" \
  -H "Content-Type: application/json"
```

**Esperado:**

```json
{
  "success": true,
  "data": [...]
}
```

### **Via n8n (no Easypanel):**

1. **URL**: `http://localhost:3000/api/produtos`
2. **Method**: GET
3. **Auth Type**: Basic Auth
   - Username: `admin`
   - Password: `cerion363738`
4. **Headers**:
   - `Content-Type: application/json`
   - `Accept: application/json`

---

## 🔐 Autenticação

### **Usuário Padrão**

```
Username: admin
Password: cerion363738
```

**Base64 Encoded:**

```
YWRtaW46Y2VyaW9uMzYzNzM4
```

**Header:**

```
Authorization: Basic YWRtaW46Y2VyaW9uMzYzNzM4
```

---

## 📡 Integração UniPlus

### **Fluxo de Autenticação**

1. **Tenta gerar TOKEN via OAuth** → `/oauth/token`
   - Se tiver `UNIPLUS_TOKEN` definido, usa direto
   - Se OAuth falhar (403 WAF), usa **Basic Auth** como fallback

2. **Credenciais UniPlus**
   - `UNIPLUS_CLIENT_ID`: `galegoaguaegas`
   - `UNIPLUS_CLIENT_SECRET`: `b7de0482-c8f9-40d1-aa3a-f47f6e810c22`
   - `UNIPLUS_AUTH_BASIC`: `Z2FsZWdvYWd1YWVnYXM6YjdkZTA0ODItYzhmOS00MGQxLWFhM2EtZjQ3ZjZlODEwYzIy`

### **URLs UniPlus**

- **Base**: `https://unisoftsistemas.com.br/public-api`
- **OAuth**: `https://unisoftsistemas.com.br/oauth/token`
- **Endpoints**: `/v1/produtos`, `/v1/entidades`, etc

---

## 📊 Auditoria

### **Tabelas Criadas Automaticamente**

- `api_logs` - Todos os acessos
- `produtos_log` - Operações de produtos
- `entidades_log` - Operações de entidades
- `pedidos_log` - Operações de pedidos
- `ordens_servico_log` - Operações de O.S.
- `health_log` - Health checks

### **Registro Automático**

Cada requisição registra:

- **operacao**: LISTAR, CONSULTAR, CRIAR, ATUALIZAR, DELETAR
- **status**: SUCESSO ou FALHA
- **payload**: Dados da requisição
- **dataOperacao**: Timestamp

---

## 🐛 Troubleshooting

### **Erro: "Can't reach database server at localhost:3306"**

```bash
# Solução: Adicionar host correto no .env
DATABASE_URL=mysql://usuario:senha@galegogas.wichat.com.br:3306/database
```

### **Erro: "Libssl not found" (Prisma)**

```bash
# Via Docker (Easypanel deve ter OpenSSL instalado)
apt-get update && apt-get install -y openssl
```

### **Erro: "403 Forbidden" no UniPlus**

```
[UniPlus] ❌ ERRO ao gerar token OAuth:
[UniPlus] Status: 403

Solução: Use Basic Auth (fallback) - já implementado!
```

### **Erro: "401 - Credenciais inválidas"**

```bash
# Verificar Base64 das credenciais
echo -n "admin:cerion363738" | base64
# Resultado: YWRtaW46Y2VyaW9uMzYzNzM4

# Copiar para Authorization header
Authorization: Basic YWRtaW46Y2VyaW9uMzYzNzM4
```

---

## 📝 Variáveis Críticas do .env

```env
# Servidor
PORT=3000
PUBLIC_BASE_URL=http://localhost:3000

# Autenticação
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=cerion363738

# UniPlus
UNIPLUS_BASE_URL=https://unisoftsistemas.com.br/public-api
UNIPLUS_SERVER_URL=https://unisoftsistemas.com.br
UNIPLUS_CLIENT_ID=galegoaguaegas
UNIPLUS_CLIENT_SECRET=b7de0482-c8f9-40d1-aa3a-f47f6e810c22
UNIPLUS_AUTH_BASIC=Z2FzZWdvYWd1YWVnYXM6YjdkZTA0ODItYzhmOS00MGQxLWFhM2EtZjQ3ZjZlODEwYzIy

# MySQL DirectAdmin
DATABASE_URL=mysql://galegogas_uniplus:HaD3hzkwu6tZTMSFVEEa@galegogas.wichat.com.br:3306/galegogas_uniplus

# Portal Comercial
PORTAL_BASE_URL=https://canal.intelidata.inf.br/public-api
PORTAL_API_TOKEN=(deixar vazio se não usar)
```

---

## ✨ Endpoints Disponíveis

| Método | Rota                       | Descrição          |
| ------ | -------------------------- | ------------------ |
| GET    | `/api/produtos`            | Lista produtos     |
| GET    | `/api/produtos?codigo=123` | Produto específico |
| GET    | `/api/entidades`           | Lista entidades    |
| GET    | `/api/pedidos`             | Lista pedidos      |
| GET    | `/api/ordens-servico`      | Lista O.S.         |
| GET    | `/api/vendas`              | Lista vendas       |
| GET    | `/api/arquivos`            | Lista arquivos     |
| GET    | `/health`                  | Health check       |
| GET    | `/docs`                    | Swagger OpenAPI    |

---

## 🎉 Projeto Está Pronto Para:

✅ Usar UniPlus como fonte de dados
✅ Registrar auditoria em MySQL
✅ Fornecer dados para n8n
✅ Fazer fallback de autenticação
✅ Rodar 100% no Easypanel com banco remoto

---

**Status**: ✅ **PRONTO PARA PRODUÇÃO**
