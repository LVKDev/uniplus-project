// Constantes centralizadas da aplicação.

// ============================================
// ROLES - Hierarquia de usuários
// ============================================
const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN_UNIDADE: "ADMIN_UNIDADE",
  FUNCIONARIO: "FUNCIONARIO",
};

// ============================================
// PERMISSOES - Flags granulares por usuário
// ============================================
const PERMISSOES = {
  // Produtos
  ver_produtos: "ver_produtos",
  editar_produtos: "editar_produtos",

  // Clientes
  ver_clientes: "ver_clientes",
  editar_clientes: "editar_clientes",

  // Usuários (gestão)
  gerenciar_usuarios: "gerenciar_usuarios",

  // Auditoria
  ver_auditoria: "ver_auditoria",
};

// ============================================
// PERMISSÕES PARA API TOKENS
// ============================================
const PERMISSOES_API = {
  ver_produtos: "ver_produtos",
  ver_clientes: "ver_clientes",
  ver_pedidos: "ver_pedidos",
  ver_ordens_servico: "ver_ordens_servico",
  ver_vendas: "ver_vendas",
  ver_entidades: "ver_entidades",
  ver_arquivos: "ver_arquivos",
  n8n_acesso_total: "n8n_acesso_total",

  // Permissões de escrita mantidas para frontends externos controlados.
  editar_produtos: "editar_produtos",
  editar_clientes: "editar_clientes",
  editar_pedidos: "editar_pedidos",
};

// ============================================
// PERMISSOES PADRÃO POR ROLE
// ============================================
const PERMISSOES_POR_ROLE = {
  [ROLES.SUPER_ADMIN]: [
    // Super Admin: acesso total
    PERMISSOES.ver_produtos,
    PERMISSOES.editar_produtos,
    PERMISSOES.ver_clientes,
    PERMISSOES.editar_clientes,
    PERMISSOES.gerenciar_usuarios,
    PERMISSOES.ver_auditoria,
  ],
  [ROLES.ADMIN_UNIDADE]: [
    // Admin de Unidade: gerencia usuários e vê tudo
    PERMISSOES.ver_produtos,
    PERMISSOES.editar_produtos,
    PERMISSOES.ver_clientes,
    PERMISSOES.editar_clientes,
    PERMISSOES.gerenciar_usuarios,
    PERMISSOES.ver_auditoria,
  ],
  [ROLES.FUNCIONARIO]: [
    // Funcionário: vê tudo por padrão, edição depende de permissão específica
    PERMISSOES.ver_produtos,
    PERMISSOES.ver_clientes,
  ],
};

// ============================================
// PAGINAÇÃO PADRÃO
// ============================================
const DEFAULT_LIMIT = 25;
const MAX_PAGE_SIZE = 100;
const MAX_PAGES = 1000;
const ALL_LIMIT = Number(process.env.UNIPLUS_ALL_LIMIT) || 1000;

// ============================================
// EXTRAÇÃO DE LISTAS DE RESPOSTAS
// ============================================
const LIST_KEYS = [
  "data",
  "items",
  "registros",
  "records",
  "content",
  "conteudo",
];

module.exports = {
  // Roles e Permissões
  ROLES,
  PERMISSOES,
  PERMISSOES_API,
  PERMISSOES_POR_ROLE,

  // Paginação
  DEFAULT_LIMIT,
  MAX_PAGE_SIZE,
  MAX_PAGES,
  ALL_LIMIT,
  LIST_KEYS,
};
