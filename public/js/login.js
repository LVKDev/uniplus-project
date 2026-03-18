/**
 * Formulário de Login - UniPlus
 * Script externo para evitar violação de CSP
 */

/**
 * Exibe mensagem de alerta
 * @param {string} message - Mensagem a exibir
 * @param {string} type - 'error' ou 'success'
 */
function showAlert(message, type = "error") {
  const alertBox = document.getElementById("alertBox");
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
  setTimeout(() => {
    alertBox.className = "alert";
  }, 5000);
}

/**
 * Alterna visibilidade do ícone de carregamento
 * @param {boolean} show - true para mostrar, false para esconder
 */
function setLoading(show) {
  const loading = document.getElementById("loading");
  const button = document.getElementById("loginButton");
  if (show) {
    loading.classList.add("active");
    button.disabled = true;
  } else {
    loading.classList.remove("active");
    button.disabled = false;
  }
}

/**
 * Handler de submit do formulário de login
 * @param {Event} event - Evento do submit
 */
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Validações básicas
  if (!email || !password) {
    showAlert("Email e senha são obrigatórios", "error");
    return;
  }

  setLoading(true);

  try {
    // Enviar requisição de login
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      showAlert(data.message || "Erro ao fazer login", "error");
      setLoading(false);
      return;
    }

    // Login bem-sucedido
    showAlert("Login realizado! Redirecionando...", "success");

    // Armazenar dados do usuário
    console.log("💾 Resposta do servidor:", data);
    console.log("💾 Salvando user no localStorage:", JSON.stringify(data.user));
    
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("token", data.token);
    
    // Verificar se foi salvo corretamente
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");
    
    console.log("✅ Verificação após salvar:");
    console.log("   localStorage.user =", savedUser);
    console.log("   localStorage.token =", savedToken ? "✓ (presente)" : "✗ (vazio)");
    
    if (!savedUser || savedUser === "{}") {
      console.error("❌ ERRO CRÍTICO: localStorage.user não foi salvo corretamente!");
      showAlert("Erro ao salvar sessão. Por favor, tente novamente.", "error");
      return;
    }

    // Redirecionar para dashboard após 1.5s
    setTimeout(() => {
      console.log("🔄 Redirecionando para dashboard...");
      window.location.href = "/dashboard.html";
    }, 1500);
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    showAlert("Erro ao conectar com servidor", "error");
    setLoading(false);
  }
}

/**
 * Inicializa a página
 */
document.addEventListener("DOMContentLoaded", () => {
  // Focar no campo de email
  const emailInput = document.getElementById("email");
  if (emailInput) emailInput.focus();

  // Redirecionar se já logado
  const token = localStorage.getItem("token");
  if (token) {
    window.location.href = "/dashboard.html";
  }

  // Attach form listener
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin);
  }
});
