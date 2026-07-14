# CNC Gestão — Guia de Deploy (Firebase)

> Este guia substitui a versão anterior, que descrevia um fluxo com Supabase.
> O código do projeto usa **Firebase** (Auth + Firestore) do início ao fim —
> os arquivos `supabase_schema*.sql` e `src/lib/supabase.js` foram removidos
> por não serem usados em nenhum lugar do app.

## PARTE 1 — Firebase

### 1.1 Criar o projeto
1. Acesse https://console.firebase.google.com e crie um novo projeto (gratuito no plano Spark).
2. Em **Build → Authentication**, ative o provedor **E-mail/senha**.
3. Em **Build → Firestore Database**, crie o banco (modo produção).

### 1.2 Publicar as regras de segurança
1. No Firestore, vá em **Regras**.
2. Cole o conteúdo do arquivo `firestore.rules` (na raiz do projeto) e publique.
   Isso é **obrigatório** — sem essas regras, qualquer usuário autenticado
   consegue ler/escrever qualquer PGM.

### 1.3 Pegar as credenciais do app web
1. Em **Configurações do projeto → Geral → Seus apps**, adicione um app Web.
2. Copie os valores do objeto `firebaseConfig` (apiKey, authDomain, projectId, etc.).

## PARTE 2 — Configurar o projeto localmente

### 2.1 Instalar Node.js (só na primeira vez)
Acesse https://nodejs.org e instale a versão **LTS**.

### 2.2 Configurar as variáveis de ambiente
1. Na raiz do projeto, crie um arquivo chamado `.env`.
2. Copie o conteúdo de `.env.example` e preencha os valores do Firebase copiados no passo 1.3.
   A linha `DISABLE_ESLINT_PLUGIN=true` já vem pronta — ela contorna um bug
   conhecido de compatibilidade do create-react-app com versões novas do
   `eslint-plugin-jest` que trava o `npm run build`. Não precisa mexer nela.

### 2.3 Instalar dependências e rodar
```
npm install
npm start
```

### 2.4 Build de produção
```
npm run build
```
A pasta `build/` gerada pode ser publicada em qualquer hospedagem estática
(Firebase Hosting, Vercel, Netlify etc.).

### 2.5 Deploy na Vercel
O arquivo `vercel.json` (na raiz) já resolve o bug do `eslint-plugin-jest`
automaticamente — não precisa configurar `DISABLE_ESLINT_PLUGIN` manualmente.
O que **ainda precisa** ser feito no painel da Vercel:
1. No projeto na Vercel, vá em **Settings → Environment Variables**.
2. Adicione as 6 variáveis `REACT_APP_FIREBASE_*` do passo 2.2 (uma por uma,
   com os mesmos valores do seu `.env`). O `.env` não vai pro Git de propósito
   (protege suas chaves), então a Vercel não tem como saber esses valores
   sozinha.
3. Marque as variáveis para os ambientes **Production** e **Preview**.
4. Clique em **Redeploy** (ou dê um novo push) — o build deve compilar limpo.

## PARTE 3 — Criar os primeiros usuários

O cadastro é feito pela própria tela de login, usando um **código de acesso**
de 5 dígitos que define o papel do usuário:

| Código  | Papel                    | O que pode fazer |
|---------|---------------------------|-------------------|
| `01001` | Programador (PCP)         | Cadastra, edita e exclui PGMs; inicia/finaliza corte |
| `01101` | Operador de Máquina       | Vê os PGMs, inicia/finaliza corte, preenche o CR |
| `01011` | Operacional PCP (leitura) | Só visualiza, sem editar nada |
| `01100` | Gestão                    | Acesso total |

⚠️ **Atenção:** esses códigos ficam no código-fonte do app (visíveis a quem
inspecionar o site). Trate-os como uma senha simples de baixo risco — não como
proteção definitiva. Compartilhe apenas com quem deve mesmo ter aquele nível
de acesso.
