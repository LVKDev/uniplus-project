# Uniplus-project-API

API Node.js/Express que integra com a UniPlus (public-api) e expõe endpoints para entidades (clientes/fornecedores), produtos, pedidos, ordens de servico, vendas, estoque, arquivos fiscais, tipos de documentos financeiros e Gourmet. Inclui auditoria via Supabase e documentacao OpenAPI.

## Principais recursos

- Proxy seguro para a UniPlus com renovacao automatica de token.
- Endpoints REST para entidades, produtos, pedidos, ordens de servico e consultas adicionais.
- Auditoria de operacoes em tabela (Supabase) com trilha de sucesso/falha.
- Documentacao OpenAPI (Swagger UI).
- Suporte a paginação e coleta completa de registros.

## Arquitetura (alto nivel)

- `src/app.js`: Configuracao do Express e middlewares globais.
- `src/routes/*.routes.js`: Rotas HTTP.
- `src/services/*.service.js`: Regras de negocio, auditoria e integracao UniPlus.
- `src/config/uniplus.js`: Cliente Axios + autenticacao.
- `src/config/supabase.js`: Cliente Supabase para auditoria.

## Requisitos

- Node.js 18+ (testado com Node 22).
- Credenciais UniPlus para `public-api`.
- Supabase (opcional, mas recomendado para auditoria).

## Variaveis de ambiente

Crie um arquivo `.env` com valores.

```
UNIPLUS_BASE_URL=https://exemplo.com/public-api
UNIPLUS_SERVER_URL=https://exemplo.com
UNIPLUS_AUTH_BASIC=BASE64_CLIENTID_CLIENTSECRET
UNIPLUS_CLIENT_ID=seu_client_id
UNIPLUS_CLIENT_SECRET=seu_client_secret
UNIPLUS_TOKEN=

BASIC_AUTH_USER=usuario_api
BASIC_AUTH_PASS=senha_api

SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=chave_service_role

UNIPLUS_ALL_LIMIT=100

PORTAL_BASE_URL=url do seu portal
PORTAL_API_TOKEN=token_do_portal
```

### Observacoes

- `UNIPLUS_TOKEN` e opcional. Quando vazio, o token e obtido via OAuth.
- `BASIC_AUTH_*` ativa protecao Basic Auth em todas as rotas.
- `UNIPLUS_ALL_LIMIT` define o tamanho da pagina para buscar todos os registros. A UniPlus limita a 100 por pagina, entao use `100`.
- `PORTAL_API_TOKEN` e obrigatorio apenas para os endpoints do Portal Comercial.

## Instalar dependencias

```
npm install
```

## Rodar localmente

```
npm start
```

Se houver script de desenvolvimento no `package.json`:

```
npm run dev
```

## Documentacao da API

- Swagger UI: `http://localhost:PORT/docs`
- OpenAPI JSON: `http://localhost:PORT/openapi.json`

## Endpoints principais

Todas as rotas seguem o prefixo `/api`.

**Autenticação**: Endpoints protegidos requerem JWT via header `Authorization: Bearer TOKEN` (obtém token via POST /auth/login)

### Entidades

- `GET /api/entidades`
- `GET /api/entidades/:codigo`
- `POST /api/entidades`
- `PUT /api/entidades`
- `DELETE /api/entidades/:codigo`

### Produtos (SPRINT 4 - Dashboard Operacional)

- `GET /api/produtos` - Lista produtos da Uniplus com paginação (requer `ver_produtos`)
  - Query: `?codigo=X&nome=Y&limit=25&offset=0`
  - Response: `{success, data: [], pagination: {total, limit, offset, pages, currentPage}}`
- `GET /api/produtos/:codigo` - Obtém produto específico (requer `ver_produtos`)
- `PATCH /api/produtos/:codigo` - Edita produto (requer `editar_produtos`)
  - Body: `{preco?, nome?, descricao?, referencia?, ativo?}`
  - Exemplo: `PATCH /api/produtos/001 -H "Authorization: Bearer JWT" -d '{"preco": 150.00}'`

### Clientes (SPRINT 4 - Dashboard Operacional)

- `GET /api/clientes` - Lista clientes com paginação (requer `ver_clientes`)
  - Query: `?codigo=X&nome=Y&cnpjCpf=Z&limit=25&offset=0`
- `GET /api/clientes/:codigo` - Obtém cliente específico (requer `ver_clientes`)
- `PATCH /api/clientes/:codigo` - Edita cliente (requer `editar_clientes`)
  - Body: `{nome?, endereco?, telefone?, email?, cidade?, estado?, ativo?}`

### Configurações (SPRINT 4)

- `GET /api/cidades-estados` - Retorna lista de estados brasileiros com cidades (requer autenticação)
  - Response: `{success, data: [{estado: 'SP', cidades: [...]}, ...]}`

### Pedidos

- `GET /api/pedidos`
- `GET /api/pedidos/:codigo`
- `POST /api/pedidos`
- `PUT /api/pedidos`
- `DELETE /api/pedidos/:codigo`

### Ordens de servico

- `GET /api/ordens-servico`
- `GET /api/ordens-servico/:codigo`

### Vendas e estoque (API Vendas)

- `GET /api/vendas`
- `GET /api/vendas/itens`
- `GET /api/estoque/movimentacoes`

### Arquivos fiscais

- `GET /api/arquivos?tipo=DOCUMENTO_FISCAL`

### Tipos de documentos financeiros

- `GET /api/tipos-documentos-financeiros`
- `GET /api/tipos-documentos-financeiros/:codigo`

### Gourmet

- `GET /api/gourmet/contas`
- `POST /api/gourmet/contas`

### Portal Comercial

- `POST /api/portal/bloquear-contrato/:cpfcnpj`
- `POST /api/portal/desbloquear-contrato/:cpfcnpj`
- `GET /api/portal/contratos`
- `GET /api/portal/contratos/:status`
- `GET /api/portal/contrato/:cpfcnpj`
- `GET /api/portal/contrato/:cpfcnpj/:status`

## Paginacao e retorno completo

- Sem `limit/offset`, o servico tenta buscar todas as paginas usando `limit=UNIPLUS_ALL_LIMIT` (maximo 100).
- Para paginar manualmente, use `limit` e `offset`.
- `single=true` retorna apenas o primeiro item.

## Auditoria

Operacoes de listar, consultar, criar, atualizar e apagar sao registradas em tabelas no Supabase:

- `entidades_log`
- `produtos_log`
- `pedidos_log`
- `ordens_servico_log`

Cada registro contem operacao, status, payload e metadados da rota.

## Autenticacao

Se `BASIC_AUTH_USER` e `BASIC_AUTH_PASS` estiverem configurados, todas as rotas exigem Basic Auth.

Exemplo de header:

```
Authorization: Basic BASE64_USUARIO_SENHA
```

## Licenca

Luiz Vasconcelos 01/19/2026
Uso da api para fins comerciais.

---

## 📊 Status do Projeto (SPRINTs)

| SPRINT | Tema                     | Status      | Data       |
| ------ | ------------------------ | ----------- | ---------- |
| **1**  | 🔐 Base Auth             | ✅ COMPLETO | 03/01/2026 |
| **2**  | 👑 Super Admin           | ✅ COMPLETO | 03/05/2026 |
| **3**  | 👥 Gestão Funcionários   | ✅ COMPLETO | 03/15/2026 |
| **4**  | 📊 Dashboard Operacional | ✅ COMPLETO | 03/16/2026 |
| **5**  | 🛡️ Segurança & Deploy    | ✅ COMPLETO | 03/16/2026 |

---

## 🔐 SPRINT 5 - Segurança & Deploy (✅ Implementado)

### Recursos Implementados

#### 1. **GET /api/auditoria** - Visualizar Logs de Operações

```bash
# SUPER_ADMIN consegue ver auditoria de toda o sistema
curl -X GET "http://localhost:3000/api/auditoria?limit=25&offset=0" \
  -H "Authorization: Bearer JWT_SUPER_ADMIN"

# ADMIN_UNIDADE consegue ver auditoria da sua unit
curl -X GET "http://localhost:3000/api/auditoria?acao=UPDATE&recurso=produto" \
  -H "Authorization: Bearer JWT_ADMIN_UNIDADE"

# Filtros disponíveis:
# - userId: Filtrar por usuário que fez ação
# - acao: CREATE, UPDATE, DELETE
# - recurso: produto, cliente, usuario
# - dataInicio: Data inicial (ISO 8601)
# - dataFim: Data final (ISO 8601)
# - limit: Quantidade (padrão 50, máx 500)
# - offset: Paginação

# Response:
# {
#   "success": true,
#   "data": [
#     {
#       "id": "uuid",
#       "timestamp": "2026-03-16T10:30:00Z",
#       "usuario": "funcionario@empresa.com.br",
#       "unidade": "Empresa A",
#       "acao": "UPDATE",
#       "recurso": "produto",
#       "detalhes": {...}
#     }
#   ],
#   "pagination": {total, limit, offset, pages, currentPage}
# }
```

#### 2. **Rate Limiting** - Proteção contra Brute Force

```
- /auth/login: Máximo 5 tentativas por IP em 15 minutos
- /api/*: Máximo 100 requisições por IP em 1 minuto
- Operações de escrita: Máximo 20 PATCH/POST/DELETE por minuto
```

#### 3. **CORS Restrito** - Apenas Domínios Autorizados

```javascript
// Domínios permitidos:
const ALLOWED_ORIGINS = [
  "https://crm.uniplus.com.br",
  "https://portal.uniplus.com.br",
  "http://localhost:3000", // desenvolvimento
];

// Requisições de origins não autorizados recebem 403 CORS
```

#### 4. **Headers de Segurança** (Helmet)

```
- HSTS (HTTP Strict Transport Security)
- CSP (Content Security Policy)
- X-Frame-Options (previne Clickjacking)
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
```

#### 5. **Testes Automatizados** (Jest + Supertest)

```bash
# Rodar todos os testes
npm test

# Rodar apenas testes de segurança
npm run test:security

# Rodar apenas testes de rate limit/CORS
npm run test:ratelimit

# Ver cobertura de testes
npm run test:coverage

# Testes validam:
# ✅ Unit isolation - User A não acessa dados de Unit B
# ✅ Permissões - FUNCIONARIO sem editar_produtos → 403
# ✅ CORS violations - Origin não autorizado → bloqueado
# ✅ JWT validation - Token inválido → 401
# ✅ Rate limiting - Limites de requisição por IP/usuário
```

### Estrutura de Teste

```
__tests__/
├── setup.js                 # Configuração de ambiente para testes
├── security.test.js         # Testes de unit isolation e permissões
└── ratelimit-cors.test.js   # Testes de rate limit e CORS
```

### Exemplo de Teste - Unit Isolation

```javascript
test("❌ User A tenta acessar dados de Unit B → 403", async () => {
  const response = await request(app)
    .patch("/api/produtos/001")
    .set("Authorization", `Bearer ${tokenUserA}`)
    .send({ preco: 150 });

  // Middleware globalTenantValidation bloqueia cross-unit
  expect(response.status).toBe(403);
});
```

### Permissões Necessárias

- `ver_auditoria` - Consegue acessar /api/auditoria
- SUPER_ADMIN - Vê auditoria de todo sistema
- ADMIN_UNIDADE - Vê apenas sua unit
- FUNCIONARIO - NÃO consegue acessar

### Arquivos Adicionados

| Arquivo                                     | Linhas | Descrição                           |
| ------------------------------------------- | ------ | ----------------------------------- |
| `src/middleware/cors.middleware.js`         | 60     | Configuração CORS restrita          |
| `src/middleware/rateLimiting.middleware.js` | 80     | Rate limiters (login, API, write)   |
| `src/services/auditoria.service.js`         | 150    | Lógica de listagem de auditoria     |
| `src/routes/auditoria.routes.js`            | 130    | Endpoints de auditoria              |
| `__tests__/setup.js`                        | 25     | Setup de ambiente para testes       |
| `__tests__/security.test.js`                | 180    | Testes de security e unit isolation |
| `__tests__/ratelimit-cors.test.js`          | 90     | Testes de rate limit e CORS         |
| `jest.config.js`                            | 20     | Configuração do Jest                |

### Dependências Adicionadas

```json
{
  "helmet": "^7.0.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^7.0.0",
  "jest": "^29.0.0",
  "supertest": "^6.0.0",
  "@faker-js/faker": "^8.0.0"
}
```

### Como Testar Localmente

#### 1. Setup

```bash
npm install
npm run db:setup
npm run dev
```

#### 2. Teste Rate Limit (Login)

```bash
# Primeira tentativa - OK
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","senha":"wrong"}'

# Repetir 5 vezes - Na 6ª recebe 429 Too Many Requests
```

#### 3. Teste CORS

```bash
# Origin não autorizado → 403
curl -X OPTIONS "http://localhost:3000/api/produtos" \
  -H "Origin: https://non-authorized-site.com"

# Origin autorizado → OK
curl -X OPTIONS "http://localhost:3000/api/produtos" \
  -H "Origin: https://crm.uniplus.com.br"
```

#### 4. Teste Auditoria

```bash
# SUPER_ADMIN consegue
curl -X GET "http://localhost:3000/api/auditoria" \
  -H "Authorization: Bearer JWT_SUPER_ADMIN"

# FUNCIONARIO recebe 403
curl -X GET "http://localhost:3000/api/auditoria" \
  -H "Authorization: Bearer JWT_FUNCIONARIO"
```

#### 5. Rodar Testes Automatizados

```bash
npm test
npm run test:coverage
```

---

## 🎯 Próximas Etapas

Todas as 5 SPRINTs estão ✅ COMPLETAS!

Sistema está pronto para:

- ✅ Deploy em staging environment
- ✅ Testes contra Uniplus API real
- ✅ Produção com segurança máxima

### Deploy Checklist

- [ ] Configurar .env para staging/produção
- [ ] Backup de banco de dados
- [ ] Monitoramento (uptime, logs, erros)
- [ ] CI/CD pipeline (GitHub Actions, etc)
- [ ] Documentação de operações (runbook)
- [ ] Plano de disaster recovery

---

## Licenca

Luiz Vasconcelos 01/19/2026
Uso da api para fins comerciais.
| **4** | 📊 Dashboard Operacional | ✅ COMPLETO | 03/16/2026 |
| **5** | 🛡️ Segurança & Deploy | ⏳ PLANEJADO | 03/18-22/2026 |

### Resumo por SPRINT

**SPRINT 1: Base Auth** ✅

- Login/logout com JWT
- Middleware de autenticação
- Refresh token automático

**SPRINT 2: Super Admin** ✅

- CRUD unidades com criptografia de credenciais Uniplus
- Dashboard super admin
- Seed de dados iniciais

**SPRINT 3: Gestão Funcionários** ✅

- CRUD usuários com permissões granulares
- Validação de email e força de senha
- 6 permissões base (ver_produtos, editar_produtos, etc)

**SPRINT 4: Dashboard Operacional** ✅ **NOVO**

- GET /api/produtos + PATCH para editar
- GET /api/clientes + PATCH para editar
- GET /api/cidades-estados para dropdowns
- Frontend com tabelas, filtros, paginação, modais
- Isolamento multi-tenant (unit_id validation)
- Auditoria de todas operações
- Permissão-based UI (botões Edit aparecem só se autorizado)

**SPRINT 5: Segurança & Deploy** ⏳

- Rate limiting
- CORS restrito
- Endpoint de auditoria
- Testes automatizados (Jest + Supertest)
- Docker otimizado
- CI/CD pipeline (GitHub Actions)
- Documentação OpenAPI (Swagger)
- Deploy para staging

---

## 🧪 Como Testar SPRINT 4

### 1. Setup Local

```bash
# Clonar repositório
git clone https://github.com/seu-user/uniplus-project.git
cd uniplus-project

# Instalar dependências
npm install

# Criar .env (copiar de .env.example)
cp .env.example .env

# Rodar migrations
npx prisma migrate deploy

# Seed de dados (usuários, unidades, permissões)
npx prisma db seed

# Iniciar servidor
npm start
# Servidor rodando em http://localhost:3000
```

### 2. Login no Dashboard

```bash
# Super Admin
Usuário: admin@uniplus.com.br
Senha: Admin@123456

# Funcionário (SPRINT 4)
Usuário: funcionario@empresa.com.br
Senha: Func@123456
```

### 3. Testar Produtos (GET)

```bash
# Terminal 1: Servidor rodando

# Terminal 2: Curl ou Postman
curl -X GET "http://localhost:3000/api/produtos?limit=25&offset=0" \
  -H "Authorization: Bearer JWT_TOKEN_AQUI" \
  -H "Content-Type: application/json"

# Response esperado:
# {
#   "success": true,
#   "data": [
#     {"codigo": "001", "nome": "Produto A", "preco": 100.50, ...},
#     {"codigo": "002", "nome": "Produto B", "preco": 200.00, ...}
#   ],
#   "pagination": {"total": 150, "limit": 25, "offset": 0, "pages": 6, "currentPage": 1}
# }
```

### 4. Testar Edição (PATCH)

```bash
curl -X PATCH "http://localhost:3000/api/produtos/001" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"preco": 150.00, "nome": "Produto A Atualizado"}'

# Response esperado:
# {
#   "success": true,
#   "data": {"codigo": "001", "nome": "Produto A Atualizado", "preco": 150.00, ...},
#   "message": "Produto 001 atualizado com sucesso"
# }
```

### 5. Testar Permissões (403)

```bash
# Como FUNCIONARIO sem permissão 'editar_produtos':
curl -X PATCH "http://localhost:3000/api/produtos/001" \
  -H "Authorization: Bearer JWT_FUNCIONARIO" \
  -H "Content-Type: application/json" \
  -d '{"preco": 150.00}'

# Response esperado: 403 Forbidden
# {
#   "success": false,
#   "error": "Permissão negada para editar_produtos"
# }
```

### 6. Testar Clientes

```bash
# GET clientes
curl -X GET "http://localhost:3000/api/clientes?limit=25&offset=0" \
  -H "Authorization: Bearer JWT_TOKEN"

# PATCH cliente
curl -X PATCH "http://localhost:3000/api/clientes/123" \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"email": "novo@email.com.br"}'
```

### 7. Dashboard Frontend

```
1. Abrir http://localhost:3000
2. Fazer login
3. Ver seção "Produtos" com tabela
4. Filtrar por código ou nome
5. Clicar "Editar" para abrir modal
6. Editar campo e salvar
7. Ver toast de sucesso/erro
```

### 8. Verificar Auditoria (DB)

```bash
# Via Prisma Studio
npx prisma studio

# Abrir em navegador
# Ir para tabela 'AuditoriaLog'
# Ver registros: userId, unitId, operacao (LISTAR, ATUALIZAR), status
```

---
