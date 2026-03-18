/**
 * Dashboard - UniPlus
 * Script externo para evitar violação de CSP
 */

function showPanel(panelId) {
  document
    .querySelectorAll(".panel")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-link")
    .forEach((l) => l.classList.remove("active"));
  document.getElementById(panelId).classList.add("active");
  event.target.classList.add("active");
}

function handleLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/";
}

function showAlert(message, type = "error") {
  const alert = document.getElementById("alertBox");
  alert.textContent = message;
  alert.className = `alert show alert-${type}`;
  setTimeout(() => alert.classList.remove("show"), 3000);
}

async function handleSaveUnidade() {
  try {
    const unitId = document.getElementById("unidadeEditId")?.value;
    const nome = document.getElementById("unidadeNome").value;
    const adminEmail = document.getElementById("adminEmail").value;
    const adminSenha = document.getElementById("adminSenha").value;
    const clientId = document.getElementById("uniplusclientId").value;
    const clientSecret = document.getElementById("uniplusclientSecret").value;
    const token = localStorage.getItem("token");

    // Validações
    if (!nome.trim()) {
      showAlert("Nome da unidade é obrigatório");
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      showAlert("Email do admin inválido");
      return;
    }

    // Validar senha (8+ chars, maiúscula, minúscula, número)
    const senhaRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!senhaRegex.test(adminSenha)) {
      showAlert("Senha deve ter 8+ caracteres, maiúscula, minúscula e número");
      return;
    }

    // Validar credenciais Uniplus
    if (!clientId.trim() || !clientSecret.trim()) {
      showAlert("CLIENT_ID e CLIENT_SECRET são obrigatórios");
      return;
    }

    // Se editando (apenas nome e credenciais)
    if (unitId && unitId !== "") {
      const resp = await fetch(`/api/unidades/${unitId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: nome || undefined,
          uniplus_client_id: clientId || undefined,
          uniplus_client_secret: clientSecret || undefined,
        }),
      });

      if (resp.ok) {
        showAlert("Unidade atualizada com sucesso!", "success");
        document.getElementById("unidadeForm").reset();
        document.getElementById("unidadeEditId").value = "";
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("unidadeModal"),
        );
        if (modal) modal.hide();
        loadUnidades();
      } else {
        const error = await resp.json();
        showAlert(error.message || "Erro ao atualizar unidade");
      }
    } else {
      // Criando nova unidade + admin
      const resp = await fetch("/api/unidades", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome,
          admin_email: adminEmail,
          admin_senha: adminSenha,
          uniplus_client_id: clientId,
          uniplus_client_secret: clientSecret,
        }),
      });

      if (resp.ok) {
        showAlert("Unidade e admin criados com sucesso!", "success");
        document.getElementById("unidadeForm").reset();
        const modal = bootstrap.Modal.getInstance(
          document.getElementById("unidadeModal"),
        );
        if (modal) modal.hide();
        loadUnidades();
      } else {
        const error = await resp.json();
        showAlert(error.message || "Erro ao criar unidade");
      }
    }
  } catch (e) {
    showAlert("Erro: " + e.message);
  }
}

async function handleSaveUsuario() {
  try {
    const email = document.getElementById("usuarioEmail").value;
    const senha = document.getElementById("usuarioPass").value;
    const role = document.getElementById("usuarioRole").value;

    const resp = await fetch("/api/usuarios", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ email, senha, role, permissions: [] }),
    });

    if (resp.ok) {
      showAlert("Usuário criado com sucesso!", "success");
      document.getElementById("usuarioForm").reset();
      const modal = bootstrap.Modal.getInstance(
        document.getElementById("usuarioModal"),
      );
      if (modal) modal.hide();
      loadUsuarios();
    } else {
      showAlert("Erro ao criar usuário");
    }
  } catch (e) {
    showAlert("Erro: " + e.message);
  }
}

async function loadUnidades() {
  try {
    const token = localStorage.getItem("token");
    console.log("Token:", token ? "Presente" : "Vazio");
    
    const resp = await fetch("/api/unidades", {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });
    
    console.log("Response status:", resp.status);
    
    if (resp.status === 403) {
      document.getElementById("unidadesList").innerHTML = '<div class="empty-state">❌ Acesso negado. Faça login novamente.</div>';
      return;
    }
    
    const response = await resp.json();
    console.log("Unidades response:", response);
    
    const unidades = response.data || [];
    document.getElementById("unidadesList").innerHTML = unidades && unidades.length > 0
      ? `<table class="table table-striped"><thead><tr><th>Nome</th><th>Usuários</th><th>Criada em</th><th>Ações</th></tr></thead><tbody>${unidades.map((u) => `<tr><td>${u.nome}</td><td>${u.usuarios_count || 0}</td><td>${new Date(u.created_at).toLocaleDateString('pt-BR')}</td><td><button class="btn btn-sm btn-outline-primary me-2 edit-unidade-btn" data-unit-id="${u.id}" title="Editar">✏️ Editar</button><button class="btn btn-sm btn-outline-danger delete-unidade-btn" data-unit-id="${u.id}" title="Deletar">🗑️ Deletar</button></td></tr>`).join("")}</tbody></table>`
      : '<div class="empty-state">Nenhuma unidade encontrada</div>';
    
    // Adicionar event listeners aos botões
    attachUnidadeButtonListeners();
  } catch (e) {
    console.error("Erro ao carregar unidades:", e);
    document.getElementById("unidadesList").innerHTML =
      '<div class="empty-state">❌ Erro ao carregar: ' + e.message + '</div>';
  }
}

function attachUnidadeButtonListeners() {
  // Event listeners para botões de editar
  document.querySelectorAll(".edit-unidade-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const unitId = btn.dataset.unitId;
      handleEditUnidade(unitId);
    });
  });
  
  // Event listeners para botões de deletar
  document.querySelectorAll(".delete-unidade-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const unitId = btn.dataset.unitId;
      handleDeleteUnidade(unitId);
    });
  });
}

async function handleEditUnidade(unitId) {
  try {
    const token = localStorage.getItem("token");
    
    // Buscar dados da unidade
    const resp = await fetch(`/api/unidades/${unitId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!resp.ok) {
      showAlert("Erro ao carregar dados da unidade");
      return;
    }
    
    const { data: unidade } = await resp.json();
    
    // Preencher formulário modal com dados
    document.getElementById("unidadeNome").value = unidade.nome;
    document.getElementById("unidadeUser").value = ""; // Não retorna credenciais por segurança
    document.getElementById("unidadePass").value = "";
    document.getElementById("unidadeEditId").value = unitId;
    
    // Mudar botão de salvar para "Atualizar"
    const saveBtn = document.getElementById("saveUnidadeBtn");
    saveBtn.textContent = "Atualizar Unidade";
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById("unidadeModal"));
    modal.show();
  } catch (e) {
    showAlert("Erro: " + e.message);
  }
}

async function handleDeleteUnidade(unitId) {
  if (!confirm("Tem certeza que deseja deletar esta unidade? Esta ação não pode ser desfeita.")) {
    return;
  }
  
  try {
    const token = localStorage.getItem("token");
    
    const resp = await fetch(`/api/unidades/${unitId}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    
    if (resp.ok) {
      showAlert("Unidade deletada com sucesso!", "success");
      loadUnidades();
    } else {
      const error = await resp.json();
      showAlert(error.message || "Erro ao deletar unidade");
    }
  } catch (e) {
    showAlert("Erro: " + e.message);
  }
}

async function loadUsuarios() {
  try {
    const token = localStorage.getItem("token");
    console.log("Token para usuarios:", token ? "Presente" : "Vazio");
    
    const resp = await fetch("/api/usuarios", {
      method: "GET",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
    });
    
    console.log("Response status usuarios:", resp.status);
    
    if (resp.status === 403) {
      document.getElementById("usuariosList").innerHTML = '<div class="empty-state">❌ Acesso negado.</div>';
      return;
    }
    
    const data = await resp.json();
    console.log("Usuarios data:", data);
    
    document.getElementById("usuariosList").innerHTML = data && data.data && data.data.length
      ? `<table><thead><tr><th>Email</th><th>Role</th></tr></thead><tbody>${data.data.map((u) => `<tr><td>${u.email}</td><td>${u.role}</td></tr>`).join("")}</tbody></table>`
      : '<div class="empty-state">Nenhum usuário encontrado</div>';
  } catch (e) {
    console.error("Erro ao carregar usuarios:", e);
    document.getElementById("usuariosList").innerHTML =
      '<div class="empty-state">❌ Erro ao carregar: ' + e.message + '</div>';
  }
}

// Inicializa ao carregar a página
window.addEventListener("load", () => {
  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "/";
    return;
  }

  const userinf = JSON.parse(localStorage.getItem("user") || "{}");
  
  console.log("📋 Usuário carregado do localStorage:", userinf);
  
  const userEmailEl = document.getElementById("userEmail");
  const roleBadgeEl = document.getElementById("roleBadge");
  
  if (!userinf.email) {
    console.error("❌ ERRO: Email do usuário não encontrado no localStorage!");
    console.log("localStorage.user:", localStorage.getItem("user"));
  }
  
  userEmailEl.textContent = userinf.email || "user@example.com";
  roleBadgeEl.textContent = (userinf.role || "—").toUpperCase();

  // Mostrar itens de menu baseado no role
  document.querySelectorAll(".nav-item").forEach((item) => {
    const roles = item.dataset.role.split(",");
    item.classList.toggle("show", roles.includes(userinf.role));
  });

  // Determinar painel padrão baseado no role
  let defaultPanel = "unidades"; // padrão para SUPER_ADMIN
  if (userinf.role === "ADMIN_UNIDADE") {
    defaultPanel = "usuarios";
  } else if (userinf.role === "FUNCIONARIO") {
    defaultPanel = "produtos";
  } else if (userinf.role === "superadmin") {
    defaultPanel = "unidades";
  }

  // Ativar painel padrão
  const defaultPanelEl = document.getElementById(defaultPanel);
  if (defaultPanelEl) {
    defaultPanelEl.classList.add("active");
    // Marcar o link correspondente como ativo
    const activeLink = document.querySelector(`[data-panel="${defaultPanel}"]`);
    if (activeLink) {
      activeLink.classList.add("active");
    }
  }

  // Carregar dados
  loadUnidades();
  loadUsuarios();

  // Adicionar listeners aos botões usando IDs
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  const saveUnidadeBtn = document.getElementById("saveUnidadeBtn");
  if (saveUnidadeBtn) {
    saveUnidadeBtn.addEventListener("click", handleSaveUnidade);
  }

  const saveUsuarioBtn = document.getElementById("saveUsuarioBtn");
  if (saveUsuarioBtn) {
    saveUsuarioBtn.addEventListener("click", handleSaveUsuario);
  }

  // Adicionar listeners aos links de menu (data-panel)
  document.querySelectorAll(".nav-link[data-panel]").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const panelId = this.dataset.panel;
      if (panelId) {
        document
          .querySelectorAll(".panel")
          .forEach((p) => p.classList.remove("active"));
        document
          .querySelectorAll(".nav-link")
          .forEach((l) => l.classList.remove("active"));
        const panel = document.getElementById(panelId);
        if (panel) {
          panel.classList.add("active");
          this.classList.add("active");
        }
      }
    });
  });

  // Adicionar listeners aos links de menu (data-panel)
  document.querySelectorAll(".nav-link[data-panel]").forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const panelId = this.dataset.panel;
      if (panelId) {
        document
          .querySelectorAll(".panel")
          .forEach((p) => p.classList.remove("active"));
        document
          .querySelectorAll(".nav-link")
          .forEach((l) => l.classList.remove("active"));
        document.getElementById(panelId).classList.add("active");
        this.classList.add("active");

        // Carregar dados do painel
        if (panelId === "unidades") loadUnidades();
        if (panelId === "usuarios") loadUsuarios();
      }
    });
  });

  // Event listener para resetar modal de unidade quando abre (para nova unidade)
  const unidadeModal = document.getElementById("unidadeModal");
  if (unidadeModal) {
    unidadeModal.addEventListener("show.bs.modal", function (e) {
      // Se é um clique do botão "+ Nova Unidade", resetar o formulário
      const button = e.relatedTarget;
      if (button && button.id !== "edit-unidade-btn" && !button.classList.contains("edit-unidade-btn")) {
        document.getElementById("unidadeForm").reset();
        document.getElementById("unidadeEditId").value = "";
        document.getElementById("unidadeModalLabel").textContent = "Nova Unidade";
        document.getElementById("saveUnidadeBtn").textContent = "Criar Unidade";
        
        // Resetar campos específicos
        document.getElementById("adminEmail").value = "";
        document.getElementById("adminSenha").value = "";
        document.getElementById("uniplusclientId").value = "";
        document.getElementById("uniplusclientSecret").value = "";
      }
    });
  }
});
