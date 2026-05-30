-- ListingWIN — Contacts migration
-- Run this in the Supabase SQL editor (https://supabase.com/dashboard)

-- 1. contacts table
create table if not exists public.contacts (
  id            uuid        primary key default gen_random_uuid(),
  workspace_id  uuid        not null references public.workspaces(id) on delete cascade,
  name          text        not null,
  customer      text        not null,  -- 'coop' | 'ica' | 'dagab'
  category      text,
  role          text,
  phone         text        not null,
  email         text        not null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. contacts_projects table (many-to-many between contacts and lansering projects)
create table if not exists public.contacts_projects (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references public.contacts(id) on delete cascade,
  project_id  uuid not null references public.projects(id) on delete cascade,
  unique(contact_id, project_id)
);

-- 3. RLS on contacts
alter table public.contacts enable row level security;

create policy "contacts_select" on public.contacts
  for select using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "contacts_insert" on public.contacts
  for insert with check (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "contacts_update" on public.contacts
  for update using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

create policy "contacts_delete" on public.contacts
  for delete using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

-- 4. RLS on contacts_projects
alter table public.contacts_projects enable row level security;

create policy "contacts_projects_select" on public.contacts_projects
  for select using (
    contact_id in (
      select id from public.contacts where workspace_id in (
        select workspace_id from public.workspace_members where user_id = auth.uid()
      )
    )
  );

create policy "contacts_projects_insert" on public.contacts_projects
  for insert with check (
    contact_id in (
      select id from public.contacts where workspace_id in (
        select workspace_id from public.workspace_members where user_id = auth.uid()
      )
    )
  );

create policy "contacts_projects_delete" on public.contacts_projects
  for delete using (
    contact_id in (
      select id from public.contacts where workspace_id in (
        select workspace_id from public.workspace_members where user_id = auth.uid()
      )
    )
  );
