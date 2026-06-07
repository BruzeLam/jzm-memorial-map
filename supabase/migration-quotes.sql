-- 已有项目追加：语录表（在 SQL Editor 中执行一次即可）

create table if not exists public.quotes (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.quotes enable row level security;

create policy "quotes_public_read"
  on public.quotes for select
  using (true);

-- 将 YOUR_ADMIN_EMAIL 换成管理员邮箱（与 markers 策略一致）
create policy "quotes_admin_write"
  on public.quotes for all
  using (auth.jwt() ->> 'email' = 'YOUR_ADMIN_EMAIL')
  with check (auth.jwt() ->> 'email' = 'YOUR_ADMIN_EMAIL');

create index if not exists quotes_updated_at_idx on public.quotes (updated_at desc);
