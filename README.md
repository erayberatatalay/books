# Ev Kitaplığım 📚

Ev içi kullanım için tasarlanmış, Türkçe, mobil öncelikli bir fiziksel kitap takip uygulaması. Aile üyeleri kitapları barkod/ISBN ile okutarak veya elle ekleyebilir, kendi okuma durumlarını ve kişisel notlarını tutabilir, kitabın şu an kimde olduğunu takip edebilir.

> Bu uygulama herkese açık bir SaaS değildir. Kayıt olma özelliği yoktur; kullanıcıları yalnızca admin oluşturur.

## Teknolojiler

- **Next.js (App Router)** + **TypeScript**
- **Tailwind CSS**
- **Supabase** (Auth + Postgres + RLS)
- **@zxing/browser** — telefon kamerasıyla barkod/ISBN okuma
- **Harikakitap.com** (birincil) + **Hardcover.app** + **Google Books API** + **Open Library** (yedek) — ISBN ile kitap bilgisi

## Kurulum

### 1. Bağımlılıklar

```bash
npm install
```

### 2. Ortam değişkenleri

`.env.local.example` dosyasını `.env.local` olarak kopyalayın ve doldurun:

```bash
cp .env.local.example .env.local
```

| Değişken | Açıklama |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL'i |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — **sadece server tarafında** kullanılır, client'a gönderilmez |
| `HARDCOVER_API_TOKEN` | **Önerilir (2. kaynak).** [hardcover.app/account/api](https://hardcover.app/account/api) adresinden ücretsiz alınır. |
| `GOOGLE_BOOKS_API_KEY` | **Önerilir (3. kaynak).** [Google Cloud Console](https://console.cloud.google.com/) üzerinden Books API anahtarı oluşturun. |

### ISBN arama kaynakları

Uygulama ISBN ararken sırayla şu kaynakları dener:

| Kaynak | Sıra | API anahtarı | Not |
| --- | --- | --- | --- |
| **Harikakitap.com** | 1 | Gerekmez | Türkçe yayınlar |
| Hardcover.app | 2 | `HARDCOVER_API_TOKEN` | Topluluk kataloğu |
| Google Books | 3 | `GOOGLE_BOOKS_API_KEY` | Uluslararası katalog |
| Open Library | 4 | Gerekmez | Açık veri yedek kaynağı |

> Kitapsec, 1000Kitap ve Sahaf Salih gibi siteler sunucu tarafında bot koruması veya istemci taraflı arama kullandığı için doğrudan entegre edilemedi. Harikakitap'ın `prsearch` uç noktası aynı ISBN'ler için güvenilir sonuç veriyor.

### 3. Veritabanı ve Storage

Supabase projenizde SQL Editor üzerinden migration dosyalarını sırayla çalıştırın:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_book_covers_storage.sql
supabase/migrations/003_books_edit_delete_policies.sql
```

- `001` — tablolar, RLS, profil trigger'ları
- `002` — kitap kapak görselleri için `book-covers` Storage bucket'ı (public okuma)
- `003` — kitap düzenleme (admin veya ekleyen) ve silme (admin) RLS politikaları

Kitap eklenirken harici kapak URL'si varsa sunucu görseli indirip Supabase Storage'a yükler; `books.cover_url` alanı bu kalıcı adrese güncellenir.

### 4. İlk admin kullanıcısı

Kayıt ekranı olmadığı için ilk admini elle oluşturun:

1. Supabase Dashboard → **Authentication → Users → Add user** ile bir kullanıcı oluşturun (email + şifre).
2. SQL Editor'de bu kullanıcının profilini admin yapın:

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'admin@ornek.com');
```

> Not: `handle_new_user` trigger'ı profili otomatik oluşturur. Eğer kullanıcıyı trigger eklenmeden önce oluşturduysanız, profili elle ekleyin:
> ```sql
> insert into profiles (id, full_name, role)
> select id, 'Admin', 'admin' from auth.users where email = 'admin@ornek.com'
> on conflict (id) do update set role = 'admin';
> ```

Artık admin olarak giriş yapıp `/admin/users` sayfasından diğer aile üyelerini ekleyebilirsiniz.

### 5. Geliştirme sunucusu

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışır.

> **Kamera notu:** Barkod tarama (`/books/scan`) için kameraya güvenli bağlam (HTTPS veya `localhost`) gereklidir. Telefonda test ederken Vercel/HTTPS adresi kullanın.

## Vercel'e Deploy

1. Projeyi bir Git deposuna gönderin ve Vercel'e import edin.
2. Vercel proje ayarlarında yukarıdaki dört ortam değişkenini tanımlayın.
3. `SUPABASE_SERVICE_ROLE_KEY`'i yalnızca sunucu tarafı değişkeni olarak ekleyin (`NEXT_PUBLIC_` ön eki vermeyin).
4. Deploy edin.

## Roller

- **admin**: Aile üyesi ekleme, kullanıcıları listeleme, kitap arşivleme, tüm kitapları ve kimde olduklarını görme.
- **member**: Giriş, kitap ekleme, tüm kitapları görme, kendi okuma durumunu/notlarını yönetme, kitabı "bende" işaretleme / rafa geri koyma.

## Klasör Yapısı

```
app/                 # Next.js App Router sayfaları + API route'ları
components/           # UI bileşenleri (layout, books, dashboard, admin, common)
lib/                  # Tipler, sabitler, Supabase client'ları, auth helper'ları, servisler
supabase/migrations/  # Veritabanı şeması + RLS
```
