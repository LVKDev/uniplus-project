require('dotenv').config();

const app = require('./app');
const { sincronizarCatalogoProdutos } = require('./services/produtos.service');

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
  sincronizarCatalogoProdutos().catch((err) =>
    console.error('[startup] Falha ao pré-carregar catálogo de produtos:', err.message),
  );
});
