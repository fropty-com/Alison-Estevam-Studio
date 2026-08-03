-- Bucket próprio para fotos de produto (não reaproveita `avatars` — semântica
-- diferente, e evita esticar as policies já restritas a pasta staff/{uid}).
-- Público (só imagem de produto, sem dado sensível), escrita liberada a
-- qualquer membro da equipe autenticado (produto não pertence a uma pessoa,
-- diferente do avatar).

insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

create policy "products_bucket_public_read" on storage.objects
  for select using (bucket_id = 'products');

create policy "products_bucket_staff_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'products');

create policy "products_bucket_staff_update" on storage.objects
  for update to authenticated using (bucket_id = 'products');

create policy "products_bucket_staff_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'products');
