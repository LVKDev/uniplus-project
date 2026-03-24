# ✅ CHECKLIST FINAL - Deploy Easypanel

## 🔧 PRÉ-REQUISITOS

- [ ] SSH acesso ao Easypanel (166.0.186.92)
- [ ] Senha do MySQL DirectAdmin
- [ ] Conta de gerenciamento do Easypanel
- [ ] n8n rodando e acessível

---

## 📋 PASSO-A-PASSO (15-30 minutos)

### **ETAPA 1: Preparar Arquivo .env (5 min)**

```bash
# No seu computador, criar arquivo .env com:
cat > .env << 'EOF'
PORT=3000
PUBLIC_BASE_URL=http://localhost:3000
BASIC_AUTH_USER=admin
BASIC_AUTH_PASS=cerion363738

UNIPLUS_BASE_URL=https://unisoftsistemas.com.br/public-api
UNIPLUS_SERVER_URL=https://unisoftsistemas.com.br
UNIPLUS_CLIENT_ID=galegoaguaegas
UNIPLUS_CLIENT_SECRET=b7de0482-c8f9-40d1-aa3a-f47f6e810c22
UNIPLUS_ALL_LIMIT=1000
UNIPLUS_TOKEN=Z2FsZWdvYWd1YWVnYXM6YjdkZTA0ODItYzhmOS00MGQxLWFhM2EtZjQ3ZjZlODEwYzIy
UNIPLUS_AUTH_BASIC=Z2FsZWdvYWd1YWVnYXM6YjdkZTA0ODItYzhmOS00MGQxLWFhM2EtZjQ3ZjZlODEwYzIy

DATABASE_URL=mysql://galegogas_uniplus:HaD3hzkwu6tZTMSFVEEa@galegogas.wichat.com.br:3306/galegogas_uniplus

PORTAL_BASE_URL=https://canal.intelidata.inf.br/public-api
PORTAL_API_TOKEN=
EOF

# Verificar
cat .env
```

- [ ] Arquivo `.env` criado localmente
- [ ] Variáveis verificadas

---

### **ETAPA 2: Copiar para Easypanel (5 min)**

```bash
# Via SCP
scp .env seu_usuario@166.0.186.92:/path/to/uniplus-project/.env

# OU via painel web do Easypanel
# - Upload manual do arquivo .env

# OU via SSH
ssh seu_usuario@166.0.186.92
cd /path/to/uniplus-project
nano .env  # Colar conteúdo
```

- [ ] Arquivo `.env` no Easypanel
- [ ] Permissões corretas (chmod 600 .env recomendado)

---

### **ETAPA 3: Testar Conectividade do Banco (5 min)**

```bash
# Via SSH no Easypanel
ssh seu_usuario@166.0.186.92

# Teste de conexão MySQL
mysql -h galegogas.wichat.com.br \
  -u galegogas_uniplus \
  -pHaD3hzkwu6tZTMSFVEEa \
  -e "SELECT 1; USE galegogas_uniplus; SHOW TABLES;"
```

**Esperado:**

```
+-----------+
| 1         |
+-----------+
| 1         |
+-----------+

+--------------------------+
| Tables_in_galegogas_uniplus |
+--------------------------+
| api_logs            |
| entidades_log       |
| health_log          |
| ordens_servico_log  |
| pedidos_log         |
| produtos_log        |
+--------------------------+
```

- [ ] Conexão ao MySQL funciona
- [ ] Tabelas de log existem

---

### **ETAPA 4: Setup Node.js (5 min)**

```bash
# No Easypanel (SSH)
cd /app  # ou /path/to/uniplus-project

# Instalar dependências
npm install
# ou
npm ci  # (mais seguro em produção)

# Verificar instalação
npm ls
```

- [ ] npm install completado
- [ ] Sem erros críticos

---

### **ETAPA 5: Setup Prisma (3 min)**

```bash
# Gerar cliente
npx prisma generate

# Criar/migrar banco (se necessário)
npx prisma migrate deploy

# Ver schema
npx prisma studio  # (opcional, para debug)
```

- [ ] Prisma gerado com sucesso
- [ ] Migrações aplicadas

---

### **ETAPA 6: Iniciar API (2 min)**

```bash
# Opção A: Desenvolvimento (com logs detalhados)
npm run dev

# Opção B: Produção (PM2 ou supervisord)
npm start

# Opção C: Via PM2 (recomendado para produção)
npm install -g pm2
pm2 start npm --name "uniplus-api" -- start
pm2 save
pm2 startup
```

**Esperado:**

```
Starting server...
Servidor rodando na porta 3000
[UniPlus] ✅ Usando UNIPLUS_TOKEN do .env
```

- [ ] API rodando na porta 3000
- [ ] Sem erros de conexão

---

### **ETAPA 7: Testar da API (5 min)**

```bash
# Via curl (mesmo servidor Easypanel)
curl -X GET "http://localhost:3000/api/produtos?limit=1" \
  -H "Authorization: Basic YWRtaW46Y2VyaW9uMzYzNzM4" \
  -H "Content-Type: application/json" \
  -s | jq .

# Via curl (de fora)
curl -X GET "https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host/api/produtos?limit=1" \
  -H "Authorization: Basic YWRtaW46Y2VyaW9uMzYzNzM4" \
  -H "Content-Type: application/json" \
  -s | jq .
```

**Esperado:**

```json
{
  "success": true,
  "data": [...]
}
```

- [ ] Endpoint `/api/produtos` retorna dados
- [ ] Auditoria registrada no banco

---

### **ETAPA 8: Configurar n8n (2 min)**

**No n8n:**

1. Nova requisição HTTP
2. **URL**: `http://localhost:3000/api/produtos`
3. **Método**: GET
4. **Auth**: Basic Auth
   - **Username**: `admin`
   - **Password**: `cerion363738`
5. **Headers**:
   - `Content-Type: application/json`
   - `Accept: application/json`
6. **Teste**: Executar requisição

**Esperado:** Retorna dados de produtos

- [ ] n8n consegue chamar API
- [ ] Recebe dados do UniPlus
- [ ] Auditoria registra no MySQL

---

## 🧪 TESTES DE VALIDAÇÃO

### **Teste 1: Verificar Autorização**

```bash
# Sem Auth - deve retornar 401
curl -X GET "http://localhost:3000/api/produtos"
# Esperado: 401 Unauthorized

# Com Auth errado - deve retornar 401
curl -X GET "http://localhost:3000/api/produtos" \
  -H "Authorization: Basic errado"
# Esperado: 401 Unauthorized

# Com Auth correta - deve retornar 200
curl -X GET "http://localhost:3000/api/produtos" \
  -H "Authorization: Basic YWRtaW46Y2VyaW9uMzYzNzM4"
# Esperado: 200 OK
```

- [ ] 401 sem credenciais
- [ ] 401 com credenciais erradas
- [ ] 200 com credenciais corretas

---

### **Teste 2: Verificar Auditoria**

```bash
# Conectar ao MySQL
mysql -h galegogas.wichat.com.br \
  -u galegogas_uniplus \
  -pHaD3hzkwu6tZTMSFVEEa \
  galegogas_uniplus

# Ver logs da API
SELECT * FROM api_logs ORDER BY dataOperacao DESC LIMIT 5;
SELECT * FROM produtos_log ORDER BY dataOperacao DESC LIMIT 5;
```

**Esperado:** Logs registrando cada requisição

- [ ] Logs aparecem em `api_logs`
- [ ] Logs aparecem em `produtos_log`
- [ ] Timestamp está correto

---

### **Teste 3: Verificar Conexão UniPlus**

```bash
# Ver logs da aplicação
pm2 logs uniplus-api | grep -i "uniplus"

# OU se usando npm run dev
# Procurar por linhas como:
# [UniPlus] ✅ Token gerado com sucesso
# [UniPlus] ❌ ERRO ao gerar token OAuth (esperado se WAF)
# [UniPlus] GET /v1/produtos → 200
```

**Esperado:** Comunicação com UniPlus funciona (mesmo que com fallback)

- [ ] Tokens sendo gerados ou usando fallback
- [ ] Requisições ao UniPlus retornam dados

---

## 📊 RESUMO FINAL

| Item             | Status        | Evidência                               |
| ---------------- | ------------- | --------------------------------------- |
| Banco MySQL      | ✅            | Pode conectar, tabelas existem          |
| API Express      | ✅            | Porta 3000, `/api/produtos` retorna 200 |
| n8n              | ✅            | Consegue chamar API com Basic Auth      |
| Auditoria        | ✅            | Logs em `api_logs` e `produtos_log`     |
| UniPlus          | ✅            | Dados retornam (mesmo com fallback)     |
| **STATUS FINAL** | **✅ PRONTO** | **Produção**                            |

---

## 🆘 PROBLEMAS COMUNS

### Problema: "Can't reach database"

```bash
# Verificar:
1. Credenciais corretas
2. IP do Easypanel tem acesso ao DirectAdmin
3. Firewall não está bloqueando porta 3306
```

### Problema: "403 Forbidden do UniPlus"

```bash
# Esperado! WAF do UniPlus bloqueia /oauth/token
# Solução: Já implementada (fallback para Basic Auth)
# Ver logs: [UniPlus] ERRO ao gerar token OAuth: Status: 403
```

### Problema: "Cannot find module"

```bash
# Solução:
npm install
npm run build  # se houver
npx prisma generate
```

---

## 📞 CONTATOS EM CASO DE DÚVIDA

1. **Banco de Dados**: DirectAdmin - galegogas.wichat.com.br
2. **UniPlus API**: unisoftsistemas.com.br - suporte@unisoft.com.br
3. **Easypanel**: 166.0.186.92 - painel administrativo

---

**Última atualização**: 24/03/2026
**Versão**: 1.0
**Status**: ✅ PRONTO PARA DEPLOY
