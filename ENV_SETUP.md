# 🔧 Setup do `.env` para Easypanel

## ✅ Arquivo Pronto

O arquivo `.env.test` está **100% pronto** para copiar para o Easypanel!

---

## 📋 Opções de URL

Escolha **UM** desses antes de copiar:

### **Opção 1: localhost (Recomendado se n8n está no mesmo servidor)**

```env
PUBLIC_BASE_URL=http://localhost:3000
```

✅ **Quando usar:**

- n8n e API no mesmo Easypanel
- Acesso mais rápido (sem sair do servidor)
- Sem problemas de HTTPS/certificado

❌ **Limitação:**

- Apenas n8m consegue acessar (não é acessível externamente)

---

### **Opção 2: URL Pública do Easypanel (Recomendado se precisa de acesso externo)**

```env
PUBLIC_BASE_URL=https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host
```

✅ **Quando usar:**

- Precisa acessar de fora (outro servidor, webhook, etc)
- Integração com sistemas externos
- Qualidade de produção

❌ **Limitação:**

- Mais lento que localhost
- Requer certificado HTTPS válido (Easypanel resolve isso)

---

## 🚀 Como Copiar

### **Passo 1: Escolha a URL**

Edite o `.env.test` localmente:

**Para localhost (desenvolvimento/teste):**

```bash
# Deixe como está (localhost já é padrão)
PUBLIC_BASE_URL=http://localhost:3000
```

**Para produção (acesso externo):**

```bash
# Descomente a URL pública
PUBLIC_BASE_URL=https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host
```

### **Passo 2: Copie para Easypanel**

```bash
# Do seu computador local
scp .env.test seu_usuario@166.0.186.92:/home/apps/uniplus-project/.env
```

### **Passo 3: Verifique no Easypanel**

```bash
# SSH no Easypanel
ssh seu_usuario@166.0.186.92

# Entre na pasta
cd /home/apps/uniplus-project

# Verifique se o arquivo .env foi criado
cat .env | head -n 20

# Verifique a URL escolhida
grep PUBLIC_BASE_URL .env
```

---

## 🔐 Credenciais (Confirmadas)

### **Admin da API**

```
Username: admin
Password: cerion363738
Base64: YWRtaW46Y2VyaW9uMzYzNzM4
```

### **UniPlus**

```
Client ID: galegoaguaegas
Client Secret: b7de0482-c8f9-40d1-aa3a-f47f6e810c22
```

### **MySQL (DirectAdmin)**

```
Host: galegogas.wichat.com.br:3306
User: galegogas_uniplus
Password: HaD3hzkwu6tZTMSFVEEa
Database: galegogas_uniplus
```

---

## ✨ O que está definido no `.env.test`

| Variable                | Valor                          | Status |
| ----------------------- | ------------------------------ | ------ |
| `PORT`                  | 3000                           | ✅ OK  |
| `PUBLIC_BASE_URL`       | localhost ou pública           | ✅ OK  |
| `BASIC_AUTH_USER`       | admin                          | ✅ OK  |
| `BASIC_AUTH_PASS`       | cerion363738                   | ✅ OK  |
| `UNIPLUS_BASE_URL`      | https://unisoftsistemas...     | ✅ OK  |
| `UNIPLUS_CLIENT_ID`     | galegoaguaegas                 | ✅ OK  |
| `UNIPLUS_CLIENT_SECRET` | b7de0...                       | ✅ OK  |
| `UNIPLUS_TOKEN`         | Base64 (fallback)              | ✅ OK  |
| `UNIPLUS_AUTH_BASIC`    | Base64                         | ✅ OK  |
| `DATABASE_URL`          | galegogas_uniplus@galegogas... | ✅ OK  |

---

## 🧪 Testar Depois de Copiar

```bash
# 1. SSH no Easypanel
ssh seu_usuario@166.0.186.92

# 2. Ir para a pasta
cd /home/apps/uniplus-project

# 3. Instalar dependências
npm install

# 4. Gerar Prisma
npx prisma generate

# 5. Iniciar API
npm run dev

# Esperar por:
# [UniPlus] ✅ Usando UNIPLUS_TOKEN do .env
# ou
# [UniPlus] 🔐 Usando Basic Auth como fallback
# Servidor rodando na porta 3000
```

---

## ❓ Dúvidas Rápidas

**P: Os dados da UniPlus vão chegar?**  
R: Sim! A API faz requisição HTTP para UniPlus normalmente (mesmo usando localhost)

**P: localhost é seguro?**  
R: Sim, porque está protegido por Basic Auth e dentro do Easypanel (não exposto)

**P: Preciso de HTTPS?**  
R: Não para localhost. Para URL pública, Easypanel já fornece certificado

**P: E se n8m estiver em outro servidor?**  
R: Use a URL pública: `https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host`

---

## 📝 Resumo

| Cenário                         | URL                          | Comando                  |
| ------------------------------- | ---------------------------- | ------------------------ |
| **n8w local + API local**       | `http://localhost:3000`      | `scp .env.test user@...` |
| **n8n externo + API Easypanel** | `https://aplicativos-api...` | `scp .env.test user@...` |
| **Desenvolvimento**             | `localhost`                  | Deixe como está          |
| **Produção**                    | URL pública                  | Edite antes de copiar    |

---

**Pronto para fazer deploy!** ✅

Copie o `.env.test` e cole no Easypanel como `.env`
