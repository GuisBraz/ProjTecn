# Fase 2 — Módulo completo Carga Fábrica

## O que foi implementado

1. **Dashboard do Carga Fábrica** (`/fabrica`) — cards com: OPs em fábrica, em dia, atrasadas, finalizadas, e contagem por empreiteira (ex: "OPs da 1ª Empreiteira").

2. **Cadastro de OP** (botão "+ Nova OP" dentro de uma empreiteira) com os campos: Número da OP, Número do Produto, Commessa, Desenho, Descrição, Quantidade, Peso, Data de Início, Previsão de Término.

3. **OPs Ativas** (`/fabrica/ativas`) — primeiro mostra as empreiteiras (ícone + nome), ao clicar mostra a lista de OPs daquela empreiteira, com busca por **N° da OP, Commessa ou Desenho**, contador de "em dia" vs "atrasadas", e botão de finalizar.

4. **Cálculo automático de prazo**: se a previsão de término já passou, a OP aparece como **Atrasada** (vermelho); senão, **Em andamento** (azul). Também mostra "Faltam X dias" ou "Atrasada há X dias" na tabela.

5. **OPs Arquivadas** (`/fabrica/arquivadas`) — mesma estrutura, com as OPs finalizadas, busca, e botão de reabrir.

6. **Exportação Excel** própria do Carga Fábrica, com aba de resumo.

7. **Empreiteiras** (cadastro) foi movida pra seção **Sistema** na sidebar, já que é uma função de configuração, não de operação do dia a dia.

8. **Idioma muda imediatamente** — a sidebar, a tela inicial e as configurações já trocam de texto na hora, sem precisar recarregar a página. (Os textos internos das telas de PGM/OP ainda estão só em português — entra numa próxima etapa se quiser tradução completa.)

9. **Data atual** aparece no canto superior direito da tela inicial.

## Permissões refinadas no Carga Fábrica

Ajustei com mais precisão o que você descreveu:

| Ação | Quem pode |
|---|---|
| Colar/cadastrar novas OPs | Gestão de Fábrica |
| Editar dados de uma OP | Gestão de Fábrica |
| Finalizar / reabrir uma OP (dar baixa) | Operacional Fábrica + Gestão de Fábrica |
| Excluir uma OP | Gestão de Fábrica |
| Visualizar (sem alterar nada) | Operacional PCP |

---

## ⚠️ Atualizar as regras do Firestore (obrigatório)

Adicione a coleção `ops` às regras. Vá em **Firebase Console → Firestore Database → Regras**, e substitua tudo por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function getRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }

    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;
    }

    match /pgms/{document=**} {
      allow read: if request.auth != null &&
        getRole() in ['operacional_maquina', 'operacional_pcp', 'gestao_fabrica'];
      allow write: if request.auth != null &&
        getRole() in ['operacional_maquina', 'gestao_fabrica'];
    }

    match /empreiteiras/{document=**} {
      allow read: if request.auth != null &&
        getRole() in ['operacional_fabrica', 'operacional_pcp', 'gestao_fabrica'];
      allow write: if request.auth != null && getRole() == 'gestao_fabrica';
    }

    match /ops/{document=**} {
      allow read: if request.auth != null &&
        getRole() in ['operacional_fabrica', 'operacional_pcp', 'gestao_fabrica'];
      allow create: if request.auth != null && getRole() == 'gestao_fabrica';
      allow update: if request.auth != null &&
        getRole() in ['operacional_fabrica', 'gestao_fabrica'];
      allow delete: if request.auth != null && getRole() == 'gestao_fabrica';
    }
  }
}
```

Clique em **Publicar**.

---

## Deploy

1. Suba todos os arquivos no GitHub (substituindo os atuais)
2. Aguarde o deploy automático na Vercel
3. Atualize as regras do Firestore (acima)
4. Acesse o site com sua conta (código `01100` — Gestão)
5. Vá em **Empreiteiras** (seção Sistema) e confirme que as empreiteiras já cadastradas continuam lá
6. Vá em **Carga Fábrica → OPs Ativas**, clique numa empreiteira e cadastre uma OP de teste

---

## O que ainda não entrou (próximas etapas, se quiser)

- Importação em massa de OPs (colar várias linhas do RP de uma vez) — ainda não implementada nesta rodada; é uma peça técnica separada que merece atenção própria
- Tradução completa do conteúdo das telas de PGM/OP (hoje só a navegação/chrome troca de idioma)
