# Educarte — Balcão (do pedido à entrega)

Sistema de gestão de pedidos para papelaria, sob a marca **Educarte**. Interpreta pedidos
recebidos por WhatsApp via IA (API do Claude), organiza separação com checklist, gera
listas de compra por fornecedor, registra entrega com assinatura na tela, monta relatório
para o cliente, e usa login por **link mágico** (Supabase Auth) com perfis por papel
(Admin, Atendente, Separador, Entregador).

Stack: React 18 + Vite, Supabase (Postgres + Auth + Storage + Edge Functions), deploy no
GitHub Pages via GitHub Actions.

## Estrutura

```
index.html          — título "Educarte — Balcão, do pedido à entrega", favicon = logo
src/
  App.jsx            — app inteiro: login, navegação por papel, todas as telas
  supabase.js         — cliente Supabase
  parserLocal.js       — fallback de interpretação sem IA (quando a Edge Function não
                         está publicada)
  estilos.js           — todo o CSS do app (string injetada via <style>)
  assets/logo-educarte.webp — logo usada no React (import direto)
public/
  logo-educarte.webp  — mesma logo, servida como favicon estático
supabase/
  schema.sql            — tabelas, RLS, bucket "assinaturas", dados de exemplo
  functions/interpretar-pedido/ — Edge Function que chama a API do Claude
.github/workflows/deploy.yml    — build + publish automático no GitHub Pages
```

## Estado atual (última sessão)

- **Publicado**: repositório [andrefereira/balcao-app](https://github.com/andrefereira/balcao-app)
  (branch `main`), deploy automático via GitHub Actions no GitHub Pages —
  https://andrefereira.github.io/balcao-app/. Secrets `VITE_SUPABASE_URL`/
  `VITE_SUPABASE_ANON_KEY` já configurados no Actions; `.env` local também preenchido.
- Schema do Supabase já rodado (`supabase/schema.sql`), incluindo o catálogo completo da
  Reval em `supabase/cadastro_reval.sql` (388 produtos, já aplicado).
- **PWA**: app instalável (manifest + service worker via `vite-plugin-pwa`, ícones em
  `public/icon-*.png` gerados a partir da marca do logo).
- Aba **Cadastro** (Admin) para clientes/produtos/fornecedores pela interface, sem precisar
  de SQL Editor pro dia a dia.
- **Novo pedido** aceita anexar uma **foto do pedido manuscrito**, além de colar texto —
  ambos vão para a Edge Function `interpretar-pedido`, que agora manda imagem + texto pro
  Claude (visão) numa única chamada. Precisa da migração
  `supabase/storage_fotos_pedido.sql` (bucket `fotos-pedido` + coluna
  `pedidos.foto_pedido_path`) rodada no SQL Editor.
- **Edge Function `interpretar-pedido` ainda não foi publicada** (`supabase functions
  deploy`) — sem isso, texto cai no parser local (`parserLocal.js`) e uma foto anexada não
  tem como ser lida (aparece aviso pedindo pra publicar a função). Publicar é o próximo
  passo natural para a IA (texto e imagem) funcionar de verdade.

## Papéis e telas

| Papel | Vê |
|---|---|
| Admin | Novo, Pedidos, Separação, Fornecedores, Entrega, Equipe |
| Atendente | Novo pedido, Pedidos |
| Separador | Separação, Fornecedores, Pedidos |
| Entregador | Entrega, Pedidos |

Controle de papel reforçado no banco via RLS (`meu_papel()`), não só na interface. O
primeiro usuário que faz login vira Admin automaticamente; os seguintes entram como
Atendente (Admin ajusta depois na aba Equipe).

## Passo a passo de publicação (ver README.md para detalhes completos)

1. Criar projeto no Supabase, copiar `Project URL` e chave `anon public`.
2. Rodar `supabase/schema.sql` no SQL Editor do Supabase.
3. `cp .env.example .env` e preencher com as chaves do passo 1.
4. Publicar a Edge Function: `supabase secrets set ANTHROPIC_API_KEY=...` e
   `supabase functions deploy interpretar-pedido` (opcional — sem isso cai no parser
   local).
5. `npm install && npm run dev` para testar localmente.
6. Criar repositório `balcao-app` no GitHub, adicionar os secrets
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em Settings → Actions, dar push, e
   ativar GitHub Pages com Source = GitHub Actions.
7. Voltar ao Supabase (Authentication → URL Configuration) e adicionar a URL final do
   GitHub Pages em Redirect URLs — necessário para o link mágico funcionar.

## Próximos passos possíveis

- Cadastro de produtos/fornecedores/clientes pela interface (hoje é via SQL Editor).
- Histórico de assinaturas visível no detalhe do pedido.
- Filtros e busca na lista de pedidos.
- Notificação automática quando o relatório é gerado.
