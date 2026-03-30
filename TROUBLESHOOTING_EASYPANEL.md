# 🔧 Troubleshooting - API não responde no EasyPanel

## ⚠️ Erro: "Service is not reachable"

A aplicação não conseguiu iniciar ou não está respondendo no EasyPanel.

---

## 🔍 Causas Mais Comuns

### **1. Build falhou (Dependências)**

```
Erro: npm install com erro
Solução: Verificar logs do deploy no EasyPanel
```

### **2. Variáveis de ambiente incorretas**

```
DATABASE_URL vazio ou inválido
UNIPLUS_AUTH_BASIC não configurado
Solução: Verificar .env no EasyPanel
```

### **3. Banco de dados não acessível**

```
MySQL não conecta de galegogas.wichat.com.br
Solução: Testar conexão direta
```

### **4. Porta bloqueada**

```
Aplicação tentando usar PORT já em uso
Solução: Usar PORT=3000 (padrão)
```

### **5. Erro no código (arquivo corrompido)**

```
src/app.js com erro de sintaxe
Solução: Verificar arquivo
```

---

## ✅ Checklist de Verificação

### **Passo 1: Verificar Logs no EasyPanel**

1. Acesse EasyPanel Dashboard
2. Clique na aplicação `uniplus-api`
3. Vá em "Logs" ou "Build Logs"
4. Procure por:
   - `error`
   - `failed`
   - `cannot connect`
   - Stack traces

### **Passo 2: Verificar Variáveis de Ambiente**

No EasyPanel, confirme:

```
✅ PORT = 3000
✅ NODE_ENV = production
✅ PUBLIC_BASE_URL = https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host
✅ DATABASE_URL = mysql://galegogas_uniplus:HaD3hzkwu6tZTMSFVEEa@galegogas.wichat.com.br:3306/galegogas_uniplus
✅ UNIPLUS_AUTH_BASIC = Z2FsZWdvYWd1YWVnYXM6YjdkZTA0ODItYzhmOS00MGQxLWFhM2EtZjQ3ZjZlODEwYzIy
✅ BASIC_AUTH_USER = admin
✅ BASIC_AUTH_PASS = cerion363738
```

Se alguma estiver vazia → **ERRO**

### **Passo 3: Testar Banco de Dados Localmente**

```bash
# Do seu computador, teste conexão MySQL
mysql -h galegogas.wichat.com.br \
  -u galegogas_uniplus \
  -p (digitar: HaD3hzkwu6tZTMSFVEEa) \
  galegogas_uniplus

# Se conectar: OK
# Se não conectar: PROBLEMA NO BANCO
```

### **Passo 4: Verificar Build Command no EasyPanel**

Deve ser:

```bash
npm install && npm run db:migrate
```

### **Passo 5: Verificar Start Command no EasyPanel**

Deve ser:

```bash
npm start
```

Ou:

```bash
node src/server.js
```

---

## 🐛 Erros Específicos e Soluções

### **Erro: "Cannot find module '@prisma/client'"**

```
Solução:
1. Verificar package.json tem @prisma/client
2. Rodar: npm install no EasyPanel
3. Adicionar no Build: npm install
```

### **Erro: "ECONNREFUSED" no MySQL**

```
Solução:
1. Testar: mysql -h galegogas.wichat.com.br -u galegogas_uniplus -p
2. Se não conectar, contato com hospedagem
3. Verificar se IP do EasyPanel está na whitelist
```

### **Erro: "UNIPLUS_AUTH_BASIC is required"**

```
Solução:
1. Adicionar variável: UNIPLUS_AUTH_BASIC
2. Copiar: Z2FsZWdvYWd1YWVnYXM6YjdkZTA0ODItYzhmOS00MGQxLWFhM2EtZjQ3ZjZlODEwYzIy
3. Não deixar vazia
```

### **Erro: "Connection timeout"**

```
Solução:
1. DATABASE_URL está correto?
2. Banco está acessível?
3. Firewall bloqueando?

Teste: mysql -h galegogas.wichat.com.br -u galegogas_uniplus -p
```

---

## 🚀 Solução Rápida: Redeploy

1. **No EasyPanel:**
   - Selecione a aplicação
   - Clique em "Redeploy"
   - Aguarde o build completar
   - Verifique logs

2. **Se ainda não funcionar:**
   - Clique em "Stop"
   - Verifique variáveis de ambiente
   - "Start" novamente

---

## 🧪 Testes de Diagnóstico

### **Teste SSH (se disponível)**

```bash
# Dentro do container EasyPanel
npm list
npm list @prisma/client
cat .env | head
ps aux | grep node
```

### **Teste de Conectividade MySQL**

```bash
# Pela aplicação
curl -X GET \
  -u admin:cerion363738 \
  https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host/health

# Se retornar erro de DB, MySQL não conecta
```

### **Verificar Versão Node.js**

```
No EasyPanel, verificar Node.js configurado é 18 ou superior
```

---

## 📋 Checklist Final de Deploy

- [ ] Clonar repositório GitHub
- [ ] Criar app Node.js no EasyPanel
- [ ] Definir Node.js 18+
- [ ] Adicionar todas as variáveis .env (não deixar nenhuma vazia)
- [ ] Build command: `npm install && npm run db:migrate`
- [ ] Start command: `npm start`
- [ ] Criar banco de dados MySQL (se necessário)
- [ ] Deploy
- [ ] Aguardar 2-3 minutos
- [ ] Verificar logs
- [ ] Testar: `curl https://...host.../health`

---

## 📞 Informações para Suporte EasyPanel

Se precisar contatar suporte, forneça:

1. **URL**: https://aplicativos-api-uniplus-cerion.q8dbws.easypanel.host
2. **Erro**: "Service is not reachable"
3. **Logs**: Copiar do Deploy Logs
4. **Variáveis**: Listar todas as .env configuradas
5. **Database**: Informações da conexão MySQL

---

## 🔄 Próximo Passo: Deploy Corrigido

1. Verificar logs no EasyPanel
2. Identificar erro específico
3. Aplicar solução
4. Redeploy
5. Testar saúde: `/health`
6. Testar mock: `/mock/pedidos`

---

**Status**: ⚠️ **Investigación Required**

Verifique os logs no EasyPanel para identificar o problema específico.

**Dica**: A maioria dos problemas são variáveis de ambiente vazias ou banco de dados não acessível.
