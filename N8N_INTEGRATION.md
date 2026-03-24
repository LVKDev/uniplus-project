# N8N Integration Guide - UniPlus Backend API

## 📋 Overview

This guide explains how to configure n8n to work with the UniPlus Backend API. The API provides REST endpoints for order management (Pedidos), entities (Entidades), products (Produtos), and more.

## 🚀 Quick Start

### Option 1: Local Development (Recommended for Testing)

#### Step 1: Start the API Server

```bash
# Navigate to project directory
cd /path/to/uniplus-project

# Install dependencies (if not already done)
npm install

# Create and configure .env file
cp .env.example .env

# Start the API server
npm run dev
```

The API will be available at `http://localhost:3000`

#### Step 2: Verify API is Running

```bash
# Test health endpoint
curl -X GET http://localhost:3000/health

# Should return:
# {"success":true,"status":"ok","uptime":...,"timestamp":"..."}
```

#### Step 3: Configure n8n Webhook

In n8n workflow, use the following webhook URL:

```
http://localhost:3000/api/pedidos
```

### Option 2: Docker Compose (Production-like)

```bash
# Start all services (MySQL + API)
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be healthy (~30 seconds)
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f api

# Stop services
docker-compose -f docker-compose.dev.yml down
```

## 🔐 Authentication

### No Authentication (Default for n8n)

By default, the API does not require authentication when `BASIC_AUTH_USER` and `BASIC_AUTH_PASS` are not set in `.env`.

```bash
# Example: No auth required
curl -X GET http://localhost:3000/api/pedidos
```

### With Basic Authentication

If you want to require authentication:

```bash
# In .env
BASIC_AUTH_USER=n8n_user
BASIC_AUTH_PASS=n8n_password

# In n8n, add Authorization header:
Authorization: Basic base64(n8n_user:n8n_password)

# Or in curl:
curl -X GET http://localhost:3000/api/pedidos \
  -H "Authorization: Basic $(echo -n 'n8n_user:n8n_password' | base64)"
```

### With Bearer Token

```bash
# In .env (new feature)
API_BEARER_TOKEN=your_secret_token

# In n8n:
Authorization: Bearer your_secret_token

# Or in curl:
curl -X GET http://localhost:3000/api/pedidos \
  -H "Authorization: Bearer your_secret_token"
```

## 📡 Available Endpoints

### Base Path

```
/api
```

### Endpoints

#### Orders (Pedidos)

```
GET    /api/pedidos                    # List all orders (with pagination)
GET    /api/pedidos/:codigo            # Get order by code
POST   /api/pedidos                    # Create new order
PUT    /api/pedidos                    # Update order
DELETE /api/pedidos/:codigo            # Delete order

Query Parameters:
  - limit=10          # Number of records per page (default: 100)
  - offset=0          # Skip N records (default: 0)
  - cliente=123       # Filter by customer code
  - codigo=456        # Filter by order code
  - status=8          # Filter by status
  - single=true       # Return only first record
```

#### Entities (Entidades)

```
GET    /api/entidades                  # List all entities
GET    /api/entidades/:codigo          # Get entity by code
POST   /api/entidades                  # Create entity
PUT    /api/entidades                  # Update entity
DELETE /api/entidades/:codigo          # Delete entity
```

#### Products (Produtos)

```
GET    /api/produtos                   # List all products
GET    /api/produtos/:codigo           # Get product by code
POST   /api/produtos                   # Create product
PUT    /api/produtos                   # Update product
DELETE /api/produtos/:codigo           # Delete product
```

#### Service Orders (Ordens de Serviço)

```
GET    /api/ordens-servico             # List all service orders
GET    /api/ordens-servico/:codigo     # Get service order by code
```

#### Sales (Vendas)

```
GET    /api/vendas                     # List all sales
GET    /api/vendas/:codigo             # Get sale by code
```

#### Documentation

```
GET    /health                         # Health check
GET    /docs                           # Swagger UI
GET    /openapi.json                   # OpenAPI specification
```

## 🔄 n8n Workflow Examples

### Example 1: Fetch Orders and Process

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook"
    },
    {
      "name": "GET Orders",
      "type": "n8n-nodes-base.httpRequest",
      "method": "GET",
      "url": "http://localhost:3000/api/pedidos",
      "headers": {
        "Content-Type": "application/json"
      }
    },
    {
      "name": "Process Data",
      "type": "n8n-nodes-base.code",
      "language": "javascript"
    }
  ]
}
```

### Example 2: Create New Order

```json
{
  "method": "POST",
  "url": "http://localhost:3000/api/pedidos",
  "headers": {
    "Content-Type": "application/json"
  },
  "body": {
    "cliente": 123,
    "filial": 1,
    "itens": [
      {
        "produto": 456,
        "quantidade": 5,
        "valor": 100.0
      }
    ]
  }
}
```

### Example 3: List Orders with Pagination

```
GET http://localhost:3000/api/pedidos?limit=50&offset=0
```

Response:

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

## 🧪 Testing with cURL

Run the provided test script:

```bash
# Basic test (no authentication)
./scripts/test-api.sh

# Test with authentication
./scripts/test-api.sh -U myuser -P mypass

# Test specific API server
./scripts/test-api.sh -u http://api.example.com:3000

# Verbose output
VERBOSE=true ./scripts/test-api.sh
```

### Manual cURL Tests

```bash
# Health check
curl -X GET http://localhost:3000/health

# List orders
curl -X GET http://localhost:3000/api/pedidos

# List orders with pagination
curl -X GET "http://localhost:3000/api/pedidos?limit=10&offset=0"

# Get single order
curl -X GET "http://localhost:3000/api/pedidos?single=true"

# Get order by code
curl -X GET "http://localhost:3000/api/pedidos/123"

# Create order
curl -X POST http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "cliente": 123,
    "filial": 1,
    "itens": [
      {
        "produto": 456,
        "quantidade": 5,
        "valor": 100.00
      }
    ]
  }'

# Update order
curl -X PUT http://localhost:3000/api/pedidos \
  -H "Content-Type: application/json" \
  -d '{
    "codigo": 1,
    "cliente": 123,
    "filial": 1,
    "itens": [...]
  }'

# Delete order
curl -X DELETE http://localhost:3000/api/pedidos/123
```

## 🔧 Environment Variables

Key variables for n8n integration:

```bash
# Server
PORT=3000
PUBLIC_BASE_URL=http://localhost:3000

# Database
DATABASE_URL=mysql://user:password@localhost:3306/uniplus_db

# API Security (optional)
BASIC_AUTH_USER=
BASIC_AUTH_PASS=
API_BEARER_TOKEN=

# UniPlus ERP Integration
UNIPLUS_BASE_URL=https://unisoftsistemas.com.br/public-api
UNIPLUS_SERVER_URL=https://unisoftsistemas.com.br
UNIPLUS_AUTH_BASIC=base64_encoded_credentials
UNIPLUS_TOKEN=
```

## 🛠️ Troubleshooting

### API not responding

```bash
# Check if server is running on port 3000
curl -v http://localhost:3000/health

# Check server logs
npm run dev  # Look for errors in console
```

### Authentication errors

```bash
# If you get 401 Unauthorized:
# 1. Check if BASIC_AUTH_USER is set in .env
# 2. Ensure you're sending correct Authorization header
# 3. Verify credentials are base64-encoded correctly

# Test auth manually:
echo -n "username:password" | base64
# Use output in header: -H "Authorization: Basic output"
```

### Database connection errors

```bash
# Check if MySQL is running and accessible:
mysql -h localhost -u root -p

# Verify DATABASE_URL format:
# mysql://username:password@host:port/database

# Run migrations:
npm run db:migrate
```

### n8n webhook not triggering

1. Ensure API is running: `curl http://localhost:3000/health`
2. Check n8n workflow has correct webhook URL
3. Verify firewall allows connections to port 3000
4. Check n8n logs for HTTP errors

## 📊 Monitoring

### View Recent Audit Logs

The API automatically logs all operations to MySQL audit tables:

- `pedidos_log` - Order operations
- `entidades_log` - Entity operations
- `produtos_log` - Product operations
- `api_logs` - General API operations

Query example:

```sql
SELECT * FROM api_logs
ORDER BY data_operacao DESC
LIMIT 10;
```

### API Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "data": {
    // Actual response data
  }
}
```

All error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## 🔗 Common Integration Patterns

### Pattern 1: Fetch and Transform

```
HTTP Request (GET) → Code Block (Transform) → Database Update
```

### Pattern 2: Scheduled Sync

```
Trigger (Cron) → HTTP Request (GET all) → Data Processing → Store Results
```

### Pattern 3: Real-time Processing

```
Webhook (HTTP) → Validate Data → Create/Update → Log Response
```

## 📚 Additional Resources

- API Documentation: http://localhost:3000/docs
- OpenAPI Spec: http://localhost:3000/openapi.json
- CLAUDE.md: Project documentation
- README.md: Setup instructions

## 🆘 Support

For issues or questions:

1. Check the test script output: `./scripts/test-api.sh -v`
2. Review server logs: `npm run dev`
3. Check database: `mysql -u root -p uniplus_db`
4. Verify `.env` configuration
5. Review CLAUDE.md for architecture details

---

**Last Updated**: March 2026  
**API Version**: 1.0.0  
**Status**: Production Ready
