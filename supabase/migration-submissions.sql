-- 用户提交待审队列（阶段 A：地点 marker）
-- 在 Supabase SQL Editor 执行（已有 collaborators 迁移的可直接执行本文件）

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('marker', 'quote', 'archive', 'gallery')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  payload jsonb not null,
  submitter_email text not null,
  reviewer_email text,
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.submissions enable row level security;

create index if not exists submissions_status_created_idx
  on public.submissions (status, created_at desc);

create index if not exists submissions_submitter_idx
  on public.submissions (submitter_email);

-- 提交者只能插入 pending；邮箱必须与 JWT 一致
drop policy if exists "submissions_insert_own" on public.submissions;
create policy "submissions_insert_own"
  on public.submissions for insert
  with check (
    auth.role() = 'authenticated'
    and status = 'pending'
    and lower(trim(submitter_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );

-- 提交者看自己的；协作者/管理员看全部
drop policy if exists "submissions_select" on public.submissions;
create policy "submissions_select"
  on public.submissions for select
  using (
    lower(trim(submitter_email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
    or public.is_editor()
  );

-- 仅协作者可审核（改状态、写 review 字段）
drop policy if exists "submissions_editor_update" on public.submissions;
create policy "submissions_editor_update"
  on public.submissions for update
  using (public.is_editor())
  with check (public.is_editor());

-- 仅超级管理员可删除
drop policy if exists "submissions_admin_delete" on public.submissions;
create policy "submissions_admin_delete"
  on public.submissions for delete
  using (public.is_admin());
