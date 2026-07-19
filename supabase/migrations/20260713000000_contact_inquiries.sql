-- Contact form messages (inserted by the contact-submit Edge Function only).
-- Run in Supabase → SQL Editor after deploying the Edge Function.

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) <= 254),
  name text check (name is null or char_length(name) <= 80),
  message text not null check (char_length(message) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists contact_inquiries_created_at_idx
  on public.contact_inquiries (created_at desc);

alter table public.contact_inquiries enable row level security;

-- No public insert/select policies: only the Edge Function (service role) writes rows.
-- View submissions in Supabase → Table Editor → contact_inquiries
