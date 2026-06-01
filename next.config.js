/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "books.google.com" },
      { protocol: "http", hostname: "books.google.com" },
      { protocol: "https", hostname: "covers.openlibrary.org" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "www.harikakitap.com" },
      { protocol: "https", hostname: "cdn.kitapsec.com" },
      { protocol: "https", hostname: "www.sahafsalih.com" },
      { protocol: "https", hostname: "cdn1.dokuzsoft.com" },
      { protocol: "https", hostname: "cdn2.dokuzsoft.com" },
      { protocol: "https", hostname: "www.kitapvekahve.com" },
      { protocol: "https", hostname: "img.kitapyurdu.com" },
    ],
  },
};

module.exports = nextConfig;
