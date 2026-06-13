-- 图片对象存储（Supabase Storage · P2-05）
-- 在 SQL Editor 执行（需已执行 collaborators 迁移，依赖 public.is_editor()）

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'images',
  'images',
  true,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 公开读
drop policy if exists "images_public_read" on storage.objects;
create policy "images_public_read"
  on storage.objects for select
  using (bucket_id = 'images');

-- 已登录用户可上传（贡献者提交待审、协作者编辑）
drop policy if exists "images_authenticated_insert" on storage.objects;
create policy "images_authenticated_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'images');

-- 协作者可更新 / 删除
drop policy if exists "images_editor_update" on storage.objects;
create policy "images_editor_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'images' and public.is_editor())
  with check (bucket_id = 'images' and public.is_editor());

drop policy if exists "images_editor_delete" on storage.objects;
create policy "images_editor_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'images' and public.is_editor());
