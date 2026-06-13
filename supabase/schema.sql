-- 江迹：云端数据 + 协作者 RLS（公开只读，collaborators 表内邮箱可写）
-- 在 Supabase SQL Editor 中执行；将 YOUR_ADMIN_EMAIL 换成你的邮箱

create table if not exists public.markers (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.site_meta (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.quotes (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.archives (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.markers enable row level security;
alter table public.gallery enable row level security;
alter table public.site_meta enable row level security;
alter table public.quotes enable row level security;
alter table public.archives enable row level security;

-- 任何人可读
create policy "markers_public_read"
  on public.markers for select
  using (true);

create policy "gallery_public_read"
  on public.gallery for select
  using (true);

create policy "site_meta_public_read"
  on public.site_meta for select
  using (true);

create policy "quotes_public_read"
  on public.quotes for select
  using (true);

create policy "archives_public_read"
  on public.archives for select
  using (true);

-- 协作者账号（admin 可管理列表，editor/admin 可写内容）
create table if not exists public.collaborators (
  email text primary key,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  invited_at timestamptz not null default now(),
  invited_by text,
  notes text
);

alter table public.collaborators enable row level security;

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

insert into public.collaborators (email, role, notes)
values ('YOUR_ADMIN_EMAIL', 'admin', '初始超级管理员')
on conflict (email) do update set role = 'admin';

create policy "collaborators_read"
  on public.collaborators for select
  using (public.is_editor());

create policy "collaborators_admin_write"
  on public.collaborators for all
  using (public.is_admin())
  with check (public.is_admin());

-- 协作者可写（YOUR_ADMIN_EMAIL 须已在 collaborators 表中）
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

create index if not exists markers_updated_at_idx on public.markers (updated_at desc);
create index if not exists gallery_updated_at_idx on public.gallery (updated_at desc);
create index if not exists quotes_updated_at_idx on public.quotes (updated_at desc);
create index if not exists archives_updated_at_idx on public.archives (updated_at desc);
