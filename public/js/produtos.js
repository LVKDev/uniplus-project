/**
 * Controller de Produtos - Frontend
 * Gerencia listagem, edição e salvamento de produtos
 * SPRINT 4
 */

// Estado global
let currentPage = 1;
let currentLimit = 25;
let currentFiltros = {};

/**
 * Carrega lista de produtos com paginação
 * @param {number} page - Número da página (1-indexed)
 */
async function loadProdutos(page = 1) {
  try {
    currentPage = page || 1;

    // Mostrar loader
    const tableContainer = document.getElementById("produtosTableContainer");
    if (tableContainer) {
      tableContainer.innerHTML =
        '<div class="loader">Carregando produtos...</div>';
    }

    // Montar query params
    const offset = (currentPage - 1) * currentLimit;
    const params = new URLSearchParams({
      limit: currentLimit,
      offset: offset,
      ...currentFiltros,
    });

    // Requisição
    const response = await fetch(`/api/produtos?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      if (response.status === 403) {
        showToast("Permissão negada para visualizar produtos", "error");
        return;
      }
      if (response.status === 401) {
        window.location.href = "/";
        return;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      showToast(result.error || "Erro ao carrega produtos", "error");
      return;
    }

    // Renderizar tabela
    renderProdutosTable(result.data, result.pagination);
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    showToast(error.message || "Erro ao carregar produtos", "error");
  }
}

/**
 * Renderiza tabela de produtos
 * @param {array} produtos - Lista de produtos
 * @param {object} pagination - Info de paginação {total, limit, offset}
 */
function renderProdutosTable(produtos, pagination = {}) {
  const tableContainer = document.getElementById("produtosTableContainer");

  if (!tableContainer) {
    console.warn("Container #produtosTableContainer não encontrado");
    return;
  }

  if (!produtos || produtos.length === 0) {
    tableContainer.innerHTML =
      '<p class="text-center">Nenhum produto encontrado</p>';
    return;
  }

  // Verificar permissão para editar
  const userPerms = window.usuario?.permissions || [];
  const canEdit = userPerms.includes("editar_produtos");

  // Montar HTML da tabela
  let html = `
    <table class="table table-striped table-hover">
      <thead>
        <tr>
          <th>Código</th>
          <th>Nome</th>
          <th>Preço</th>
          <th>Referência</th>
  `;

  if (canEdit) {
    html += `<th>Ações</th>`;
  }

  html += `
        </tr>
      </thead>
      <tbody>
  `;

  // Renderizar linhas
  for (const produto of produtos) {
    const codigo = escapeHtml(String(produto.codigo || ""));
    const nome = escapeHtml(String(produto.nome || ""));
    const preco = produto.preco
      ? `R$ ${parseFloat(produto.preco).toFixed(2)}`
      : "—";
    const referencia = escapeHtml(String(produto.referencia || "—"));

    html += `
      <tr data-codigo="${codigo}">
        <td><strong>${codigo}</strong></td>
        <td>${nome}</td>
        <td>${preco}</td>
        <td>${referencia}</td>
    `;

    if (canEdit) {
      html += `
        <td>
          <button class="btn btn-sm btn-primary" onclick="openEditProdutoModal('${codigo}')">
            Editar
          </button>
        </td>
      `;
    }

    html += `</tr>`;
  }

  html += `
      </tbody>
    </table>
  `;

  // Adicionar paginação
  if (pagination && pagination.total > 0) {
    const totalPages = Math.ceil(pagination.total / currentLimit);
    html += renderPaginacao(currentPage, totalPages, "loadProdutos");
  }

  tableContainer.innerHTML = html;
}

/**
 * Abre modal para editar produto
 * @param {string} codigoProduto - Código do produto
 */
async function openEditProdutoModal(codigoProduto) {
  try {
    // Buscar produto
    const response = await fetch(`/api/produtos/${codigoProduto}`, {
      method: "GET",
    });

    if (!response.ok) {
      showToast("Erro ao carregar produto", "error");
      return;
    }

    const result = await response.json();
    const produto = result.data;

    // Preencher modal
    const modal = document.getElementById("editProdutoModal");
    if (!modal) {
      console.warn("Modal #editProdutoModal não encontrado");
      return;
    }

    // Preencher campos
    document.getElementById("editProdutoCodigoLabel").textContent =
      `Editando Produto: ${escapeHtml(String(codigoProduto))}`;
    document.getElementById("editProdutoNome").value = produto.nome || "";
    document.getElementById("editProdutoPreco").value = produto.preco || "";
    document.getElementById("editProdutoDescricao").value =
      produto.descricao || "";
    document.getElementById("editProdutoReferencia").value =
      produto.referencia || "";

    // Guardar código no form para usar no submit
    document.getElementById("editProdutoForm").dataset.codigo = codigoProduto;

    // Mostrar modal (Bootstrap)
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
  } catch (error) {
    console.error("Erro ao abrir modal:", error);
    showToast(error.message || "Erro ao abrir modal", "error");
  }
}

/**
 * Salva produto editado
 * @param {event} event - Evento do formulário
 */
async function handleEditProdutoSubmit(event) {
  event.preventDefault();

  try {
    const codigoProduto =
      document.getElementById("editProdutoForm").dataset.codigo;

    if (!codigoProduto) {
      showToast("Código do produto não informado", "error");
      return;
    }

    const nome = document.getElementById("editProdutoNome").value.trim();
    const preco = parseFloat(document.getElementById("editProdutoPreco").value);
    const descricao = document
      .getElementById("editProdutoDescricao")
      .value.trim();
    const referencia = document
      .getElementById("editProdutoReferencia")
      .value.trim();

    // Validação
    if (!nome) {
      showToast("Nome do produto é obrigatório", "error");
      return;
    }

    if (isNaN(preco) || preco < 0) {
      showToast("Preço inválido", "error");
      return;
    }

    // Montar payload
    const dados = { nome, preco };
    if (descricao) dados.descricao = descricao;
    if (referencia) dados.referencia = referencia;

    // Requisição
    const response = await fetch(`/api/produtos/${codigoProduto}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      if (response.status === 403) {
        showToast("Permissão negada para editar produtos", "error");
        return;
      }
      if (response.status === 401) {
        window.location.href = "/";
        return;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      showToast(result.error || "Erro ao atualizar produto", "error");
      return;
    }

    showToast("Produto atualizado com sucesso!", "success");

    // Fechar modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("editProdutoModal"),
    );
    modal.hide();

    // Recarregar tabela
    loadProdutos(currentPage);
  } catch (error) {
    console.error("Erro ao salvar produto:", error);
    showToast(error.message || "Erro ao salvar produto", "error");
  }
}

/**
 * Busca produtos com filtro
 */
function handleBuscaProdutos() {
  const codigo =
    document.getElementById("produtoCodigoFiltro")?.value.trim() || "";
  const nome = document.getElementById("produtoNomeFiltro")?.value.trim() || "";

  currentFiltros = {};
  if (codigo) currentFiltros.codigo = codigo;
  if (nome) currentFiltros.nome = nome;

  loadProdutos(1);
}

/**
 * Limpa filtros
 */
function handleLimparFiltrosProdutos() {
  const codigoInput = document.getElementById("produtoCodigoFiltro");
  const nomeInput = document.getElementById("produtoNomeFiltro");

  if (codigoInput) codigoInput.value = "";
  if (nomeInput) nomeInput.value = "";

  currentFiltros = {};
  loadProdutos(1);
}

/**
 * Escape HTML para prevenir XSS
 * @param {string} text - Texto a escapar
 * @returns {string} Texto escapado
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Renderiza controles de paginação
 * @param {number} currentPage - Página atual
 * @param {number} totalPages - Total de páginas
 * @param {string} callbackFunc - Nome da função a chamar onclick
 * @returns {string} HTML de paginação
 */
function renderPaginacao(
  currentPage,
  totalPages,
  callbackFunc = "loadProdutos",
) {
  if (totalPages <= 1) return "";

  let html = `
    <nav class="mt-4">
      <ul class="pagination justify-content-center">
  `;

  // Botão anterior
  if (currentPage > 1) {
    html += `<li class="page-item"><a class="page-link" href="javascript:${callbackFunc}(${currentPage - 1})">Anterior</a></li>`;
  } else {
    html += `<li class="page-item disabled"><span class="page-link">Anterior</span></li>`;
  }

  // Números das páginas
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    html += `<li class="page-item"><a class="page-link" href="javascript:${callbackFunc}(1)">1</a></li>`;
    if (startPage > 2) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    if (i === currentPage) {
      html += `<li class="page-item active"><span class="page-link">${i}</span></li>`;
    } else {
      html += `<li class="page-item"><a class="page-link" href="javascript:${callbackFunc}(${i})">${i}</a></li>`;
    }
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
    html += `<li class="page-item"><a class="page-link" href="javascript:${callbackFunc}(${totalPages})">${totalPages}</a></li>`;
  }

  // Botão próximo
  if (currentPage < totalPages) {
    html += `<li class="page-item"><a class="page-link" href="javascript:${callbackFunc}(${currentPage + 1})">Próximo</a></li>`;
  } else {
    html += `<li class="page-item disabled"><span class="page-link">Próximo</span></li>`;
  }

  html += `
      </ul>
    </nav>
  `;

  return html;
}

/**
 * Mostra toast (notificação)
 * @param {string} message - Mensagem
 * @param {string} type - Tipo: 'success', 'error', 'warning'
 */
function showToast(message, type = "info") {
  // Se houver toast container Bootstrap, usar isso
  // Senão, usar alert simples
  if (typeof bootstrap !== "undefined") {
    const toastHtml = `
      <div class="toast align-items-center text-white bg-${type === "error" ? "danger" : type === "success" ? "success" : "info"} border-0">
        <div class="d-flex">
          <div class="toast-body">${escapeHtml(message)}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `;

    const toastContainer = document.getElementById("toastContainer");
    if (toastContainer) {
      const toastDiv = document.createElement("div");
      toastDiv.innerHTML = toastHtml;
      toastContainer.appendChild(toastDiv.firstElementChild);

      const toastElement = toastContainer.lastChild;
      const bsToast = new bootstrap.Toast(toastElement);
      bsToast.show();

      // Remover após exibição
      toastElement.addEventListener("hidden.bs.toast", () => {
        toastElement.remove();
      });
    }
  } else {
    alert(message);
  }
}

// Inicializar quando houver permissão
document.addEventListener("DOMContentLoaded", () => {
  const userPerms = window.usuario?.permissions || [];
  const canViewProdutos = userPerms.includes("ver_produtos");

  if (canViewProdutos && document.getElementById("produtosSection")) {
    loadProdutos(1);
  }
});
