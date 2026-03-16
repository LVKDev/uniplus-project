/**
 * Gerenciamento de Usuários (Frontend)
 * Script para criar, editar, deletar usuários e gerenciar permissões
 */

let currentEditUserId = null;

// ============================================
// Modal Controller
// ============================================

/**
 * Abre modal de criar usuário
 */
function openCreateUserModal() {
  document.getElementById("createUserModal").classList.add("active");
  document.getElementById("createUserForm").reset();
  resetPermissionsCheckboxes("createUserForm");
}

/**
 * Fecha modal de criar usuário
 */
function closeCreateUserModal() {
  document.getElementById("createUserModal").classList.remove("active");
}

/**
 * Abre modal de editar usuário
 */
function openEditUserModal(userId, email, role) {
  currentEditUserId = userId;
  document.getElementById("editUserModal").classList.add("active");
  document.getElementById("editUserEmail").value = email;
  document.getElementById("editUserRole").value = role;

  // Carregar permissões atuais
  loadUserPermissions(userId);
}

/**
 * Fecha modal de editar permissões
 */
function closeEditUserModal() {
  document.getElementById("editUserModal").classList.remove("active");
  currentEditUserId = null;
}

// ============================================
// Form Handlers
// ============================================

/**
 * Submete formulário de criar usuário
 */
async function handleCreateUserSubmit(event) {
  event.preventDefault();

  const email = document.getElementById("createUserEmail").value.trim();
  const password = document.getElementById("createUserPassword").value;
  const role = document.getElementById("createUserRole").value;
  const permissions = getSelectedPermissions("createUserForm");

  if (!email || !password || !role) {
    showAlert("Email, senha e role são obrigatórios", "error");
    return;
  }

  const submitBtn = event.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    const response = await apiClient.post("/api/usuarios", {
      email,
      password,
      role,
      permissions,
    });

    if (!response.success) {
      throw new Error(response.error || "Erro ao criar usuário");
    }

    showAlert("Usuário criado com sucesso!", "success");
    closeCreateUserModal();
    loadUsuarios();
  } catch (error) {
    console.error("Erro:", error);
    showAlert(error.message, "error");
  } finally {
    submitBtn.disabled = false;
  }
}

/**
 * Submete formulário de editar usuário
 */
async function handleEditUserSubmit(event) {
  event.preventDefault();

  const email = document.getElementById("editUserEmail").value.trim();
  const role = document.getElementById("editUserRole").value;
  const permissions = getSelectedPermissions("editUserForm");

  if (!email || !role) {
    showAlert("Email e role são obrigatórios", "error");
    return;
  }

  const submitBtn = event.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;

  try {
    // Atualizar informações básicas
    await apiClient.patch(`/api/usuarios/${currentEditUserId}`, {
      email,
      role,
    });

    // Atualizar permissões
    await apiClient.patch(`/api/usuarios/${currentEditUserId}/permissions`, {
      permissions,
    });

    showAlert("Usuário atualizado com sucesso!", "success");
    closeEditUserModal();
    loadUsuarios();
  } catch (error) {
    console.error("Erro:", error);
    showAlert(error.message, "error");
  } finally {
    submitBtn.disabled = false;
  }
}

// ============================================
// CRUD Operations
// ============================================

/**
 * Deleta um usuário
 */
async function deleteUsuario(userId) {
  if (!confirm("Tem certeza que deseja deletar este usuário?")) {
    return;
  }

  try {
    const response = await apiClient.delete(`/api/usuarios/${userId}`);

    if (!response.success) {
      throw new Error(response.error || "Erro ao deletar usuário");
    }

    showAlert("Usuário deletado com sucesso!", "success");
    loadUsuarios();
  } catch (error) {
    console.error("Erro:", error);
    showAlert(error.message, "error");
  }
}

/**
 * Carrega lista de usuários
 */
async function loadUsuarios() {
  const usuariosList = document.getElementById("usuariosList");
  usuariosList.innerHTML =
    '<div class="loading"><span class="spinner"></span>Carregando usuários...</div>';

  try {
    const response = await apiClient.get("/api/usuarios");

    if (!response.success || !response.data) {
      throw new Error(response.error || "Erro ao carregar usuários");
    }

    if (response.data.length === 0) {
      usuariosList.innerHTML = `
        <div class="empty-state">
          <p>Nenhum usuário criado ainda</p>
          <button class="btn btn-primary" onclick="openCreateUserModal()" style="margin-top: 15px;">
            Criar Primeiro Usuário
          </button>
        </div>
      `;
      return;
    }

    // Renderizar tabela
    let html = '<div class="table-responsive"><table>';
    html += "<thead><tr>";
    html += "<th>Email</th>";
    html += "<th>Role</th>";
    html += "<th>Permissões</th>";
    html += "<th>Status</th>";
    html += '<th style="text-align: center">Ações</th>';
    html += "</tr></thead><tbody>";

    response.data.forEach((user) => {
      const status = user.is_active ? "Ativo" : "Inativo";
      const statusClass = user.is_active ? "badge-success" : "badge-danger";
      const permsCount = user.permissions ? user.permissions.length : 0;

      html += `<tr>`;
      html += `<td><strong>${escapeHtml(user.email)}</strong></td>`;
      html += `<td>${escapeHtml(user.role)}</td>`;
      html += `<td><span class="badge">${permsCount} permissões</span></td>`;
      html += `<td><span class="badge ${statusClass}">${status}</span></td>`;
      html += `<td style="text-align: center">`;
      html += `<button class="btn btn-secondary" onclick="openEditUserModal('${user.id}', '${escapeHtml(user.email)}', '${user.role}')" style="margin-right: 5px; padding: 6px 12px; font-size: 12px;">Editar</button>`;
      html += `<button class="btn btn-danger" onclick="deleteUsuario('${user.id}')" style="padding: 6px 12px; font-size: 12px;">Deletar</button>`;
      html += `</td>`;
      html += `</tr>`;
    });

    html += "</tbody></table></div>";
    usuariosList.innerHTML = html;
  } catch (error) {
    console.error("Erro:", error);
    usuariosList.innerHTML = `<div class="alert error">${escapeHtml(error.message)}</div>`;
  }
}

/**
 * Carrega permissões de um usuário
 */
async function loadUserPermissions(userId) {
  try {
    const response = await apiClient.get(`/api/usuarios/${userId}`);

    if (!response.success) {
      throw new Error("Erro ao carregar permissões");
    }

    const userPermissions = response.data.permissions || [];

    // Atualizar checkboxes
    const checkboxes = document.querySelectorAll(
      "#editUserForm input[type='checkbox']",
    );
    checkboxes.forEach((checkbox) => {
      checkbox.checked = userPermissions.includes(checkbox.value);
    });
  } catch (error) {
    console.error("Erro ao carregar permissões:", error);
  }
}

// ============================================
// Utility Functions
// ============================================

/**
 * Obtém permissões selecionadas de um formulário
 */
function getSelectedPermissions(formId) {
  const form = document.getElementById(formId);
  const checkboxes = form.querySelectorAll("input[type='checkbox']:checked");
  return Array.from(checkboxes).map((cb) => cb.value);
}

/**
 * Reseta checkboxes de permissões
 */
function resetPermissionsCheckboxes(formId) {
  const form = document.getElementById(formId);
  const checkboxes = form.querySelectorAll("input[type='checkbox']");
  checkboxes.forEach((cb) => {
    cb.checked = false;
  });
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
  const createModal = document.getElementById("createUserModal");
  const editModal = document.getElementById("editUserModal");

  if (e.target === createModal) {
    closeCreateUserModal();
  }
  if (e.target === editModal) {
    closeEditUserModal();
  }
});
