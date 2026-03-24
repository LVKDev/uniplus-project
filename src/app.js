const express = require('express');
const pedidosRoutes = require('./routes/pedidos.routes');
const entidadesRoutes = require('./routes/entidades.routes');
const produtosRoutes = require('./routes/produtos.routes');
const ordensServicoRoutes = require('./routes/ordens-servico.routes');
const vendasRoutes = require('./routes/vendas.routes');
const arquivosRoutes = require('./routes/arquivos.routes');
const tipoDocumentoRoutes = require('./routes/tipo-documento-financeiro.routes');
const gourmetRoutes = require('./routes/gourmet.routes');
const portalRoutes = require('./routes/portal-comercial.routes');
const healthRoutes = require('./routes/health.routes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./docs/swagger');

const app = express();

const basicAuthUser = process.env.BASIC_AUTH_USER;
const basicAuthPass = process.env.BASIC_AUTH_PASS;

// CORS - Permissivo para evitar WAF
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Accept-Language, User-Agent, Referer');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Headers para não parecer um bot
  res.header('X-Powered-By', 'Express');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Parse JSON bodies.
app.use(express.json());

// Optional Basic Auth protection for all routes.
app.use((req, res, next) => {
  if (!basicAuthUser || !basicAuthPass) {
    return next();
  }

  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Basic' || !token) {
    res.set('WWW-Authenticate', 'Basic realm="UniPlus API"');
    return res.status(401).json({ success: false, error: 'Autenticacao requerida.' });
  }

  const decoded = Buffer.from(token, 'base64').toString('utf8');
  const separatorIndex = decoded.indexOf(':');
  if (separatorIndex === -1) {
    res.set('WWW-Authenticate', 'Basic realm="UniPlus API"');
    return res.status(401).json({ success: false, error: 'Autenticacao invalida.' });
  }

  const user = decoded.slice(0, separatorIndex);
  const pass = decoded.slice(separatorIndex + 1);
  if (user !== basicAuthUser || pass !== basicAuthPass) {
    res.set('WWW-Authenticate', 'Basic realm="UniPlus API"');
    return res.status(401).json({ success: false, error: 'Credenciais invalidas.' });
  }

  return next();
});

// API routes.
app.use(healthRoutes);
app.use(pedidosRoutes);
app.use(entidadesRoutes);
app.use(produtosRoutes);
app.use(ordensServicoRoutes);
app.use(vendasRoutes);
app.use(arquivosRoutes);
app.use(tipoDocumentoRoutes);
app.use(gourmetRoutes);
app.use(portalRoutes);

// Swagger docs.
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/openapi.json', (req, res) => {
  res.json(swaggerSpec);
});

// 404 handler for unknown routes.
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Rota nao encontrada.' });
});

// Global error handler.
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Erro interno.',
    details: err.details || err.auditError || null,
  });
});

module.exports = app;
