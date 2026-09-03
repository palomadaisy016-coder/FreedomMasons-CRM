-- Freedom Masons CRM — Supabase schema
-- Run this once in your Supabase project: SQL Editor -> New query -> paste -> Run

create extension if not exists "uuid-ossp";

create table if not exists leads (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  company text,
  phone text,
  email text,
  source text,
  stage text not null default 'New',
  value numeric,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  client text,
  lead_id uuid references leads(id) on delete set null,
  status text not null default 'Planning',
  start_date date,
  due_date date,
  budget numeric,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete set null,
  client text,
  amount numeric not null default 0,
  status text not null default 'Draft',
  issue_date date,
  due_date date,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete set null,
  title text not null,
  assignee text,
  due_date date,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- Row Level Security: any signed-in teammate can read and write every table.
-- This is a shared-team CRM, not a per-user data model — every authenticated
-- user is treated as part of the Freedom Masons team.

alter table leads enable row level security;
alter table projects enable row level security;
alter table invoices enable row level security;
alter table tasks enable row level security;

create policy "team read leads" on leads for select using (auth.role() = 'authenticated');
create policy "team write leads" on leads for insert with check (auth.role() = 'authenticated');
create policy "team update leads" on leads for update using (auth.role() = 'authenticated');
create policy "team delete leads" on leads for delete using (auth.role() = 'authenticated');

create policy "team read projects" on projects for select using (auth.role() = 'authenticated');
create policy "team write projects" on projects for insert with check (auth.role() = 'authenticated');
create policy "team update projects" on projects for update using (auth.role() = 'authenticated');
create policy "team delete projects" on projects for delete using (auth.role() = 'authenticated');

create policy "team read invoices" on invoices for select using (auth.role() = 'authenticated');
create policy "team write invoices" on invoices for insert with check (auth.role() = 'authenticated');
create policy "team update invoices" on invoices for update using (auth.role() = 'authenticated');
create policy "team delete invoices" on invoices for delete using (auth.role() = 'authenticated');

create policy "team read tasks" on tasks for select using (auth.role() = 'authenticated');
create policy "team write tasks" on tasks for insert with check (auth.role() = 'authenticated');
create policy "team update tasks" on tasks for update using (auth.role() = 'authenticated');
create policy "team delete tasks" on tasks for delete using (auth.role() = 'authenticated');
