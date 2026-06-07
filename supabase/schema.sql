-- 江迹 MVP：云端 markers + gallery，公开只读，仅 admin 邮箱可写
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

alter table public.markers enable row level security;
alter table public.gallery enable row level security;
alter table public.site_meta enable row level security;
alter table public.quotes enable row level security;

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

-- 仅超级管理员可写（把邮箱改成你的，或通过 Supabase Dashboard 编辑）
create policy "markers_admin_write"
  on public.markers for all
  using (auth.jwt() ->> 'email' = 'YOUR_ADMIN_EMAIL')
  with check (auth.jwt() ->> 'email' = 'YOUR_ADMIN_EMAIL');

create policy "gallery_admin_write"
  on public.gallery for all
  using (auth.jwt() ->> 'email' = 'YOUR_ADMIN_EMAIL')
  with check (auth.jwt() ->> 'email' = 'YOUR_ADMIN_EMAIL');

create policy "site_meta_admin_write"
  on public.site_meta for all
  using (auth.jwt() ->> 'email' = 'YOUR_ADMIN_EMAIL')
  with check (auth.jwt() ->> 'email' = 'YOUR_ADMIN_EMAIL');

create policy "quotes_admin_write"
  on public.quotes for all
  using (auth.jwt() ->> 'email' = 'YOUR_ADMIN_EMAIL')
  with check (auth.jwt() ->> 'email' = 'YOUR_ADMIN_EMAIL');

create index if not exists markers_updated_at_idx on public.markers (updated_at desc);
create index if not exists gallery_updated_at_idx on public.gallery (updated_at desc);
create index if not exists quotes_updated_at_idx on public.quotes (updated_at desc);
