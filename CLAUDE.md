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

- Branding trocado de "Balcão" (genérico) para **Educarte** — nome da empresa aplicado no
  `<title>`, no favicon e nos dois pontos de "marca" dentro de `App.jsx` (tela de login e
  cabeçalho do app), usando a logo em `src/assets/logo-educarte.webp`. Ver classe
  `.marca-logo` em `estilos.js`.
- Projeto ainda **não publicado**: falta rodar o schema no Supabase, configurar `.env`,
  publicar a Edge Function `interpretar-pedido`, e fazer o primeiro push para o GitHub
  (repositório esperado: `balcao-app`, ver `base` em `vite.config.js` — ajustar se o nome
  do repo for diferente).
- `npm install` local ainda não foi validado nesta máquina/pasta — rodar `npm install` e
  `npm run build` como primeiro passo ao continuar.

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
