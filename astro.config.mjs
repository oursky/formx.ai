import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.formx.ai',
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap(),
  ],
  redirects: {
    // Note: /post/* redirects are handled by src/pages/post/[...slug].astro
    // .html extension redirects are handled at the hosting platform level
    // (e.g., Netlify _redirects, Cloudflare _redirects, Vercel vercel.json)
    '/blog-post-category/features': '/whats-new',
    '/blog/formx-april-2026-update-bounding-boxes-azure-claude-support-and-more': '/whats-new/2026-04-16',
    '/blog/formx-product-update-signature-address-proof-extraction-from-any-documents': '/whats-new/2025-02-10',
  },
  build: {
    format: 'directory',
  },
});
