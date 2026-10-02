create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 3 and 160),
  category text not null default 'DIVISION UPDATE' check (char_length(category) between 2 and 40),
  summary text not null check (char_length(summary) between 10 and 600),
  body text,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.news enable row level security;

drop policy if exists "Public can view published news" on public.news;
create policy "Public can view published news"
on public.news for select
to anon, authenticated
using (published = true);

drop policy if exists "Authenticated users can manage news" on public.news;
create policy "Authenticated users can manage news"
on public.news for all
to authenticated
using (true)
with check (true);

create index if not exists news_created_at_idx on public.news(created_at desc);