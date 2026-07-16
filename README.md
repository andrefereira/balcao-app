# Balcão — do pedido à entrega

Sistema de gestão de pedidos para papelaria: interpretação de pedidos do WhatsApp via IA
(API do Claude), separação com checklist, listas de compra por fornecedor, entrega com
assinatura na tela, relatório para o cliente, e login por **link mágico** com perfis
separados por papel (Admin, Atendente, Separador, Entregador).

---

## 1. Criar o projeto no Supabase

1. Crie uma conta/projeto em [supabase.com](https://supabase.com) (plano gratuito serve).
2. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public** —
   você vai usá-las no passo 3.
3. Em **Authentication → Providers**, confirme que **Email** está habilitado. Em
   **Authentication → URL Configuration**, adicione a URL do seu site (ex.:
   `https://SEU_USUARIO.github.io/balcao-app/`) em **Redirect URLs** — sem isso o link
   mágico não redireciona de volta para o app.
4. Em **Authentication → Providers → Email**, você pode desativar "Confirm email" para
   simplificar (não é obrigatório: o link mágico já autentica).

## 2. Rodar o schema do banco

1. No painel do Supabase, abra **SQL Editor → New query**.
2. Cole todo o conteúdo do arquivo [`supabase/schema.sql`](./supabase/schema.sql) e clique
   em **Run**.
3. Isso cria as tabelas (perfis, clientes, produtos, fornecedores, pedidos, itens_pedido,
   entregas), as políticas de segurança (RLS), o bucket `assinaturas` no Storage, e já
   insere os fornecedores/produtos/clientes de exemplo usados na demonstração.

**Importante sobre perfis:** o primeiro usuário que fizer login vira automaticamente
**Admin**. Os seguintes entram como **Atendente** por padrão — o Admin ajusta o papel de
cada pessoa na aba **Equipe** dentro do app.

## 3. Configurar as variáveis de ambiente

1. Copie `.env.example` para `.env` na raiz do projeto.
2. Preencha com a URL e a chave anon copiadas no passo 1.

```bash
cp .env.example .env
```

## 4. Publicar a Edge Function (interpretação com a API do Claude)

A interpretação dos pedidos usa a API do Claude rodando em uma Edge Function do Supabase
(assim a sua chave de API nunca fica exposta no navegador). Isso exige o
[Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
npm install -g supabase

supabase login
supabase link --project-ref SEU_PROJECT_REF   # está na URL do projeto no dashboard

# guarda sua chave da API do Claude como secret (nunca vai para o código)
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

supabase functions deploy interpretar-pedido
```

Se você pular esta etapa, o app **ainda funciona**: cai automaticamente para um parser
local mais simples baseado em palavras-chave (mesma lógica do protótipo de demonstração),
e mostra um aviso discreto de qual dos dois interpretou o pedido.

## 5. Rodar localmente

```bash
npm install
npm run dev
```

Abra o link mostrado no terminal, digite seu e-mail, e verifique a caixa de entrada — o
link mágico chega em segundos.

## 6. Publicar no GitHub Pages

1. Crie um repositório chamado `balcao-app` (se usar outro nome, ajuste `base` em
   `vite.config.js`).
2. Em **Settings → Secrets and variables → Actions**, adicione dois *repository secrets*:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   (o build do GitHub Actions precisa deles para gerar o app corretamente — são as mesmas
   chaves do seu `.env`, que nunca deve ir para o repositório).
3. Suba o projeto:

   ```bash
   git init
   git add .
   git commit -m "Balcão — versão com Supabase"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/balcao-app.git
   git push -u origin main
   ```

4. Em **Settings → Pages**, selecione **Source: GitHub Actions**.
5. Não esqueça de voltar ao passo 1.3 e adicionar a URL final do GitHub Pages nas
   **Redirect URLs** do Supabase.

O app fica disponível em `https://SEU_USUARIO.github.io/balcao-app/`.

---

## Papéis e o que cada um vê

| Papel | Telas |
|---|---|
| **Admin** | Todas: Novo, Pedidos, Separação, Fornecedores, Entrega, Equipe |
| **Atendente** | Novo pedido, Pedidos |
| **Separador** | Separação, Fornecedores, Pedidos |
| **Entregador** | Entrega, Pedidos |

O controle de papel também é reforçado no banco via RLS (`meu_papel()`), não apenas na
interface.

## Estrutura do projeto

```
src/
  App.jsx          — app inteiro: login, navegação por papel, telas
  supabase.js       — cliente Supabase
  parserLocal.js     — fallback de interpretação sem IA
  estilos.js         — CSS
supabase/
  schema.sql          — tabelas, RLS, storage, dados de exemplo
  functions/
    interpretar-pedido/  — Edge Function que chama a API do Claude
```

## Roteiro de demonstração

1. Login com link mágico (cada pessoa da equipe usa seu próprio e-mail).
2. **Novo pedido** → "Usar mensagem de exemplo" → "Interpretar com IA" → resolver o item
   ambíguo (caderno 96 ou 200 folhas) → criar pedido.
3. **Separação** → marcar itens como "Separado" ou "Sem estoque" (vai para a lista do
   fornecedor).
4. **Fornecedores** → "Mercadoria recebida" devolve os itens à fila de separação.
5. **Entrega** → "Registrar entrega c/ assinatura" (assinar com o dedo na tela).
6. **Pedidos** → abrir o pedido: etiquetas por item e relatório parcial com botão de
   compartilhar no WhatsApp.
7. **Equipe** (só Admin) → trocar o papel de um usuário.

## Próximos passos possíveis

- Cadastro de produtos/fornecedores/clientes direto pela interface (hoje é via SQL Editor).
- Histórico de assinaturas visível no detalhe do pedido (URL assinada do Storage).
- Filtros e busca na lista de pedidos.
- Notificação automática quando o relatório é gerado.
