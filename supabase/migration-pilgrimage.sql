-- 圣地巡礼：地点下的登录用户留言（即时公开，超管可删）
-- 在 Supabase SQL Editor 执行（建议已执行 collaborators 迁移）

create table if not exists public.pilgrimage_visits (
  id uuid primary key default gen_random_uuid(),
  marker_id text not null,
  author_email text not null,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 800),
  created_at timestamptz not null default now()
);

alter table public.pilgrimage_visits enable row level security;

create index if not exists pilgrimage_visits_marker_created_idx
  on public.pilgrimage_visits (marker_id, created_at desc);

-- 所有人可读
drop policy if exists "pilgrimage_public_read" on public.pilgrimage_visits;
create policy "pilgrimage_public_read"
  on public.pilgrimage_visits for select
  using (true);

-- 登录用户可发（邮箱须与 JWT 一致，无需审核）
drop policy if exists "pilgrimage_insert_own" on public.pilgrimage_visits;
create policy "pilgrimage_insert_own"
  on public.pilgrimage_visits for insert
  with check (
    auth.role() = 'authenticated'
    and lower(trim(author_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    and char_length(trim(body)) > 0
  );

-- 仅超级管理员可删
drop policy if exists "pilgrimage_admin_delete" on public.pilgrimage_visits;
create policy "pilgrimage_admin_delete"
  on public.pilgrimage_visits for delete
  using (public.is_admin());
