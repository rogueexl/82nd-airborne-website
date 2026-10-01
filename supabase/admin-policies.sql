create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "Admins can read own admin record" on public.admin_users;
create policy "Admins can read own admin record"
on public.admin_users for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Admins can view all reviews" on public.reviews;
create policy "Admins can view all reviews"
on public.reviews for select
to authenticated
using (
  exists (
    select 1 from public.admin_users a
    where a.user_id = auth.uid()
  )
);

drop policy if exists "Admins can moderate reviews" on public.reviews;
create policy "Admins can moderate reviews"
on public.reviews for update
to authenticated
using (
  exists (
    select 1 from public.admin_users a
    where a.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.admin_users a
    where a.user_id = auth.uid()
  )
);
