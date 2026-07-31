-- Foto de perfil da equipe (admin/perfil). Bucket publico (so avatar, sem
-- dado sensivel) com escrita restrita a pasta do proprio usuario.

alter table staff_members
  add column avatar_url text;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_staff_insert_own" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'staff'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "avatars_staff_update_own" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'staff'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "avatars_staff_delete_own" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = 'staff'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
