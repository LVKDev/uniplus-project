# 🚀 QUICK START - 5 Minutos para Começar

## 1️⃣ Copiar Arquivo .env para Easypanel

```bash
# Local (seu computador)
scp .env.test seu_usuario@166.0.186.92:/home/apps/uniplus-project/.env

# Ou copiar manualmente o conteúdo de .env.test
```

## 2️⃣ Conectar no Easypanel e Testar

```bash
# SSH no Easypanel
ssh seu_usuario@166.0.186.92

# Entrar na pasta do projeto
cd /home/apps/uniplus-project

# Instalar dependências
npm install

# Gerar Prisma Client
npx prisma generate

# Iniciar API
npm run dev
```

**Resultado esperado:**

```
[UniPlus] ✅ Usando UNIPLUS_TOKEN do .env
Servidor rodando na porta 3000
✅ Auditoria inicializada
```

## 3️⃣ Testar no n8n

```bash
# No n8n, crie uma requisição HTTP:

URL: http://localhost:3000/api/produtos
Method: GET
Headers:
  - Authorization: Basic YWRtaW46Y2VyaW9uMzYzNzM4

# Resultado: Array de produtos da UniPlus
[
  { id: 1, nome: "ÁGUA MINERAL", ... },
  { id: 2, nome: "REFRIGERANTE", ... }
]
```

## 4️⃣ Verificar Auditoria em MySQL

```bash
# SSH no Easypanel
mysql -h galegogas.wichat.com.br -u galegogas_uniplus -p

# Password: HaD3hzkwu6tZTMSFVEEa

# Ver registros de auditoria
USE galegogas_uniplus;
SELECT * FROM api_logs ORDER BY created_at DESC LIMIT 5;
```

## 5️⃣ Pronto! 🎉

Agora você tem:

- ✅ API rodando no Easypanel
- ✅ Dados vindo da UniPlus
- ✅ Auditoria em MySQL DirectAdmin
- ✅ n8n conseguindo chamar tudo

---

## 📚 Documentação Completa

- **`SETUP_FINAL.md`** - Guia detalhado com troubleshooting
- **`DEPLOYMENT_CHECKLIST.md`** - 8 fases com testes
- **`PROJECT_SUMMARY.md`** - Visão geral técnica

---

## ❓ Dúvidas Rápidas

**P: Aparece "ERRO ao gerar token OAuth 403"?**  
R: Normal! É a WAF da UniPlus. O código automaticamente usa Basic Auth como fallback. ✅

**P: Como parar a API?**  
R: `Ctrl+C` no terminal

**P: Como reiniciar a API?**  
R: `npm run dev` novamente

**P: Banco não conecta?**  
R: Verificar `.env` → DATABASE_URL e credenciais do DirectAdmin

**P: n8n não consegue chamar localhost?**  
R: n8n e API estão no mesmo Easypanel. Use `http://localhost:3000`

---

**Pronto para começar! 🚀**
