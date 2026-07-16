-- ============================================================
-- BALCÃO — Schema completo
-- Execute este arquivo inteiro no SQL Editor do Supabase
-- (Dashboard → SQL Editor → New query → colar → Run)
-- ============================================================

-- ---------- PERFIS (papéis de usuário) ----------
create table public.perfis (
  id uuid primary key references auth.users on delete cascade,
  email text,
  nome text,
  papel text not null default 'atendente'
    check (papel in ('admin', 'atendente', 'separador', 'entregador')),
  criado_em timestamptz not null default now()
);

-- Função auxiliar: papel do usuário logado (security definer evita recursão de RLS)
create or replace function public.meu_papel()
returns text
language sql stable security definer set search_path = public
as $$
  select papel from public.perfis where id = auth.uid()
$$;

-- Cria o perfil automaticamente no primeiro login.
-- O PRIMEIRO usuário a entrar vira admin; os demais entram como atendente
-- (o admin ajusta o papel de cada um depois, na tela Equipe).
create or replace function public.handle_novo_usuario()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.perfis (id, email, nome, papel)
  values (
    new.id,
    new.email,
    split_part(new.email, '@', 1),
    case when not exists (select 1 from public.perfis) then 'admin' else 'atendente' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_novo_usuario();

-- ---------- CADASTROS ----------
create table public.fornecedores (
  id bigint generated always as identity primary key,
  nome text not null unique
);

create table public.clientes (
  id bigint generated always as identity primary key,
  nome text not null,
  telefone text,
  criado_em timestamptz not null default now()
);

create table public.produtos (
  id bigint generated always as identity primary key,
  nome text not null,
  chaves text[] not null default '{}',   -- palavras-chave p/ o parser local (fallback)
  modificador text,                      -- ex.: 'azul', '96' (desempate)
  fornecedor_id bigint references public.fornecedores,
  ativo boolean not null default true
);

-- ---------- PEDIDOS ----------
create table public.pedidos (
  id bigint generated always as identity primary key,
  cliente_id bigint not null references public.clientes,
  criado_em timestamptz not null default now(),
  criado_por uuid references public.perfis
);

create table public.itens_pedido (
  id bigint generated always as identity primary key,
  pedido_id bigint not null references public.pedidos on delete cascade,
  produto_id bigint references public.produtos,
  nome text not null,          -- snapshot do nome no momento do pedido
  qtd int not null check (qtd > 0),
  status text not null default 'pendente'
    check (status in ('pendente', 'separado', 'aguardando', 'entregue')),
  fornecedor text,             -- snapshot do fornecedor padrão
  entregue_em timestamptz
);

create table public.entregas (
  id bigint generated always as identity primary key,
  pedido_id bigint not null references public.pedidos on delete cascade,
  assinatura_path text,
  entregue_em timestamptz not null default now(),
  entregue_por uuid references public.perfis
);

-- ---------- RLS ----------
alter table public.perfis        enable row level security;
alter table public.fornecedores  enable row level security;
alter table public.clientes      enable row level security;
alter table public.produtos      enable row level security;
alter table public.pedidos       enable row level security;
alter table public.itens_pedido  enable row level security;
alter table public.entregas      enable row level security;

-- Perfis: todos os autenticados leem; cada um edita o próprio (sem mudar o papel);
-- só o admin muda papéis.
create policy "perfis: leitura" on public.perfis
  for select to authenticated using (true);

create policy "perfis: edição" on public.perfis
  for update to authenticated
  using (auth.uid() = id or public.meu_papel() = 'admin')
  with check (public.meu_papel() = 'admin' or papel = public.meu_papel());

-- Tabelas operacionais: qualquer usuário autenticado com perfil pode operar.
-- (Empresa pequena: papéis controlam a interface; refinar RLS por papel é etapa futura.)
do $$
declare t text;
begin
  foreach t in array array['fornecedores','clientes','produtos','pedidos','itens_pedido','entregas']
  loop
    execute format('create policy "leitura autenticada" on public.%I for select to authenticated using (public.meu_papel() is not null)', t);
    execute format('create policy "inserção autenticada" on public.%I for insert to authenticated with check (public.meu_papel() is not null)', t);
    execute format('create policy "atualização autenticada" on public.%I for update to authenticated using (public.meu_papel() is not null)', t);
    execute format('create policy "exclusão autenticada" on public.%I for delete to authenticated using (public.meu_papel() is not null)', t);
  end loop;
end $$;

-- ---------- STORAGE (assinaturas de entrega) ----------
insert into storage.buckets (id, name, public)
values ('assinaturas', 'assinaturas', false)
on conflict (id) do nothing;

create policy "assinaturas: upload autenticado" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'assinaturas');

create policy "assinaturas: leitura autenticada" on storage.objects
  for select to authenticated
  using (bucket_id = 'assinaturas');

-- ---------- DADOS INICIAIS ----------
insert into public.fornecedores (nome) values ('Reval'), ('Jandaia'), ('Faber-Castell');

insert into public.produtos (nome, chaves, modificador, fornecedor_id) values
  ('Papel A4 Chamex (caixa c/ 10 resmas)', '{papel,a4,chamex,sulfite}', null,      1),
  ('Caneta BIC azul',                      '{caneta}',                  'azul',    1),
  ('Caneta BIC preta',                     '{caneta}',                  'preta',   1),
  ('Caneta BIC vermelha',                  '{caneta}',                  'vermelh', 1),
  ('Caderno 96 folhas Jandaia',            '{caderno}',                 '96',      2),
  ('Caderno 200 folhas Jandaia',           '{caderno}',                 '200',     2),
  ('Pasta plástica com elástico',          '{pasta}',                   null,      1),
  ('Lápis HB Faber-Castell',               '{lápis,lapis}',             null,      3),
  ('Borracha branca',                      '{borracha}',                null,      3),
  ('Corretivo em fita',                    '{corretivo}',               null,      1),
  ('Bloco adesivo (post-it)',              '{post-it,postit,"bloco adesivo"}', null, 1),
  ('Grampeador de mesa',                   '{grampeador}',              null,      1);

insert into public.clientes (nome, telefone) values
  ('Mirian (Escritório Contábil)', null),
  ('João (Escola Recanto)',        null),
  ('Padaria Pão Dourado',          null),
  ('Dra. Carla (Consultório)',     null);
