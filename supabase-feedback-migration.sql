-- ListingWIN — Feedback migration
-- Kör i Supabase SQL Editor: https://supabase.com/dashboard/project/rjbqvbnzxxltnwoqfstb/sql

-- 1. feedback-tabellen
create table if not exists public.feedback (
  id            uuid        primary key default gen_random_uuid(),
  workspace_id  uuid        references public.workspaces(id) on delete set null,
  user_id       uuid,
  type          text        not null,  -- 'Bugg' | 'Förbättringsförslag' | 'Övrigt'
  message       text        not null,
  created_at    timestamptz not null default now()
);

-- 2. RLS: alla inloggade användare kan skicka feedback
alter table public.feedback enable row level security;

create policy "feedback_insert" on public.feedback
  for insert with check (auth.uid() is not null);

-- 3. Läsning begränsad till egna workspace-medlemmar
--    (Peter kan alltid se all feedback via Supabase-dashboarden)
create policy "feedback_select" on public.feedback
  for select using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );
