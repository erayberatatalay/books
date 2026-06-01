-- =====================================================================
-- Ev Kitaplığım - İlk şema
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- Tablolar
-- ---------------------------------------------------------------------

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  author text,
  isbn_10 text,
  isbn_13 text,
  publisher text,
  published_year text,
  page_count integer,
  description text,
  cover_url text,
  category text,
  source text,
  is_archived boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists book_copies (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references books(id) on delete cascade,
  copy_code text,
  current_holder_id uuid references profiles(id),
  status text not null default 'on_shelf' check (status in ('on_shelf', 'with_member', 'lost', 'damaged')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists user_book_statuses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  status text not null default 'not_read' check (status in ('not_read', 'reading', 'read', 'abandoned', 'want_to_read')),
  started_at date,
  finished_at date,
  rating integer check (rating is null or rating between 1 and 5),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, book_id)
);

create table if not exists book_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  book_id uuid not null references books(id) on delete cascade,
  note text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists book_holder_history (
  id uuid primary key default gen_random_uuid(),
  book_copy_id uuid not null references book_copies(id) on delete cascade,
  from_user_id uuid references profiles(id),
  to_user_id uuid references profiles(id),
  action text not null check (action in ('taken', 'returned', 'transferred')),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------
-- İndeksler
-- ---------------------------------------------------------------------

create index if not exists idx_books_isbn_13 on books(isbn_13);
create index if not exists idx_books_isbn_10 on books(isbn_10);
create index if not exists idx_books_is_archived on books(is_archived);
create index if not exists idx_book_copies_book_id on book_copies(book_id);
create index if not exists idx_book_copies_status on book_copies(status);
create index if not exists idx_book_copies_holder on book_copies(current_holder_id);
create index if not exists idx_user_book_statuses_user on user_book_statuses(user_id);
create index if not exists idx_user_book_statuses_book on user_book_statuses(book_id);
create index if not exists idx_book_notes_user on book_notes(user_id);
create index if not exists idx_book_notes_book on book_notes(book_id);

-- ---------------------------------------------------------------------
-- updated_at otomatik güncelleme
-- ---------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at before update on profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_books_updated_at on books;
create trigger trg_books_updated_at before update on books
  for each row execute function public.set_updated_at();

drop trigger if exists trg_book_copies_updated_at on book_copies;
create trigger trg_book_copies_updated_at before update on book_copies
  for each row execute function public.set_updated_at();

drop trigger if exists trg_user_book_statuses_updated_at on user_book_statuses;
create trigger trg_user_book_statuses_updated_at before update on user_book_statuses
  for each row execute function public.set_updated_at();

drop trigger if exists trg_book_notes_updated_at on book_notes;
create trigger trg_book_notes_updated_at before update on book_notes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- Yeni auth kullanıcısı için otomatik profil oluşturma
-- (full_name ve role, user_metadata içinden alınır)
-- ---------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce(new.raw_user_meta_data->>'role', 'member')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Admin kontrolü (RLS recursion'ı önlemek için SECURITY DEFINER)
-- ---------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table profiles enable row level security;
alter table books enable row level security;
alter table book_copies enable row level security;
alter table user_book_statuses enable row level security;
alter table book_notes enable row level security;
alter table book_holder_history enable row level security;

-- ----- profiles -----------------------------------------------------
-- Ev üyelerinin adları kitap sahipliği gösterimi için tüm giriş yapanlara
-- görünür olmalıdır.
drop policy if exists "profiles_select" on profiles;
create policy "profiles_select" on profiles
  for select to authenticated
  using (true);

drop policy if exists "profiles_update_own_or_admin" on profiles;
create policy "profiles_update_own_or_admin" on profiles
  for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_insert_admin" on profiles;
create policy "profiles_insert_admin" on profiles
  for insert to authenticated
  with check (id = auth.uid() or public.is_admin());

-- ----- books --------------------------------------------------------
-- Giriş yapan herkes arşivlenmemiş kitapları görür; admin arşivli de görür.
drop policy if exists "books_select" on books;
create policy "books_select" on books
  for select to authenticated
  using (is_archived = false or public.is_admin());

-- Giriş yapan herkes kitap ekleyebilir.
drop policy if exists "books_insert" on books;
create policy "books_insert" on books
  for insert to authenticated
  with check (created_by = auth.uid());

-- Kitap güncelleme/arşivleme sadece admin.
drop policy if exists "books_update_admin" on books;
create policy "books_update_admin" on books
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ----- book_copies --------------------------------------------------
-- Sahiplik bilgisi tüm ev üyelerine görünür.
drop policy if exists "book_copies_select" on book_copies;
create policy "book_copies_select" on book_copies
  for select to authenticated
  using (true);

-- Herkes kitap ekleyebildiği için kopya da oluşturabilir.
drop policy if exists "book_copies_insert" on book_copies;
create policy "book_copies_insert" on book_copies
  for insert to authenticated
  with check (auth.uid() is not null);

-- "Bende" / "Rafa geri koy" işlemleri için tüm üyeler güncelleyebilir.
drop policy if exists "book_copies_update" on book_copies;
create policy "book_copies_update" on book_copies
  for update to authenticated
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- ----- user_book_statuses -------------------------------------------
-- Okuma durumu kişiye özel.
drop policy if exists "ubs_select_own" on user_book_statuses;
create policy "ubs_select_own" on user_book_statuses
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "ubs_insert_own" on user_book_statuses;
create policy "ubs_insert_own" on user_book_statuses
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "ubs_update_own" on user_book_statuses;
create policy "ubs_update_own" on user_book_statuses
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "ubs_delete_own" on user_book_statuses;
create policy "ubs_delete_own" on user_book_statuses
  for delete to authenticated
  using (user_id = auth.uid());

-- ----- book_notes ---------------------------------------------------
-- Kişisel notlar sadece notu yazan kullanıcıya görünür.
drop policy if exists "notes_select_own" on book_notes;
create policy "notes_select_own" on book_notes
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "notes_insert_own" on book_notes;
create policy "notes_insert_own" on book_notes
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "notes_update_own" on book_notes;
create policy "notes_update_own" on book_notes
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "notes_delete_own" on book_notes;
create policy "notes_delete_own" on book_notes
  for delete to authenticated
  using (user_id = auth.uid());

-- ----- book_holder_history ------------------------------------------
-- Sahiplik geçmişi tüm ev üyelerine görünür.
drop policy if exists "holder_history_select" on book_holder_history;
create policy "holder_history_select" on book_holder_history
  for select to authenticated
  using (true);

drop policy if exists "holder_history_insert" on book_holder_history;
create policy "holder_history_insert" on book_holder_history
  for insert to authenticated
  with check (auth.uid() is not null);
