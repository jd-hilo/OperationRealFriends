-- Create user_profiles table
create table if not exists public.user_profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  bio text,
  goals text,
  location text,
  preferred_language text,
  app_goal text,
  engagement_frequency text,
  group_preference text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.user_profiles enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view their own profile" on public.user_profiles;
drop policy if exists "Users can update their own profile" on public.user_profiles;
drop policy if exists "Users can insert their own profile" on public.user_profiles;

-- Create new policies with proper authentication checks
create policy "Enable read access for authenticated users"
  on public.user_profiles for select
  to authenticated
  using (true);

create policy "Enable insert for authenticated users"
  on public.user_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Enable update for users based on user_id"
  on public.user_profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Create function to handle updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
drop trigger if exists handle_updated_at on public.user_profiles;
create trigger handle_updated_at
  before update on public.user_profiles
  for each row
  execute procedure public.handle_updated_at();

-- Add indexes for better performance
create index if not exists user_profiles_user_id_idx on public.user_profiles(user_id);
create index if not exists user_profiles_created_at_idx on public.user_profiles(created_at); 