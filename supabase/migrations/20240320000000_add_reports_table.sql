-- Add reported column to messages table
alter table public.messages add column if not exists reported boolean default false;

-- Create reports table
create table if not exists public.reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references auth.users(id) on delete cascade,
  reported_message_id uuid references public.messages(id) on delete cascade,
  reason text,
  status text default 'pending' check (status in ('pending', 'reviewed', 'resolved')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.reports enable row level security;

-- Create policies
create policy "Users can create reports"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

create policy "Users can view their own reports"
  on public.reports for select
  to authenticated
  using (auth.uid() = reporter_id);

-- Create function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger handle_updated_at
  before update on public.reports
  for each row
  execute procedure public.handle_updated_at();

-- Add indexes for better performance
create index if not exists reports_reporter_id_idx on public.reports(reporter_id);
create index if not exists reports_reported_message_id_idx on public.reports(reported_message_id);
create index if not exists reports_status_idx on public.reports(status); 