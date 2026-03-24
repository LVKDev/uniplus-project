# CLAUDE.md - UniPlus Project Context

## 📋 Executive Summary

**Project**: UniPlus Backend API  
**Language**: Node.js (CommonJS)  
**Runtime**: Node.js 18+  
**Framework**: Express.js  
**Database**: MySQL 8.x  
**ORM**: Prisma 5.18.0  
**Architecture**: Microservices REST API with audit logging  
**Status**: Production-ready integration layer

---

## 🏗️ Technology Stack

### Core Backend

- **Express.js** (^4.19.2) - HTTP server & routing
- **Node.js** - Runtime environment
- **Axios** (^1.7.7) - HTTP client for UniPlus API integration
- **Prisma** (^5.18.0) - Database ORM with type safety

### Database

- **MySQL 8.x** - Relational database
- **Prisma Migrations** - Schema versioning (see `prisma/migrations/`)

### API Documentation

- **Swagger UI** (swagger-ui-express ^5.0.1) - Interactive API documentation
- **Swagger JSDoc** (swagger-jsdoc ^6.2.8) - OpenAPI spec generation

### Development Tools

- **Nodemon** (^3.1.4) - Hot reload during development
- **Dotenv** (^16.4.5) - Environment variable management

### External Integrations

- **UniPlus Public API** - ERP system integration (OAuth 2.0 Client Credentials)
- **Supabase** - Optional audit log storage

---

## 🗂️ Project Structure

```
uniplus-project/
├── src/
│   ├── app.js                          # Express app configuration & middleware
│   ├── server.js                       # Server entry point (listens on port 3000)
│   ├── config/
│   │   ├── constants.js               # Global constants
│   │   ├── portal.js                  # Portal API client configuration
│   │   ├── supabase.js                # Supabase client (optional audit store)
│   │   └── uniplus.js                 # UniPlus OAuth client with token caching
│   ├── routes/
│   │   ├── pedidos.routes.js          # Orders endpoints
│   │   ├── entidades.routes.js        # Customers/vendors endpoints
│   │   ├── produtos.routes.js         # Products endpoints
│   │   ├── ordens-servico.routes.js   # Service orders endpoints
│   │   ├── vendas.routes.js           # Sales endpoints
│   │   ├── arquivos.routes.js         # File management endpoints
│   │   ├── tipo-documento-financeiro.routes.js # Financial docs endpoints
│   │   ├── gourmet.routes.js          # Gourmet module endpoints
│   │   ├── portal-comercial.routes.js # Portal integration endpoints
│   │   └── health.routes.js           # Health check endpoint
│   ├── services/
│   │   ├── audit.service.js           # Audit logging logic
│   │   ├── uniplus.service.js         # UniPlus API integration wrapper
│   │   ├── pedidos.service.js         # Business logic for orders
│   │   ├── entidades.service.js       # Business logic for entities
│   │   ├── produtos.service.js        # Business logic for products
│   │   ├── ordens-servico.service.js  # Business logic for service orders
│   │   ├── vendas.service.js          # Business logic for sales
│   │   ├── arquivos.service.js        # File operations
│   │   ├── gourmet.service.js         # Gourmet module logic
│   │   ├── portal-comercial.service.js # Portal integration logic
│   │   └── tipo-documento-financeiro.service.js # Financial doc types logic
│   └── docs/
│       └── swagger.js                 # OpenAPI/Swagger configuration
├── prisma/
│   ├── schema.prisma                  # Database schema definition
│   ├── seed.js                        # Database seeding script
│   └── migrations/
│       ├── migration_lock.toml        # Migration lock file
│       ├── 0001_init/                 # Initial schema
│       └── 0002_audit_logs/           # Audit tables schema
├── docker-compose.yml                 # Docker Compose for MySQL + app
├── Dockerfile                         # Container image definition
├── package.json                       # NPM dependencies & scripts
├── README.md                          # User-facing documentation
└── scripts/
    └── start.sh                       # Docker startup script

```

---

## 🗄️ Database Schema

### Audit Logging Tables (MySQL)

All audit tables follow a consistent pattern:

```sql
-- pedidos_log (Orders)
-- entidades_log (Entities/Customers)
-- produtos_log (Products)
-- ordens_servico_log (Service Orders)
-- health_log (Health Checks)
-- api_logs (General API operations)

Columns (all tables):
  id (CUID primary key)
  codigo (nullable string - reference to entity code)
  payload (JSON - raw request/response data)
  operacao (string - LISTAR, CONSULTAR, CRIAR, ATUALIZAR, APAGAR)
  status (string - SUCESSO or FALHA)
  dataOperacao (timestamp - operation datetime)
```

**Prisma models** in `prisma/schema.prisma`:

- `PedidoLog`
- `EntidadeLog`
- `ProdutoLog`
- `OrdemServicoLog`
- `HealthLog`
- `ApiLog`

---

## 🔐 Authentication & Security

### OAuth 2.0 (UniPlus Integration)

- **Flow**: Client Credentials
- **Token Caching**: Automatic refresh via `src/config/uniplus.js`
- **Env Variables**:
  - `UNIPLUS_BASE_URL` - UniPlus public API endpoint
  - `UNIPLUS_SERVER_URL` - OAuth server endpoint
  - `UNIPLUS_AUTH_BASIC` - Base64-encoded client:secret
  - `UNIPLUS_CLIENT_ID` - Optional fallback credential
  - `UNIPLUS_CLIENT_SECRET` - Optional fallback credential
  - `UNIPLUS_TOKEN` - Optional static token (if not set, OAuth is used)

### HTTP Basic Auth (API Protection)

- Enabled when `BASIC_AUTH_USER` and `BASIC_AUTH_PASS` are set
- Applied globally in `app.js` middleware
- Protects all `/api/*` routes

### Authorization

- No role-based access control (RBAC) currently implemented
- All authenticated users have same permissions

---

## 📡 API Endpoints Structure

### Base Path

```
GET   /                          # Health check
GET   /docs                      # Swagger UI
GET   /openapi.json             # OpenAPI spec
```

### API Routes (all require `/api` prefix)

```
# Pedidos (Orders)
GET    /api/pedidos                    # List with pagination
GET    /api/pedidos/:codigo            # Get by code
POST   /api/pedidos                    # Create
PUT    /api/pedidos                    # Update
DELETE /api/pedidos/:codigo            # Delete

# Entidades (Customers/Vendors)
GET    /api/entidades                  # List
GET    /api/entidades/:codigo          # Get by code
POST   /api/entidades                  # Create
PUT    /api/entidades                  # Update
DELETE /api/entidades/:codigo          # Delete

# Produtos (Products)
GET    /api/produtos                   # List
GET    /api/produtos/:codigo           # Get by code
POST   /api/produtos                   # Create
PUT    /api/produtos                   # Update
DELETE /api/produtos/:codigo           # Delete

# Ordens de Serviço (Service Orders)
GET    /api/ordens-servico             # List
GET    /api/ordens-servico/:codigo     # Get by code

# Vendas (Sales)
GET    /api/vendas                     # List
GET    /api/vendas/:codigo             # Get by code

# Arquivos (Files)
GET    /api/arquivos                   # List
POST   /api/arquivos                   # Upload

# Tipo Documento Financeiro (Financial Doc Types)
GET    /api/tipo-documento-financeiro  # List

# Gourmet Module
GET    /api/gourmet/*                  # Gourmet endpoints

# Portal Comercial (Commercial Portal)
GET    /api/portal/*                   # Portal integration endpoints
```

---

## 🔄 Integration Architecture

### UniPlus Integration Layer (`src/config/uniplus.js`)

```javascript
// Features:
- Axios HTTP client singleton
- OAuth token management with caching
- Automatic token refresh before expiration
- 15-second request timeout
- Graceful error handling

// Usage in services:
const uniplusClient = require('./config/uniplus').uniplusClient;
const data = await uniplusClient.get('/pedidos');
```

### Service-Route Pattern

```
Route (/routes/*.js)
  ↓ (extracts request params)
  Service (/services/*.service.js)
  ↓ (business logic + audit)
  Uniplus Service (calls uniplusService.*)
  ↓ (HTTP integration)
  UniPlus Public API
  ↓ (response + audit logging)
  Database (Prisma - audit tables)
  ↓ (returns result)
  Route Handler
  ↓ (sends HTTP response)
  Client
```

### Audit Logging Pattern

```javascript
// Every service operation:
try {
  const data = await uniplusService.fetch();
  await auditService.registrarAuditoria({
    table: "pedidos_log",
    recurso: "pedidos",
    rota: "/api/pedidos",
    metodo: "GET",
    codigo: null,
    payload: {
      /* request data */
    },
    operacao: "LISTAR",
    status: "SUCESSO",
  });
  return data;
} catch (error) {
  // Log failure
  await auditService.registrarAuditoria({
    /* same as above but status: 'FALHA' */
  });
  throw error;
}
```

---

## 🛠️ Development Standards

### Code Style & Patterns

#### Error Handling

```javascript
// Use try-catch with audit fallback:
try {
  // business logic
} catch (error) {
  try {
    await auditService.registrarAuditoria({
      status: "FALHA",
      // ... other fields
    });
  } catch (auditError) {
    // Never let audit failure break the request
    error.auditError = auditError.message;
  }
  throw error;
}
```

#### Environment Variables

- Use `process.env.VARIABLE_NAME`
- All required variables should be validated on server startup
- Invalid config = fail fast (see `src/config/uniplus.js`)

#### Database Queries

- Always use Prisma Client via `@prisma/client`
- Use `prisma.tableName.create()`, `prisma.tableName.findUnique()`, etc.
- Never execute raw SQL unless absolutely necessary
- Wrap DB operations in error handlers

#### JSON Payloads

- Store raw request/response payloads in audit tables as JSON
- Enables future reprocessing or compliance audits
- Example: `payload: { /* entire request body */ }`

### API Response Format

```javascript
// Success (200)
{
  success: true,
  data: { /* response */ }
}

// Error (4xx/5xx)
{
  success: false,
  error: "Human-readable error message",
  code: "ERROR_CODE" // Optional
}
```

---

## 🚀 Running the Application

### Environment Setup

Create `.env` file in project root:

```bash
# UniPlus Integration
UNIPLUS_BASE_URL=https://exemplo.com/public-api
UNIPLUS_SERVER_URL=https://exemplo.com
UNIPLUS_AUTH_BASIC=QmFzZTY0RW5jb2RlZDpiYXNlNjRzZWNyZXQ=
UNIPLUS_TOKEN=  # Leave empty to use OAuth

# API Security
BASIC_AUTH_USER=api_user
BASIC_AUTH_PASS=api_password

# Database
DATABASE_URL=mysql://user:password@localhost:3306/uniplus_db

# Portal Integration
PORTAL_BASE_URL=https://portal.example.com
PORTAL_API_TOKEN=token123

# Supabase (Optional)
SUPABASE_URL=https://project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=service_role_key

# API Configuration
UNIPLUS_ALL_LIMIT=100
PORT=3000
```

## 📊 Key Modules Overview

### Pedidos (Orders) - `src/services/pedidos.service.js`

- **Operations**: LISTAR, CONSULTAR, CRIAR, ATUALIZAR, APAGAR
- **Audit Table**: `pedidos_log`
- **Integration**: UniPlus `/pedidos` endpoint
- **Features**:
  - Paginated listing
  - Code-based lookup
  - Full CRUD operations
  - Comprehensive audit trail

### Entidades (Customers/Vendors) - `src/services/entidades.service.js`

- **Operations**: LISTAR, CONSULTAR, CRIAR, ATUALIZAR, APAGAR
- **Audit Table**: `entidades_log`
- **Integration**: UniPlus `/entidades` endpoint
- **Role**: Entity master data (suppliers, clients)

### Produtos (Products) - `src/services/produtos.service.js`

- **Operations**: LISTAR, CONSULTAR, CRIAR, ATUALIZAR, APAGAR
- **Audit Table**: `produtos_log`
- **Integration**: UniPlus `/produtos` endpoint

### Ordens de Serviço (Service Orders) - `src/services/ordens-servico.service.js`

- **Operations**: LISTAR, CONSULTAR
- **Audit Table**: `ordens_servico_log`
- **Integration**: UniPlus service orders endpoint
- **Note**: Currently read-only

### Additional Modules

- **Vendas**: Sales management
- **Arquivos**: File upload/management
- **Gourmet**: Restaurant/food service module
- **Portal Comercial**: Portal integration layer
- **Tipo Documento Financeiro**: Financial document type management

---

## 🔍 Debugging & Monitoring

### Logging

- Console logs prefixed with `[Module]` tag (e.g., `[UniPlus]`)
- Audit service logs all operations (success/failure) to MySQL
- Failed operations logged but don't block request completion

### Health Check

- `GET /health` endpoint available
- Returns server status and timestamp
- Used for load balancer/container orchestration verification

### Swagger Documentation

- Available at `http://localhost:3000/docs` (in development)
- Auto-generated from JSDoc comments in route files
- OpenAPI spec: `http://localhost:3000/openapi.json`

---
