/**
 * API Client
 * Wrapper para fetch que adiciona JWT automaticamente
 * Usa JWT do localStorage ou cookies
 */

class ApiClient {
  constructor(baseUrl = "") {
    this.baseUrl = baseUrl || "";
  }

  /**
   * Obtém token JWT (do localStorage ou cookies)
   * @returns {string|null} Token JWT ou null
   */
  getToken() {
    // Tentar localStorage primeiro
    const token = localStorage.getItem("token");
    if (token) return token;

    // Fallback para cookies (httpOnly não é acessível via JS)
    // O cookie será enviado automaticamente pelo navegador
    return null;
  }

  /**
   * Obtém usuário armazenado
   * @returns {object|null} Dados do usuário ou null
   */
  getUser() {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }

  /**
   * Faz requisição HTTP com JWT incluído
   * @param {string} endpoint - Endpoint da API (ex: /api/produtos)
   * @param {object} options - Opções do fetch (method, body, etc)
   * @returns {Promise<object>} Resposta JSON
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Adicionar Authorization header se houver token
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include", // Enviar cookies (httpOnly)
      });

      const data = await response.json();

      // Se não autorizado, limpar localStorage e redirecionar
      if (response.status === 401) {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        window.location.href = "/";
        return null;
      }

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error("Erro na requisição:", error);
      throw error;
    }
  }

  /**
   * GET request
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, {
      method: "GET",
      ...options,
    });
  }

  /**
   * POST request
   */
  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    });
  }

  /**
   * PATCH request
   */
  patch(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...options,
    });
  }

  /**
   * PUT request
   */
  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
    });
  }

  /**
   * DELETE request
   */
  delete(endpoint, options = {}) {
    return this.request(endpoint, {
      method: "DELETE",
      ...options,
    });
  }

  /**
   * Faz logout: limpa dados locais e cookies
   */
  logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    // Ir para login
    window.location.href = "/";
  }

  /**
   * Verifica se usuário está autenticado
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Verifica se usuário tem uma permissão específica
   * @param {string} permission
   * @returns {boolean}
   */
  hasPermission(permission) {
    const user = this.getUser();
    return user && user.permissions && user.permissions.includes(permission);
  }

  /**
   * Verifica se usuário tem uma role específica
   * @param {string|array} roles
   * @returns {boolean}
   */
  hasRole(roles) {
    const user = this.getUser();
    if (!user) return false;

    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  }
}

// Instância global do cliente
const apiClient = new ApiClient();

// Exportar para uso em outros scripts
if (typeof module !== "undefined" && module.exports) {
  module.exports = { ApiClient, apiClient };
}
