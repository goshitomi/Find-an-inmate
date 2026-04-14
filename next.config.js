/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["books.google.com", "covers.openlibrary.org"],
  },
};

module.exports = nextConfig;
