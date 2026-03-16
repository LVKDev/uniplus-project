/**
 * Encriptação de Credenciais Uniplus
 * Usa AES-256-GCM para encriptar/decriptar credenciais sensíveis
 *
 * IMPORTANTE: A chave de encriptação DEVE estar em .env como ENCRYPTION_KEY
 * Se não estiver, gere com: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

const crypto = require("crypto");

// Chave de encriptação (deve estar em .env)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Validar se chave está definida
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 64) {
  console.error(
    "❌ ERRO: ENCRYPTION_KEY não está definida ou tem comprimento errado",
  );
  console.error(
    "   Gere uma chave: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
  );
  console.error("   E adicione a .env: ENCRYPTION_KEY=seu-valor-aqui");
  process.exit(1);
}

// Converter hex string para Buffer
const keyBuffer = Buffer.from(ENCRYPTION_KEY, "hex");

/**
 * Encripta um valor usando AES-256-GCM
 * @param {string} plaintext - Texto a encriptar
 * @returns {string} Format: iv:authTag:encryptedData (em base64)
 */
function encrypt(plaintext) {
  if (!plaintext) return null;

  try {
    // Gerar IV (Initialization Vector) aleatório
    const iv = crypto.randomBytes(16);

    // Criar cipher
    const cipher = crypto.createCipheriv("aes-256-gcm", keyBuffer, iv);

    // Encriptar
    const encrypted = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);

    // Obter auth tag
    const authTag = cipher.getAuthTag();

    // Retornar: iv:authTag:encrypted (em base64 para fácil armazenamento)
    const combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString("base64");
  } catch (error) {
    console.error("Erro ao encriptar:", error);
    throw new Error("Falha ao encriptar credenciais");
  }
}

/**
 * Decripta um valor encriptado com AES-256-GCM
 * @param {string} ciphertext - Texto encriptado em base64
 * @returns {string} Texto original em plaintext
 */
function decrypt(ciphertext) {
  if (!ciphertext) return null;

  try {
    // Converter de base64
    const combined = Buffer.from(ciphertext, "base64");

    // Extrair partes
    const iv = combined.slice(0, 16);
    const authTag = combined.slice(16, 32);
    const encrypted = combined.slice(32);

    // Criar decipher
    const decipher = crypto.createDecipheriv("aes-256-gcm", keyBuffer, iv);
    decipher.setAuthTag(authTag);

    // Decriptar
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Erro ao decriptar:", error);
    throw new Error(
      "Falha ao decriptar credenciais (chave inválida ou dados corrompidos)",
    );
  }
}

/**
 * Encripta credenciais Uniplus completas (JSON)
 * Armazena TODOS os dados de uma unidade Uniplus em um único campo encriptado
 * @param {object} credenciais - Objeto com todos os dados Uniplus
 * @returns {string} JSON encriptado em base64
 *
 * Exemplo de entrada:
 * {
 *   base_url: "https://next-01.webuniplus.com/public-api",
 *   server_url: "https://next-01.webuniplus.com",
 *   client_id: "homologacao",
 *   client_secret: "a50037cd-92f5-4bfd-8d52-f81cb5e6a08e",
 *   token: "",
 *   auth_basic: "Z2FsZWdvYWd1YWVnYXM6YjdkZTA0ODItYzhmOS00MGQxLWFhM2EtZjQ3ZjZlODEwYzIy",
 *   tenant: "galegoaguaegas",
 *   access_key: "b7de0482-c8f9-40d1-aa3a-f47f6e810c22",
 *   limit: 100
 * }
 */
function encryptCredentialsJSON(credenciais) {
  if (!credenciais || typeof credenciais !== "object") {
    throw new Error("Credenciais devem ser um objeto");
  }

  // Converter objeto para JSON string
  const jsonString = JSON.stringify(credenciais);

  // Encriptar o JSON
  return encrypt(jsonString);
}

/**
 * Decripta credenciais Uniplus completas (JSON)
 * @param {string} encryptedJSON - JSON encriptado em base64
 * @returns {object} Objeto com todos os dados Uniplus
 */
function decryptCredentialsJSON(encryptedJSON) {
  if (!encryptedJSON) {
    return null;
  }

  try {
    const jsonString = decrypt(encryptedJSON);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Erro ao decriptar JSON de credenciais:", error);
    throw new Error("Falha ao decriptar credenciais (dados corrompidos)");
  }
}

/**
 * Encripta credenciais Uniplus (username + password) - LEGACY
 * @param {string} username - Username Uniplus
 * @param {string} password - Password Uniplus
 * @returns {object} {user_encrypted, pass_encrypted}
 */
function encryptCredentials(username, password) {
  if (!username || !password) {
    throw new Error("Username e password são obrigatórios");
  }

  return {
    user_encrypted: encrypt(username),
    pass_encrypted: encrypt(password),
  };
}

/**
 * Decripta credenciais Uniplus - LEGACY
 * @param {string} userEncrypted - Username encriptado
 * @param {string} passEncrypted - Password encriptado
 * @returns {object} {username, password}
 */
function decryptCredentials(userEncrypted, passEncrypted) {
  if (!userEncrypted || !passEncrypted) {
    throw new Error("Credenciais encriptadas não fornecidas");
  }

  return {
    username: decrypt(userEncrypted),
    password: decrypt(passEncrypted),
  };
}

module.exports = {
  encrypt,
  decrypt,
  encryptCredentials,
  decryptCredentials,
  encryptCredentialsJSON,
  decryptCredentialsJSON,
};
