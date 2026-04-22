import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.formx.ai',
  integrations: [
    sitemap(),
  ],
  redirects: {
    // Note: /post/* redirects are handled by src/pages/post/[...slug].astro
    // .html extension redirects are handled at the hosting platform level
    // (e.g., Netlify _redirects, Cloudflare _redirects, Vercel vercel.json)
  },
  build: {
    format: 'directory',
  },
});
