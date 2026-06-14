-- 圣地巡礼 · 图片 + 影像馆网友分类
-- 在 Supabase SQL Editor 执行（需已执行 migration-pilgrimage.sql 与 collaborators 迁移）

alter table public.pilgrimage_visits
  add column if not exists gallery_ids text[] not null default '{}';

alter table public.pilgrimage_visits
  drop constraint if exists pilgrimage_visits_body_check;

alter table public.pilgrimage_visits
  alter column body set default '';

alter table public.pilgrimage_visits
  add constraint pilgrimage_visits_body_check
  check (char_length(body) <= 800);

alter table public.pilgrimage_visits
  drop constraint if exists pilgrimage_visits_content_check;

alter table public.pilgrimage_visits
  add constraint pilgrimage_visits_content_check
  check (char_length(trim(body)) > 0 or cardinality(gallery_ids) > 0);

-- 登录用户可写入「网友」影像（圣地巡礼同步）
drop policy if exists "gallery_community_insert" on public.gallery;
create policy "gallery_community_insert"
  on public.gallery for insert
  to authenticated
  with check (
    (payload->>'source') = 'community'
    and lower(trim(coalesce(payload->>'authorEmail', '')))
      = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );
