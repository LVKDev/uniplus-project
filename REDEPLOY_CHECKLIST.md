# ✅ Checklist: Próximas Ações Pós-Fix Prisma P3005

## 🎯 Objetivo

Verificar que EasyPanel deployment funciona com sucesso após correção de RUN_DB_MIGRATIONS.

---

## 📋 Pré-condições ✓

- [x] `.env` atualizado com `RUN_DB_MIGRATIONS=false`
- [x] Documentação atualizada (EASYPANEL_DEPLOY.md, CERION_CONFIG.md)
- [x] Memória de repositório criada (prisma-migration-strategy.md)
- [x] Nenhum erro de compilação no código

---

## 🚀 Passo 1: Redeploy no EasyPanel

### Via Painel Web

```
1. Abrir: https://beta.easypanel.io/ (seu painel)
2. Encontrar app: "aplicativos-api-uniplus-cerion"
3. Clicar em: "Deploy" ou ⚡ "Redeploy"
4. Ou: Clicar em "Git" → "Pull Latest" → Deploy
5. Aguardar: "Build successful" (verde)
```

### Alternativa Via Git (se configurado)

```bash
# Se repouso local está configured com EasyPanel webhook:
git add .env EASYPANEL_DEPLOY.md CERION_CONFIG.md MIGRATION_FIX_SUMMARY.md
git commit -m "fix: RUN_DB_MIGRATIONS=false para produção com DB existente"
git push origin main
# EasyPanel detecta push e faz deploy automático
```

### ❌ Não Fazer

```
- NÃO deletar o banco (resetaria tudo)
- NÃO rodar `prisma db push --force-reset`
- NÃO tentar rodar migration manual sem entender
```

---

## 🔍 Passo 2: Verificação - Health Check

**Aguarde 2-3 minutos** para container iniciar.

### Command

```bash
# Health check básico
curl https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host/health

# Ou com status verbose
curl -v https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host/health
```

### Resposta Esperada (✅ Sucesso)

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "success": true,
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z",
  "uptime": 45.234
}
```

### Resposta Ruim (❌ Falha)

```
curl: (7) Failed to connect to aplicativos-api-uniplus-cerion.q8dbws.easypanel.host port 443: Connection refused
```

**Ação**: Verifique logs no painel EasyPanel → App → Logs

---

## 🔐 Passo 3: Verificação - API com Auth

Testar endpoint protegido com Basic Auth.

### Command

```bash
curl -u admin:cerion363738 \
  https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host/mock/pedidos
```

### Resposta Esperada (✅ Sucesso)

```json
HTTP/1.1 200 OK

{
  "success": true,
  "data": [
    {
      "id": "mock-1",
      "codigo": "PED-001",
      "titulo": "Pedido Mock 1"
    },
    // ... mais itens
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 10
  }
}
```

### Resposta Ruim (❌ Falha)

```json
{ "success": false, "error": "Invalid credentials" }
```

**Ação**: Verifique BASIC_AUTH_USER e BASIC_AUTH_PASS no `.env` EasyPanel

---

## 📊 Passo 4: Verificação - Swagger Docs

Confirmar que documentação está acessível.

### URL

```
https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host/docs
```

### Esperado

- Swagger UI carrega normalmente
- Lista de endpoints visível
- Sem erros 404/500

---

## 🧪 Passo 5: Teste Completo (Opcional)

Rodar script de teste (simular cliente n8n).

```bash
# Executar teste completo
bash scripts/test-api.sh https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host

# Ou teste Node.js
node test-api-node.js
```

---

## 💾 Passo 6: Verificar Database Audit Logs (Opcional)

Confirmar que Prisma está escrevendo logs normalmente.

```bash
# Conectar ao MySQL DirectAdmin
mysql -h galegogas.wichat.com.br -u galegogas_uniplus -p
Enter password: HaD3hzkwu6tZTMSFVEEa

# No MySQL prompt:
USE galegogas_uniplus;
SELECT COUNT(*) FROM api_logs;  # Deve ter registros
SELECT * FROM api_logs ORDER BY createdAt DESC LIMIT 5;
```

Esperado:

```
| id  | operacao | status  | dataOperacao        |
|-----|----------|---------|---------------------|
| ... | LISTAR   | SUCESSO | 2024-01-15 10:30:.. |
```

---

## 📝 Passo 7: Documentar Resultado

Criar o seu próprio sumário:

```markdown
## Resultado Final

**Data**: [data]
**App**: aplicativos-api-uniplus-cerion

- [ ] Health Check: 200 OK
- [ ] Mock API: Autenticado com sucesso
- [ ] Swagger Docs: Carrega normalmente
- [ ] Database: Audit logs gravando
- [ ] n8n: Testado com sucesso [OPCIONAL]

**Notas**:
[seu texto]
```

---

## 🚨 Troubleshooting Rápido

### ❌ "Service is not reachable"

```
Causa Possível: Container ainda iniciando
Solução: Aguarde 2-3 minutos, teste novamente

Causa Possível: Erro no startup (check logs)
Solução: EasyPanel Dashboard → Logs → procure por "ERROR"
```

### ❌ "P3005 error" nos logs

```
Isso NÃO deve mais acontecer!

Se ocorrer:
1. Verifique que RUN_DB_MIGRATIONS=false em EasyPanel Environment
2. Verifique que .env local foi pushed para repo (se fazendo git push)
3. Faça novo deploy
```

### ❌ "Invalid credentials" no `/mock/pedidos`

```
Causa: BASIC_AUTH_USER/PASS incorreco
Solução: admin / cerion363738
Teste: curl -u admin:cerion363738 https://...
```

### ❌ Timeout em requests

```
Causa: URL errada
Solução: https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host
         (sem /api no início, /docs, /health adicionados depois)
```

---

## ✅ Quando Está Funcionando

Você saberá que tudo está OK quando:

1. **Health Check** retorna 200 com `"status": "ok"`
2. **Mock API** retorna dados (com autenticação)
3. **Logs** não mostram `P3005`, `ECONNREFUSED`, ou `500 errors`
4. **Swagger Docs** carrega normalmente no browser
5. Consegue fazer requisição de outro cliente (ex: n8n em seguida)

---

## 🔗 Documentação de Referência

- **Deployment**: [EASYPANEL_DEPLOY.md](EASYPANEL_DEPLOY.md)
- **Config CERION**: [CERION_CONFIG.md](CERION_CONFIG.md)
- **Resumo Fix**: [MIGRATION_FIX_SUMMARY.md](MIGRATION_FIX_SUMMARY.md)
- **Contexto Técnico**: [CLAUDE.md](CLAUDE.md)

---

## 📞 Contato/Suporte

Se precisar de ajuda:

1. Verificar logs EasyPanel
2. Consultar TROUBLESHOOTING_EASYPANEL.md
3. Verificar MIGRATION_FIX_SUMMARY.md (alternativas)

---

**Status**: 🟢 Ready for Redeploy
**Última Atualização**: [hoje]
**Responsável**: [seu nome]
