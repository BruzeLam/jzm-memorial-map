-- 已有项目追加：档案馆表（在 Supabase SQL Editor 中 Run 一次）

create table if not exists public.archives (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.archives enable row level security;

create policy "archives_public_read"
  on public.archives for select
  using (true);

-- 将 YOUR_ADMIN_EMAIL 换成管理员邮箱
create policy "archives_admin_write"
  on public.archives for all
  using (auth.jwt() ->> 'email' = 'YOUR_ADMIN_EMAIL')
  with check (auth.jwt() ->> 'email' = 'YOUR_ADMIN_EMAIL');

create index if not exists archives_updated_at_idx on public.archives (updated_at desc);
