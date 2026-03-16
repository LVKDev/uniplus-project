/**
 * Controller de Clientes - Frontend
 * Gerencialistagem, edição e salvamento de clientes
 * SPRINT 4
 */

// Estado global
let currentPageClientes = 1;
let currentLimitClientes = 25;
let currentFiltrosClientes = {};

/**
 * Carrega lista de clientes com paginação
 * @param {number} page - Número da página (1-indexed)
 */
async function loadClientes(page = 1) {
  try {
    currentPageClientes = page || 1;

    // Mostrar loader
    const tableContainer = document.getElementById("clientesTableContainer");
    if (tableContainer) {
      tableContainer.innerHTML =
        '<div class="loader">Carregando clientes...</div>';
    }

    // Montar query params
    const offset = (currentPageClientes - 1) * currentLimitClientes;
    const params = new URLSearchParams({
      limit: currentLimitClientes,
      offset: offset,
      ...currentFiltrosClientes,
    });

    // Requisição
    const response = await fetch(`/api/clientes?${params.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      if (response.status === 403) {
        showToast("Permissão negada para visualizar clientes", "error");
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
      showToast(result.error || "Erro ao carregar clientes", "error");
      return;
    }

    // Renderizar tabela
    renderClientesTable(result.data, result.pagination);
  } catch (error) {
    console.error("Erro ao carregar clientes:", error);
    showToast(error.message || "Erro ao carregar clientes", "error");
  }
}

/**
 * Renderiza tabela de clientes
 * @param {array} clientes - Lista de clientes
 * @param {object} pagination - Info de paginação
 */
function renderClientesTable(clientes, pagination = {}) {
  const tableContainer = document.getElementById("clientesTableContainer");

  if (!tableContainer) {
    console.warn("Container #clientesTableContainer não encontrado");
    return;
  }

  if (!clientes || clientes.length === 0) {
    tableContainer.innerHTML =
      '<p class="text-center">Nenhum cliente encontrado</p>';
    return;
  }

  // Verificar permissão para editar
  const userPerms = window.usuario?.permissions || [];
  const canEdit = userPerms.includes("editar_clientes");

  // Montar HTML da tabela
  let html = `
    <table class="table table-striped table-hover">
      <thead>
        <tr>
          <th>Código</th>
          <th>Nome</th>
          <th>CNPJ/CPF</th>
          <th>Telefone</th>
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
  for (const cliente of clientes) {
    const codigo = escapeHtml(String(cliente.codigo || ""));
    const nome = escapeHtml(String(cliente.nome || ""));
    const cnpjCpf = escapeHtml(
      String(cliente.cnpjCpf || cliente.cpfCnpj || "—"),
    );
    const telefone = escapeHtml(String(cliente.telefone || "—"));

    html += `
      <tr data-codigo="${codigo}">
        <td><strong>${codigo}</strong></td>
        <td>${nome}</td>
        <td>${cnpjCpf}</td>
        <td>${telefone}</td>
    `;

    if (canEdit) {
      html += `
        <td>
          <button class="btn btn-sm btn-primary" onclick="openEditClienteModal('${codigo}')">
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
    const totalPages = Math.ceil(pagination.total / currentLimitClientes);
    html += renderPaginacaoClientes(
      currentPageClientes,
      totalPages,
      "loadClientes",
    );
  }

  tableContainer.innerHTML = html;
}

/**
 * Abre modal para editar cliente
 * @param {string} codigoCliente - Código do cliente
 */
async function openEditClienteModal(codigoCliente) {
  try {
    // Buscar cliente
    const response = await fetch(`/api/clientes/${codigoCliente}`, {
      method: "GET",
    });

    if (!response.ok) {
      showToast("Erro ao carregar cliente", "error");
      return;
    }

    const result = await response.json();
    const cliente = result.data;

    // Preencher modal
    const modal = document.getElementById("editClienteModal");
    if (!modal) {
      console.warn("Modal #editClienteModal não encontrado");
      return;
    }

    // Preencher campos
    document.getElementById("editClienteCodigoLabel").textContent =
      `Editando Cliente: ${escapeHtml(String(codigoCliente))}`;
    document.getElementById("editClienteNome").value = cliente.nome || "";
    document.getElementById("editClienteEndereco").value =
      cliente.endereco || "";
    document.getElementById("editClienteTelefone").value =
      cliente.telefone || "";
    document.getElementById("editClienteEmail").value = cliente.email || "";
    document.getElementById("editClienteCidade").value = cliente.cidade || "";
    document.getElementById("editClienteEstado").value = cliente.estado || "";

    // Guardar código no form
    document.getElementById("editClienteForm").dataset.codigo = codigoCliente;

    // Mostrar modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
  } catch (error) {
    console.error("Erro ao abrir modal:", error);
    showToast(error.message || "Erro ao abrir modal", "error");
  }
}

/**
 * Salva cliente editado
 * @param {event} event - Evento do formulário
 */
async function handleEditClienteSubmit(event) {
  event.preventDefault();

  try {
    const codigoCliente =
      document.getElementById("editClienteForm").dataset.codigo;

    if (!codigoCliente) {
      showToast("Código do cliente não informado", "error");
      return;
    }

    const nome = document.getElementById("editClienteNome").value.trim();
    const endereco = document
      .getElementById("editClienteEndereco")
      .value.trim();
    const telefone = document
      .getElementById("editClienteTelefone")
      .value.trim();
    const email = document.getElementById("editClienteEmail").value.trim();
    const cidade = document.getElementById("editClienteCidade").value.trim();
    const estado = document.getElementById("editClienteEstado").value.trim();

    // Validação
    if (!nome) {
      showToast("Nome do cliente é obrigatório", "error");
      return;
    }

    // Montar payload
    const dados = { nome };
    if (endereco) dados.endereco = endereco;
    if (telefone) dados.telefone = telefone;
    if (email) dados.email = email;
    if (cidade) dados.cidade = cidade;
    if (estado) dados.estado = estado;

    // Requisição
    const response = await fetch(`/api/clientes/${codigoCliente}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    if (!response.ok) {
      if (response.status === 403) {
        showToast("Permissão negada para editar clientes", "error");
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
      showToast(result.error || "Erro ao atualizar cliente", "error");
      return;
    }

    showToast("Cliente atualizado com sucesso!", "success");

    // Fechar modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("editClienteModal"),
    );
    modal.hide();

    // Recarregar tabela
    loadClientes(currentPageClientes);
  } catch (error) {
    console.error("Erro ao salvar cliente:", error);
    showToast(error.message || "Erro ao salvar cliente", "error");
  }
}

/**
 * Busca clientes com filtro
 */
function handleBuscaClientes() {
  const codigo =
    document.getElementById("clienteCodigoFiltro")?.value.trim() || "";
  const nome = document.getElementById("clienteNomeFiltro")?.value.trim() || "";
  const cnpjCpf =
    document.getElementById("clienteCNPJFiltro")?.value.trim() || "";

  currentFiltrosClientes = {};
  if (codigo) currentFiltrosClientes.codigo = codigo;
  if (nome) currentFiltrosClientes.nome = nome;
  if (cnpjCpf) currentFiltrosClientes.cnpjCpf = cnpjCpf;

  loadClientes(1);
}

/**
 * Limpa filtros
 */
function handleLimparFiltrosClientes() {
  const codigoInput = document.getElementById("clienteCodigoFiltro");
  const nomeInput = document.getElementById("clienteNomeFiltro");
  const cnpjInput = document.getElementById("clienteCNPJFiltro");

  if (codigoInput) codigoInput.value = "";
  if (nomeInput) nomeInput.value = "";
  if (cnpjInput) cnpjInput.value = "";

  currentFiltrosClientes = {};
  loadClientes(1);
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
 * Renderiza controles de paginação para clientes
 * @param {number} currentPage - Página atual
 * @param {number} totalPages - Total de páginas
 * @param {string} callbackFunc - Nome da função a chamar
 * @returns {string} HTML de paginação
 */
function renderPaginacaoClientes(
  currentPage,
  totalPages,
  callbackFunc = "loadClientes",
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
  const canViewClientes = userPerms.includes("ver_clientes");

  if (canViewClientes && document.getElementById("clientesSection")) {
    loadClientes(1);
  }
});
