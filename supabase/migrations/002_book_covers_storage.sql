-- =====================================================================
-- Kitap kapak görselleri için Supabase Storage bucket
-- =====================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'book-covers',
  'book-covers',
  true,
  5242880,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Herkes kapak görsellerini okuyabilir (public bucket)
drop policy if exists "book_covers_public_read" on storage.objects;
create policy "book_covers_public_read" on storage.objects
  for select to public
  using (bucket_id = 'book-covers');
