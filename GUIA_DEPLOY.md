# CNC Gestão — Guia de Deploy
## Do zero ao ar em ~20 minutos

---

## PARTE 1 — Supabase (banco de dados em nuvem)

### 1.1 Criar conta e projeto
1. Acesse https://supabase.com e clique em **Start your project** (é gratuito)
2. Crie uma conta com Google ou e-mail
3. Clique em **New Project**
4. Preencha:
   - **Name:** cnc-gestao (ou qualquer nome)
   - **Database Password:** crie uma senha forte e anote
   - **Region:** South America (São Paulo)
5. Aguarde ~2 minutos enquanto o projeto é criado

### 1.2 Criar o banco de dados
1. No menu esquerdo, clique em **SQL Editor**
2. Clique em **New Query**
3. Abra o arquivo `supabase_schema.sql` (está na pasta do projeto)
4. Cole todo o conteúdo no editor
5. Clique em **Run** (botão verde)
6. Deve aparecer "Success. No rows returned"

### 1.3 Criar usuários do sistema
1. No menu esquerdo, clique em **Authentication** → **Users**
2. Clique em **Add user** → **Create new user**
3. Preencha o e-mail e senha de cada pessoa que vai usar o sistema
4. Repita para todos os usuários

### 1.4 Pegar as credenciais
1. No menu esquerdo, clique em **Project Settings** → **API**
2. Copie e guarde os dois valores:
   - **Project URL** (ex: https://abcdefgh.supabase.co)
   - **anon public** (chave longa que começa com "eyJ...")

---

## PARTE 2 — Configurar o projeto

### 2.1 Instalar Node.js (só na primeira vez)
- Acesse https://nodejs.org e baixe a versão **LTS**
- Instale normalmente

### 2.2 Configurar as credenciais
1. Na pasta do projeto, localize o arquivo `.env.example`
2. **Copie** esse arquivo e renomeie a cópia para `.env`
3. Abra o `.env` com o Bloco de Notas e preencha:

```
REACT_APP_SUPABASE_URL=https://SEU_PROJETO.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

Substitua pelos valores que você copiou no passo 1.4.

### 2.3 Instalar dependências (só na primeira vez)
1. Abra o terminal na pasta do projeto
   - Windows: segure Shift + clique direito na pasta → "Abrir janela do PowerShell aqui"
2. Digite e pressione Enter:
```
npm install
```
Aguarde terminar (pode demorar 1-2 minutos).

---

## PARTE 3 — Deploy na Vercel (publicar o site)

### 3.1 Criar conta na Vercel
1. Acesse https://vercel.com
2. Clique em **Sign Up** e entre com sua conta GitHub
   - Se não tiver GitHub, crie em https://github.com (é gratuito)

### 3.2 Subir o código para o GitHub
1. Acesse https://github.com/new
2. Crie um repositório chamado `cnc-gestao` (deixe privado)
3. Siga as instruções do GitHub para fazer o primeiro envio
   - Basicamente: `git init`, `git add .`, `git commit -m "inicial"`, `git push`

### 3.3 Publicar na Vercel
1. Na Vercel, clique em **New Project**
2. Selecione o repositório `cnc-gestao`
3. Antes de confirmar, clique em **Environment Variables** e adicione:
   - `REACT_APP_SUPABASE_URL` = sua URL do Supabase
   - `REACT_APP_SUPABASE_ANON_KEY` = sua chave anon
4. Clique em **Deploy**
5. Aguarde ~2 minutos

Pronto! Você vai receber um link como `https://cnc-gestao.vercel.app`

---

## PARTE 4 — Usar no celular como app

### Android
1. Abra o Chrome no celular
2. Acesse o link do seu site
3. O Chrome vai mostrar um banner "Adicionar à tela inicial"
4. Toque nele → o app aparece na tela inicial como qualquer outro

### iPhone / iPad
1. Abra o Safari (deve ser o Safari, não o Chrome)
2. Acesse o link do seu site
3. Toque no ícone de compartilhamento (quadrado com seta para cima)
4. Selecione "Adicionar à Tela de Início"

---

## PARTE 5 — Manutenção

### Adicionar novos usuários
- Acesse o Supabase → Authentication → Users → Add user

### Ver os dados diretamente
- Supabase → Table Editor → pgms

### Atualizar o sistema (quando houver melhorias)
- Basta fazer `git push` novamente. A Vercel publica automaticamente.

### Backup dos dados
- Supabase → Settings → Database → Backups (backups diários automáticos no plano gratuito)

---

## Resumo dos links importantes
| O que | Link |
|---|---|
| Seu site | https://cnc-gestao.vercel.app (vai mudar com seu nome) |
| Banco de dados | https://supabase.com/dashboard |
| Deploy | https://vercel.com/dashboard |

---

## Suporte
Em caso de dúvidas durante o processo, abra uma conversa com o Claude e descreva em qual passo travou. Informe a mensagem de erro exata se houver.
