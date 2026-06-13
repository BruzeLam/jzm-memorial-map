-- 协作者账号体系：多邮箱可编辑，admin 角色可管理协作者
-- 在 Supabase SQL Editor 执行；将 YOUR_ADMIN_EMAIL 换成你的超级管理员邮箱（与 REACT_APP_ADMIN_EMAIL 一致）

-- ── 1. 协作者表 ─────────────────────────────────────────────
create table if not exists public.collaborators (
  email text primary key,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  invited_at timestamptz not null default now(),
  invited_by text,
  notes text
);

alter table public.collaborators enable row level security;

-- ── 2. 权限 helper（SECURITY DEFINER 避免 RLS 递归）──────────
create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.collaborators c
    where lower(trim(c.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.collaborators c
    where lower(trim(c.email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
      and c.role = 'admin'
  );
$$;

grant execute on function public.is_editor() to authenticated, anon;
grant execute on function public.is_admin() to authenticated, anon;

-- ── 3. 初始化超级管理员（必改邮箱）────────────────────────────
insert into public.collaborators (email, role, notes)
values ('YOUR_ADMIN_EMAIL', 'admin', '初始超级管理员')
on conflict (email) do update set role = 'admin';

-- ── 4. collaborators 表 RLS ─────────────────────────────────
drop policy if exists "collaborators_read" on public.collaborators;
drop policy if exists "collaborators_admin_write" on public.collaborators;

create policy "collaborators_read"
  on public.collaborators for select
  using (public.is_editor());

create policy "collaborators_admin_write"
  on public.collaborators for all
  using (public.is_admin())
  with check (public.is_admin());

-- ── 5. 内容表写策略：单邮箱 → 协作者列表 ─────────────────────
drop policy if exists "markers_admin_write" on public.markers;
drop policy if exists "gallery_admin_write" on public.gallery;
drop policy if exists "site_meta_admin_write" on public.site_meta;
drop policy if exists "quotes_admin_write" on public.quotes;
drop policy if exists "archives_admin_write" on public.archives;

create policy "markers_editor_write"
  on public.markers for all
  using (public.is_editor())
  with check (public.is_editor());

create policy "gallery_editor_write"
  on public.gallery for all
  using (public.is_editor())
  with check (public.is_editor());

create policy "site_meta_editor_write"
  on public.site_meta for all
  using (public.is_editor())
  with check (public.is_editor());

create policy "quotes_editor_write"
  on public.quotes for all
  using (public.is_editor())
  with check (public.is_editor());

create policy "archives_editor_write"
  on public.archives for all
  using (public.is_editor())
  with check (public.is_editor());
