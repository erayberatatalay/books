-- Kitap metadata düzenleme: admin veya kitabı ekleyen kişi
-- Kitap silme: yalnızca admin

drop policy if exists "books_update_admin" on books;
create policy "books_update_admin_or_creator" on books
  for update to authenticated
  using (public.is_admin() or created_by = auth.uid())
  with check (public.is_admin() or created_by = auth.uid());

drop policy if exists "books_delete_admin" on books;
create policy "books_delete_admin" on books
  for delete to authenticated
  using (public.is_admin());
