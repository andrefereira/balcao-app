-- Controle de estoque: quantidade por produto, com baixa automática ao separar.
-- Execute uma vez no SQL Editor do Supabase.

alter table public.produtos add column if not exists estoque integer not null default 0;

-- Decrementa o estoque de forma atômica (evita corrida entre duas pessoas
-- separando ao mesmo tempo) e devolve o novo valor, pra avisar se ficou negativo.
create or replace function public.baixar_estoque(p_produto_id bigint, p_qtd int)
returns integer
language sql
as $$
  update public.produtos
  set estoque = estoque - p_qtd
  where id = p_produto_id
  returning estoque;
$$;
