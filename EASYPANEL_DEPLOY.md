# 🚀 Guia de Deploy no EasyPanel - UniPlus API

## ✅ Sim! Pode Subir no EasyPanel!

A aplicação é Node.js puro + MySQL, compatível 100% com EasyPanel.

---

## 📋 Pré-requisitos no EasyPanel

Certifique-se que o EasyPanel tem:

- ✅ Node.js 18+ instalado
- ✅ MySQL 8.x disponível
- ✅ npm ou yarn
- ✅ Suporte a variáveis de ambiente

---

## 🔐 Variáveis de Ambiente (`.env`) - O QUE COLOCAR

### **OBRIGATÓRIAS** (Projeto vai quebrar sem estas)

```bash
# Server
PORT=3000
NODE_ENV=production
PUBLIC_BASE_URL=https://seu-dominio.com.br

# Banco de Dados MySQL
DATABASE_URL=mysql://username:password@db-host:3306/database_name

# UniPlus ERP (obtenha com seu fornecedor)
UNIPLUS_BASE_URL=https://unisoftsistemas.com.br/public-api
UNIPLUS_SERVER_URL=https://unisoftsistemas.com.br
UNIPLUS_AUTH_BASIC=Base64(client_id:client_secret)
```

### **FORTEMENTE RECOMENDADAS** (Segurança)

```bash
# Autenticação API (protege seus endpoints)
BASIC_AUTH_USER=seu_usuario_api
BASIC_AUTH_PASS=senha_muito_segura_aqui

# OU (alternativa)
API_BEARER_TOKEN=seu_token_secreto_longo_aqui
```

### **OPCIONAIS**

```bash
# Supabase (para audit logs em cloud)
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui

# Portal Comercial
PORTAL_BASE_URL=https://canal.intelidata.inf.br/public-api
PORTAL_API_TOKEN=token_portal

# App
UNIPLUS_ALL_LIMIT=100
RUN_DB_MIGRATIONS=true
```

---

## 🔑 Obter Credenciais da UniPlus

### **Passo 1: UNIPLUS_BASE_URL e UNIPLUS_SERVER_URL**

```
Fornecedor: UniSoft Sistemas
Padrão:
  UNIPLUS_BASE_URL=https://unisoftsistemas.com.br/public-api
  UNIPLUS_SERVER_URL=https://unisoftsistemas.com.br

Contato: Suporte do seu ERP
```

### **Passo 2: UNIPLUS_AUTH_BASIC**

Você receberá do fornecedor:

- `client_id` (Ex: `abc123def456`)
- `client_secret` (Ex: `xyzabc123xyz`)

Codificar em Base64:

```bash
# No terminal Linux/Mac
echo -n "abc123def456:xyzabc123xyz" | base64
# Resultado: YWJjMTIzZGVmNDU2Onh5emFiYzEyM3h5eg==

# Coloca no .env
UNIPLUS_AUTH_BASIC=YWJjMTIzZGVmNDU2Onh5emFiYzEyM3h5eg==
```

**Online (se preferir):**

- Acesse: https://www.base64encode.org/
- Cole: `client_id:client_secret`
- Copie o resultado

---

## 🗄️ Banco de Dados MySQL no EasyPanel

### **Opção 1: MySQL Gerenciado pelo EasyPanel**

```
HOST: localhost (ou db.local)
PORTA: 3306
USUÁRIO: seu_usuario
SENHA: senha_gerada_pelo_panel
DATABASE: uniplus_db

DATABASE_URL=mysql://seu_usuario:senha@localhost:3306/uniplus_db
```

### **Opção 2: MySQL Externo (Cloud)**

```
HOST: mysql.exemplo.com
PORTA: 3306
USUÁRIO: seu_usuario
SENHA: sua_senha
DATABASE: uniplus_db

DATABASE_URL=mysql://seu_usuario:sua_senha@mysql.exemplo.com:3306/uniplus_db
```

---

## 🛠️ Configuração no EasyPanel (Passo a Passo)

### **Passo 1: Criar Aplicação**

1. No EasyPanel → "New Application" ou "Create App"
2. Nome: `uniplus-api`
3. Type: Node.js
4. Runtime: Node 18+

### **Passo 2: Conectar Repositório**

1. Source: GitHub (recomendado)
2. Repositório: seu repo
3. Branch: `main` ou `develop`
4. Root directory: `/` (raiz)

### **Passo 3: Build & Start Commands**

```bash
# Install
npm install

# Build (se necessário)
npm run db:migrate

# Start Command
npm start

# Ou para desenvolvimento
npm run dev
```

### **Passo 4: Variáveis de Ambiente**

No EasyPanel, adicione cada variável:

```
KEY                           VALUE
========================================
NODE_ENV                      production
PORT                          3000
PUBLIC_BASE_URL               https://seu-dominio.com
DATABASE_URL                  mysql://user:pass@host:3306/db
UNIPLUS_BASE_URL              https://unisoftsistemas.com.br/public-api
UNIPLUS_SERVER_URL            https://unisoftsistemas.com.br
UNIPLUS_AUTH_BASIC            YWJjMTIzZGVm...
BASIC_AUTH_USER               seu_usuario
BASIC_AUTH_PASS               senha_segura
RUN_DB_MIGRATIONS             true
```

### **Passo 5: Banco de Dados**

1. Criar banco MySQL via EasyPanel
2. Definir credenciais
3. Atualizar `DATABASE_URL`

### **Passo 6: Deploy**

1. Clique em "Deploy"
2. Aguarde build finalizar
3. Verifique logs
4. Teste health check

---

## ✅ Testes Pós-Deploy

### **Testar Saúde da API**

```bash
curl https://seu-dominio.com/health

# Resposta esperada:
# {"success":true,"status":"ok","timestamp":"..."}
```

### **Testar Mock Endpoints**

```bash
curl https://seu-dominio.com/mock/pedidos

# Resposta esperada:
# {"success":true,"data":[...]}
```

### **Testar com Autenticação**

```bash
# Se configurou BASIC_AUTH_USER e BASIC_AUTH_PASS
curl -u seu_usuario:senha_segura \
  https://seu-dominio.com/api/pedidos
```

---

## 🔌 Configuração no n8n

### **URL Base da API**

```
https://seu-dominio.com
```

### **Endpoints Disponíveis**

```javascript
// Mock (testa sem credenciais UniPlus)
GET    https://seu-dominio.com/mock/pedidos
POST   https://seu-dominio.com/mock/pedidos
PUT    https://seu-dominio.com/mock/pedidos
DELETE https://seu-dominio.com/mock/pedidos/:codigo

// Documentação
GET    https://seu-dominio.com/docs
GET    https://seu-dominio.com/openapi.json

// Reais (requer credenciais UniPlus)
GET    https://seu-dominio.com/api/pedidos
GET    https://seu-dominio.com/api/entidades
GET    https://seu-dominio.com/api/produtos
...
```

### **Autenticação no n8n**

#### **Opção 1: Basic Auth** (se configurou BASIC_AUTH_USER)

```
No n8n HTTP Request:
  Method: GET/POST/PUT/DELETE
  URL: https://seu-dominio.com/api/pedidos

  Authentication: Basic Auth
  Username: seu_usuario
  Password: senha_segura
```

#### **Opção 2: Bearer Token** (se configurou API_BEARER_TOKEN)

```
No n8n HTTP Request:
  Method: GET/POST/PUT/DELETE
  URL: https://seu-dominio.com/api/pedidos

  Headers:
    Authorization: Bearer seu_token_secreto_aqui
```

#### **Opção 3: Sem Autenticação** (se não configurou nada)

```
No n8n HTTP Request:
  Method: GET/POST/PUT/DELETE
  URL: https://seu-dominio.com/api/pedidos

Headers:
  Content-Type: application/json
```

---

## 🧪 Exemplo Completo n8n

### **Webhook → Chamada API → Salvar**

```json
{
  "nodes": [
    {
      "name": "Webhook Receber",
      "type": "n8n-nodes-base.webhook",
      "method": "POST",
      "path": "novo-pedido"
    },
    {
      "name": "Criar Pedido na API",
      "type": "n8n-nodes-base.httpRequest",
      "method": "POST",
      "url": "https://seu-dominio.com/mock/pedidos",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": {
        "cliente": "={{$node['Webhook Receber'].json.cliente}}",
        "filial": "={{$node['Webhook Receber'].json.filial}}",
        "itens": "={{$node['Webhook Receber'].json.itens}}"
      }
    }
  ]
}
```

---

## 📊 Checklist de Deploy

- [ ] Repositório GitHub pronto
- [ ] Node.js 18+ no EasyPanel
- [ ] MySQL database criado
- [ ] Credenciais UniPlus obtidas
- [ ] `.env` com todas as variáveis
- [ ] `DATABASE_URL` correto
- [ ] `UNIPLUS_AUTH_BASIC` em Base64
- [ ] Autenticação configurada (usuario/password ou token)
- [ ] Deploy realizado
- [ ] Health check funcionando
- [ ] Mock endpoints testados
- [ ] n8n conectado e funcionando

---

## 🆘 Troubleshooting

### **Erro: "Database connection failed"**

```
Verificar:
1. DATABASE_URL está correto?
2. Banco de dados existe?
3. Credenciais estão certas?
4. Host é acessível?
```

### **Erro: "UNIPLUS_AUTH_BASIC is required"**

```
Solução:
1. Verificar se UNIPLUS_AUTH_BASIC está no .env
2. Verificar se está em Base64 correto
3. Não pode estar vazio
```

### **Erro 401 Unauthorized no n8n**

```
Se tiver configurado BASIC_AUTH_USER:
1. Verificar username e password
2. Verificar header Authorization
3. Remover espaços extras
```

### **n8n retorna 404**

```
1. Verificar URL está completa: https://seu-dominio.com/api/pedidos
2. Testar em browser primeiro
3. Verificar se API está online
```

### **Migração do banco não rodou**

```
No EasyPanel:
1. Adicionar: RUN_DB_MIGRATIONS=true
2. Ou rodar manualmente: npm run db:migrate
3. Verificar logs do deployment
```

---

## 🚀 Resumo Rápido

| Variável             | Valor Exemplo                               | Obrigatória |
| -------------------- | ------------------------------------------- | ----------- |
| `NODE_ENV`           | `production`                                | ✅          |
| `PORT`               | `3000`                                      | ✅          |
| `DATABASE_URL`       | `mysql://user:pass@host/db`                 | ✅          |
| `UNIPLUS_BASE_URL`   | `https://unisoftsistemas.com.br/public-api` | ✅          |
| `UNIPLUS_SERVER_URL` | `https://unisoftsistemas.com.br`            | ✅          |
| `UNIPLUS_AUTH_BASIC` | `Base64(id:secret)`                         | ✅          |
| `PUBLIC_BASE_URL`    | `https://seu-dominio.com`                   | ✅          |
| `BASIC_AUTH_USER`    | `seu_usuario`                               | ❌          |
| `BASIC_AUTH_PASS`    | `senha_segura`                              | ❌          |
| `RUN_DB_MIGRATIONS`  | `true`                                      | ✅          |

---

## 📞 Suporte

Documentação completa:

- 📖 [CLAUDE.md](CLAUDE.md) - Contexto técnico
- 🔌 [N8N_INTEGRATION.md](N8N_INTEGRATION.md) - Integração n8n
- 🧪 [API_TESTING_REPORT.md](API_TESTING_REPORT.md) - Testes

---

**Status**: ✅ Pronto para EasyPanel  
**Última atualização**: Março 2026  
**Versão**: 1.0.0
