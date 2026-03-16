/**
 * Gerenciamento de Unidades (Frontend)
 * Script para criar, editar e deletar unidades
 */

let currentEditUnitId = null;

/**
 * Abre modal de criar unidade
 */
function openCreateModal() {
  document.getElementById("createModal").classList.add("active");
  document.getElementById("createForm").reset();
}

/**
 * Fecha modal de criar unidade
 */
function closeCreateModal() {
  document.getElementById("createModal").classList.remove("active");
}

/**
 * Abre modal de editar credenciais
 */
function openEditModal(unitId, unitName) {
  currentEditUnitId = unitId;
  document.getElementById("editNodeName").textContent = unitName;
  document.getElementById("editUser").value = "";
  document.getElementById("editPass").value = "";
  document.getElementById("editModal").classList.add("active");
}

/**
 * Fecha modal de editar credenciais
 */
function closeEditModal() {
  document.getElementById("editModal").classList.remove("active");
  currentEditUnitId = null;
}

/**
 * Submete formulário de criar unidade
 */
async function handleCreateSubmit(event) {
  event.preventDefault();

  const nome = document.getElementById("nodeName").value.trim();
  const user = document.getElementById("nodeUser").value.trim();
  const pass = document.getElementById("nodePass").value;

  if (!nome || !user || !pass) {
    showAlert("Todos os campos são obrigatórios", "error");
    return;
  }

  const createBtn = event.target.querySelector('button[type="submit"]');
  createBtn.disabled = true;

  try {
    const response = await apiClient.post("/api/unidades", {
      nome,
      credencial_uniplus_user: user,
      credencial_uniplus_pass: pass,
    });

    if (!response.success) {
      throw new Error(response.error || "Erro ao criar unidade");
    }

    showAlert("Unidade criada com sucesso!", "success");
    closeCreateModal();
    loadUnidades();
  } catch (error) {
    console.error("Erro:", error);
    showAlert(error.message, "error");
  } finally {
    createBtn.disabled = false;
  }
}

/**
 * Submete formulário de editar credenciais
 */
async function handleEditSubmit(event) {
  event.preventDefault();

  const user = document.getElementById("editUser").value.trim();
  const pass = document.getElementById("editPass").value;

  if (!user || !pass) {
    showAlert("Username e password são obrigatórios", "error");
    return;
  }

  const editBtn = event.target.querySelector('button[type="submit"]');
  editBtn.disabled = true;

  try {
    const response = await apiClient.put(`/api/unidades/${currentEditUnitId}`, {
      credencial_uniplus_user: user,
      credencial_uniplus_pass: pass,
    });

    if (!response.success) {
      throw new Error(response.error || "Erro ao atualizar unidade");
    }

    showAlert("Credenciais atualizadas com sucesso!", "success");
    closeEditModal();
    loadUnidades();
  } catch (error) {
    console.error("Erro:", error);
    showAlert(error.message, "error");
  } finally {
    editBtn.disabled = false;
  }
}

/**
 * Deleta uma unidade
 */
async function deleteUnidade(unitId) {
  if (
    !confirm(
      "Tem certeza que deseja deletar esta unidade?\n\nEsta ação não pode ser desfeita.",
    )
  ) {
    return;
  }

  try {
    const response = await apiClient.delete(`/api/unidades/${unitId}`);

    if (!response.success) {
      throw new Error(response.error || "Erro ao deletar unidade");
    }

    showAlert("Unidade deletada com sucesso!", "success");
    loadUnidades();
  } catch (error) {
    console.error("Erro:", error);
    showAlert(error.message, "error");
  }
}

/**
 * Carrega a lista de unidades e renderiza tabela
 */
async function loadUnidades() {
  const unidadesList = document.getElementById("unidadesList");
  unidadesList.innerHTML =
    '<div class="loading"><span class="spinner"></span>Carregando unidades...</div>';

  try {
    const response = await apiClient.get("/api/unidades");

    if (!response.success || !response.data) {
      throw new Error(response.error || "Erro ao carregar unidades");
    }

    if (response.data.length === 0) {
      unidadesList.innerHTML = `
        <div class="empty-state">
          <p>Nenhuma unidade criada ainda</p>
          <button class="btn btn-primary" onclick="openCreateModal()" style="margin-top: 15px;">
            Criar Primeira Unidade
          </button>
        </div>
      `;
      return;
    }

    // Renderizar tabela
    let html = '<div class="table-responsive"><table>';
    html += "<thead><tr>";
    html += "<th>Nome</th>";
    html += '<th style="text-align: center">Usuários</th>';
    html += "<th>Criada em</th>";
    html += '<th style="text-align: center">Ações</th>';
    html += "</tr></thead><tbody>";

    response.data.forEach((unit) => {
      const createdDate = new Date(unit.created_at).toLocaleDateString("pt-BR");
      html += `<tr>`;
      html += `<td><strong>${escapeHtml(unit.nome)}</strong></td>`;
      html += `<td style="text-align: center">${unit.usuarios_count || 0}</td>`;
      html += `<td>${createdDate}</td>`;
      html += `<td style="text-align: center">`;
      html += `<button class="btn btn-secondary" onclick="openEditModal('${unit.id}', '${escapeHtml(unit.nome)}')" style="margin-right: 5px;">Editar</button>`;
      html += `<button class="btn btn-danger" onclick="deleteUnidade('${unit.id}')">Deletar</button>`;
      html += `</td>`;
      html += `</tr>`;
    });

    html += "</tbody></table></div>";
    unidadesList.innerHTML = html;
  } catch (error) {
    console.error("Erro:", error);
    unidadesList.innerHTML = `<div class="alert error">${escapeHtml(error.message)}</div>`;
  }
}

/**
 * Escape HTML para segurança (XSS prevention)
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Fechar modais ao clicar fora
document.addEventListener("click", (e) => {
  const createModal = document.getElementById("createModal");
  const editModal = document.getElementById("editModal");

  if (e.target === createModal) {
    closeCreateModal();
  }
  if (e.target === editModal) {
    closeEditModal();
  }
});
