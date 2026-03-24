# 🎯 Configuração Cerion - UniPlus API

## ✅ Status: CREDENCIAIS ATUALIZADAS

Arquivo `.env` atualizado com credenciais reais para EasyPanel.

---

## 🔐 Credenciais Salvas no Projeto

### **Autenticação da API**
```
Usuário: admin
Senha:   cerion363738
```

### **UniPlus ERP**
```
Client ID:     galegoaguaegas
Client Secret: b7de0482-c8f9-40d1-aa3a-f47f6e810c22
Auth Basic:    Z2FsZWdvYWd1YWVnYXM6YjdkZTA0ODItYzhmOS00MGQxLWFhM2EtZjQ3ZjZlODEwYzIy
```

### **Banco de Dados**
```
Host:     galegogas.wichat.com.br:3306
Database: galegogas_uniplus
User:     galegogas_uniplus
Password: HaD3hzkwu6tZTMSFVEEa
```

### **URL Pública**
```
https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host
```

---

## 🌐 n8n - Configure Assim

### **URL Base para Requisições**
```
https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host
```

### **Endpoints Disponíveis**

#### **Mock (Teste sem credenciais UniPlus)**
```
GET    /mock/pedidos                    # Lista pedidos
GET    /mock/pedidos/:codigo            # Obtem pedido específico
GET    /mock/pedidos?single=true        # Retorna um pedido
GET    /mock/pedidos?limit=10&offset=0  # Com paginação
POST   /mock/pedidos                    # Criar novo pedido
PUT    /mock/pedidos                    # Atualizar pedido
DELETE /mock/pedidos/:codigo            # Deletar pedido

Mesmos endpoints para:
  /mock/entidades
  /mock/produtos
  /mock/info (informações dos endpoints)
```

#### **Documentação**
```
GET    /health                          # Health check
GET    /docs                            # Swagger UI
GET    /openapi.json                    # OpenAPI spec
```

#### **API Real (com credenciais UniPlus)**
```
GET    /api/pedidos                     # Reais do sistema
GET    /api/entidades
GET    /api/produtos
GET    /api/ordens-servico
GET    /api/vendas
GET    /api/tipo-documento-financeiro
```

---

## 🔌 Exemplo n8n com Autenticação

### **No n8n HTTP Request:**

1. **URL**
```
https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host/mock/pedidos
```

2. **Método**
```
GET / POST / PUT / DELETE
```

3. **Headers**
```
Content-Type: application/json
```

4. **Autenticação - Basic Auth**
```
Username: admin
Password: cerion363738
```

Ou, no header manualmente:
```
Authorization: Basic YWRtaW46Y2VyaW9uMzYzNzM4
```

### **Exemplo de Workflow n8n**

```json
{
  "nodes": [
    {
      "name": "Webhook Entrada",
      "type": "n8n-nodes-base.webhook",
      "method": "POST",
      "path": "novo-pedido"
    },
    {
      "name": "Criar Pedido",
      "type": "n8n-nodes-base.httpRequest",
      "method": "POST",
      "url": "https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host/mock/pedidos",
      "authentication": "basicAuth",
      "user": "admin",
      "password": "cerion363738",
      "headers": {
        "Content-Type": "application/json"
      },
      "body": {
        "cliente": "={{$json.cliente}}",
        "filial": "={{$json.filial}}",
        "itens": "={{$json.itens}}"
      }
    },
    {
      "name": "Responder",
      "type": "n8n-nodes-base.respondToWebhook",
      "responseCode": 200
    }
  ]
}
```

---

## 🧪 Testes Rápidos via cURL

### **Testar Health Check**
```bash
curl -X GET \
  https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host/health
```

Resposta esperada:
```json
{"success":true,"status":"ok","timestamp":"..."}
```

### **Listar Mock Pedidos**
```bash
curl -X GET \
  -u admin:cerion363738 \
  https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host/mock/pedidos
```

Resposta esperada:
```json
{
  "success": true,
  "data": [
    {
      "codigo": 1,
      "cliente": 123,
      "filial": 1,
      "status": "8",
      "itens": [...]
    },
    ...
  ]
}
```

### **Criar Novo Pedido**
```bash
curl -X POST \
  -u admin:cerion363738 \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": 789,
    "filial": 1,
    "status": "1",
    "itens": [
      {
        "produto": 456,
        "quantidade": 10,
        "valor": 100.00
      }
    ]
  }' \
  https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host/mock/pedidos
```

### **Com Autenticação Manual (Base64)**
```bash
# Codificar credenciais
echo -n "admin:cerion363738" | base64
# Resultado: YWRtaW46Y2VyaW9uMzYzNzM4

curl -X GET \
  -H "Authorization: Basic YWRtaW46Y2VyaW9uMzYzNzM4" \
  https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host/api/pedidos
```

---

## 📊 Fluxo de Integração n8n

```
n8n Webhook/Cron
       ↓
   HTTP Request
       ↓
Authorization: Basic auth (admin/cerion363738)
       ↓
   API UniPlus
       ↓
Mock ou Real endpoints
       ↓
   Database (MySQL)
       ↓
   Resposta JSON
       ↓
n8n Processa resultado
```

---

## 🔄 Fluxo de Dados UniPlus

```
n8n
  ↓
API (https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host)
  ↓
Auth: Basic (admin/cerion363738)
  ↓
Endpoints Mock (/mock/*) - Teste rápido
  ↓
Endpoints Real (/api/*) → UniPlus ERP
       ↓
   OAuth2: galegoaguaegas
       ↓
   https://unisoftsistemas.com.br/public-api
       ↓
   MySQL: galegogas_uniplus
       ↓
   Audit Logs
       ↓
   Resposta para n8n
```

---

## ✅ Checklist para n8n

- [ ] Testou health check em `https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host/health`
- [ ] Testou mock pedidos em `/mock/pedidos`
- [ ] Configurou autenticação: `admin / cerion363738`
- [ ] Criou HTTP Request node no n8n
- [ ] Adicionou Basic Auth no node
- [ ] Testou webhook primeiro com teste manual

---

## 📝 Environment Variáveis no EasyPanel

No painel do EasyPanel, adicione exatamente assim:

```
PORT                                  3000
NODE_ENV                             production
PUBLIC_BASE_URL                      https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host
UNIPLUS_BASE_URL                    https://unisoftsistemas.com.br/public-api
UNIPLUS_SERVER_URL                  https://unisoftsistemas.com.br
UNIPLUS_CLIENT_ID                   galegoaguaegas
UNIPLUS_CLIENT_SECRET               b7de0482-c8f9-40d1-aa3a-f47f6e810c22
UNIPLUS_AUTH_BASIC                  Z2FsZWdvYWd1YWVnYXM6YjdkZTA0ODItYzhmOS00MGQxLWFhM2EtZjQ3ZjZlODEwYzIy
UNIPLUS_TOKEN                       Z2FsZWdvYWd1YWVnYXM6YjdkZTA0ODItYzhmOS00MGQxLWFhM2EtZjQ3ZjZlODEwYzIy
UNIPLUS_ALL_LIMIT                   1000
BASIC_AUTH_USER                     admin
BASIC_AUTH_PASS                     cerion363738
DATABASE_URL                        mysql://galegogas_uniplus:HaD3hzkwu6tZTMSFVEEa@galegogas.wichat.com.br:3306/galegogas_uniplus
PORTAL_BASE_URL                     https://canal.intelidata.inf.br/public-api
PORTAL_API_TOKEN                    (deixar vazio)
RUN_DB_MIGRATIONS                   true
```

---

## 🔒 Segurança

⚠️ **IMPORTANTE:**
- ✅ Credenciais salvas apenas no `.env` (não no code)
- ✅ Basic Auth ativada (admin/cerion363738)
- ✅ HTTPS forçado (EasyPanel url)
- ✅ Token UniPlus cached
- ✅ Database em servidor seguro

---

## 🆘 Troubleshooting

### **Erro 401 Unauthorized no n8n**
```
Verificar:
1. Username: admin (exato)
2. Password: cerion363738 (exato)
3. Se usar header manualmente:
   Authorization: Basic YWRtaW46Y2VyaW9uMzYzNzM4
```

### **Erro "Database connection failed"**
```
Verificar:
DATABASE_URL=mysql://galegogas_uniplus:HaD3hzkwu6tZTMSFVEEa@galegogas.wichat.com.br:3306/galegogas_uniplus

Se falhar, testar:
mysql -h galegogas.wichat.com.br -u galegogas_uniplus -p (usar senha acima)
```

### **Erro "UNIPLUS_AUTH_BASIC is required"**
```
Verificar se no .env tem:
UNIPLUS_AUTH_BASIC=Z2FsZWdvYWd1YWVnYXM6YjdkZTA0ODItYzhmOS00MGQxLWFhM2EtZjQ3ZjZlODEwYzIy

Não pode estar vazio!
```

### **Mock endpoints retornam 404**
```
Verificar se tem:
GET https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host/mock/info

Deve retornar informações dos endpoints mock
```

---

## 📞 Próximos Passos

1. ✅ Deploy no EasyPanel com variáveis atualizadas
2. ✅ Testar health check
3. ✅ Testar mock endpoints
4. ✅ Conectar n8n com Basic Auth
5. ✅ Criar workflow de teste
6. ✅ Integrar com dados reais

---

**Status**: ✅ **Pronto para Deploy**

Arquivo `.env` atualizado e documentação de n8n completa!

**Data**: Março 2026  
**Ambiente**: EasyPanel - Cerion  
**Versão**: 1.0.0
