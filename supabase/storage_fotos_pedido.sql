-- Foto anexada ao pedido (ex.: pedido manuscrito) + bucket de storage.
-- Execute uma vez no SQL Editor do Supabase (depois do schema.sql já aplicado).

alter table public.pedidos add column if not exists foto_pedido_path text;

insert into storage.buckets (id, name, public)
values ('fotos-pedido', 'fotos-pedido', false)
on conflict (id) do nothing;

create policy "fotos-pedido: upload autenticado" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'fotos-pedido');

create policy "fotos-pedido: leitura autenticada" on storage.objects
  for select to authenticated
  using (bucket_id = 'fotos-pedido');
