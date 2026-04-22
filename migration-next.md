# FormX.ai Webflow → Astro Migration — Handoff Plan

## Current State (2026-04-22)

The Astro project scaffolding is complete and `npm run build` passes (222 pages). However, the site is still heavily dependent on Webflow CDN for all images, CSS, JS, and favicons.

### What is done

- **Content collections**: 118 blog posts + 11 what's-new entries fully migrated to markdown with Zod-validated frontmatter
- **Layout architecture**: `BaseLayout` → `PageLayout` → `BlogPostLayout` / `WhatsNewLayout`, all with SEO props
- **Components**: Header (mega-dropdown nav), Footer, FooterForm, CookieConsent, SEO, Analytics, FontLoader, JsonLd, BlogCard, RelatedArticles, WhatsNewCard
- **Listing pages**: Blog listing, blog category pages, what's-new listing — all native Astro
- **Dynamic routes**: `blog/[...id].astro`, `whats-new/[...id].astro`, `blog-post-category/[category].astro`
- **Legacy redirects**: `post/[...slug].astro` handles 37 old `/post/*` → `/blog/*` 301 redirects
- **Sitemap + robots.txt**: Generated via `@astrojs/sitemap`

### What still needs work

| # | Task | Scope | Priority |
|---|------|-------|----------|
| 1 | Download images from Webflow CDN | ~475 references across src/ | **P0** |
| 2 | Self-host CSS + JS + favicons | BaseLayout loads CSS/JS/jQuery from CDN | **P0** |
| 3 | Fix broken links in markdown | 7 blog posts with `../post/` relative links | **P1** |
| 4 | Fix broken `.html` links in static pages | 3 pages (index, pricing, why-formx) | **P1** |
| 5 | Fill empty what's-new descriptions | All 11 entries have `description: ""` | **P1** |
| 6 | Configure hosting-level `.html` redirects | Not yet in repo | **P2** |
| 7 | Rewrite static pages to native Astro | 52 of 58 pages are raw HTML injection | **P3** |
| 8 | Remove jQuery / Webflow JS dependency | Currently needed for dropdown interactions | **P3** |
| 9 | Clean up unused local CSS files | `webflow.css`, `global.css`, `blog.css` are unused | **P3** |

---

## Task Details

### Task 1: Download images from Webflow CDN (P0)

All images are currently loaded from `cdn.prod.website-files.com`. If the Webflow project is unpublished, every image on the site breaks.

**Steps:**

1. Write a script that crawls all files under `src/` and extracts unique `cdn.prod.website-files.com` URLs
2. Download each image to `public/images/` organized by type:
   - Blog featured images + inline images → `public/images/blog/`
   - What's-new images → `public/images/whats-new/`
   - Nav/footer/header images → `public/images/ui/`
   - Product/solution/tool page images → `public/images/pages/`
3. Update all references in:
   - `src/content/blog/*.md` frontmatter (`featured_image`, `og_image`) and inline markdown images
   - `src/content/whats-new/*.md` frontmatter
   - `src/pages/*.astro` (the `set:html` content strings)
   - `src/components/header/Header.astro`, `src/components/footer/Footer.astro`, `src/components/footer/CookieConsent.astro`
   - `src/layouts/BlogPostLayout.astro` (JSON-LD logo URL)
   - `src/lib/constants.ts` (`SITE_DEFAULT_OG_IMAGE`)
4. Update favicons in `BaseLayout.astro` to point to `public/` copies

**Key files:**
- `src/layouts/BaseLayout.astro` (favicon links, CSS link)
- `src/lib/constants.ts` (default OG image)
- `src/components/header/Header.astro` (~104KB, contains inline SVGs and CDN image refs)
- `src/components/footer/Footer.astro` (logo, cert badge images)
- All 118 `src/content/blog/*.md` files
- All 11 `src/content/whats-new/*.md` files
- All 52 `src/pages/*.astro` static pages

**Verification:** After migration, `grep -r "cdn.prod.website-files.com" src/` should return zero results.

---

### Task 2: Self-host CSS, JS, and favicons (P0)

Currently in `src/layouts/BaseLayout.astro`:
- Webflow CSS loaded from CDN (line ~62)
- jQuery 3.5.1 from CloudFront CDN (line ~103)
- 3 Webflow JS chunks from CDN (lines ~108-120)

**Steps:**

1. The Webflow CSS is already downloaded at `src/styles/webflow.css` (368KB). Switch the `<link>` in BaseLayout from CDN URL to a local import: `import '@/styles/webflow.css';`
2. Download jQuery and Webflow JS bundles to `public/js/`:
   - `public/js/jquery-3.5.1.min.js`
   - `public/js/webflow.schunk.36b8fb49256177c8.js`
   - `public/js/webflow.schunk.79f07b56103b3684.js`
   - `public/js/webflow.3280186d.8489436c61fc6cc7.js`
3. Update `<script src="...">` tags in BaseLayout to point to local copies
4. Download favicons to `public/`:
   - `public/favicon-32x32.png`
   - `public/favicon-256x256.png`
5. Remove the now-unused `<link href="https://cdn.prod.website-files.com" rel="preconnect">` tag
6. Remove the duplicated inline `<style>` blocks in BaseLayout that duplicate `global.css` and `blog.css` — import those files instead

**Key file:** `src/layouts/BaseLayout.astro`

**Verification:** Build the site, then `grep -r "cdn.prod.website-files.com" dist/ | grep -v "images/"` should return zero results (assuming images are handled separately).

---

### Task 3: Fix broken links in markdown (P1)

7 blog posts contain relative `../post/` or `../blog/` links that won't resolve correctly:

- `src/content/blog/invoice-data-capture.md`
- `src/content/blog/bank-statement-ocr.md`
- `src/content/blog/document-classification.md`
- `src/content/blog/financial-data-extraction.md`
- `src/content/blog/invoice-digitization-automate-invoice-processing.md`
- `src/content/blog/extract-table-from-pdf.md`
- `src/content/blog/invoice-parsing.md`

**Fix:** Search-and-replace:
- `../post/SLUG.html` → `/blog/SLUG`
- `../blog/SLUG.html` → `/blog/SLUG`
- Any remaining `SLUG.html` → `/blog/SLUG`

**Verification:** `grep -r "\.\./post/\|\.\.blog/" src/content/` should return zero results.

---

### Task 4: Fix broken `.html` links in static pages (P1)

3 pages have `.html` extension links in their injected HTML:
- `src/pages/index.astro`
- `src/pages/pricing.astro`
- `src/pages/why-formx.astro`

**Fix:** In each file's `const content = '...'` string, replace:
- `href="talk-with-us.html"` → `href="/talk-with-us"`
- `href="tools/invoice-ocr-api.html"` → `href="/tools/invoice-ocr-api"`
- `href="index.html#"` → `href="/#"`
- Any other `*.html` href patterns

**Verification:** `grep -r '\.html"' src/pages/ | grep -v 'node_modules'` should return zero results (except for any legitimate external URLs).

---

### Task 5: Fill empty what's-new descriptions (P1)

All 11 `src/content/whats-new/*.md` files have `description: ""`. This hurts SEO (empty meta description).

**Fix:** For each entry, write a 1-2 sentence description summarizing the release. These can be derived from the first paragraph of the markdown content or from the listing page card descriptions that were in the original Webflow HTML.

**Files:** All 11 files in `src/content/whats-new/`

---

### Task 6: Configure hosting-level `.html` redirects (P2)

When the site goes live, old Webflow URLs with `.html` extensions need to redirect to the clean Astro URLs. This is **not handled in the Astro build** — it must be configured at the hosting platform.

**For Netlify**, create `public/_redirects`:
```
/index.html           /           301
/blog.html            /blog       301
/pricing.html         /pricing    301
/why-formx.html       /why-formx  301
# ... etc for all root pages
/products/*.html      /products/:splat  301
/solutions/*.html     /solutions/:splat  301
/tools/*.html         /tools/:splat      301
/blog/*.html          /blog/:splat       301
/whats-new/*.html     /whats-new/:splat  301
```

**For Cloudflare Pages**, use `public/_redirects` with the same syntax.
**For Vercel**, use `vercel.json` with redirect rules.

---

### Task 7: Rewrite static pages to native Astro (P3)

52 pages use `<Fragment set:html={content} />` with raw Webflow HTML strings. This works but:
- The HTML contains Webflow animation data attributes and classes that do nothing without Webflow JS
- The content can't be edited visually or easily maintained
- Component reuse is impossible (e.g., shared CTA sections, feature grids)

**Recommended approach:** Rewrite pages incrementally, starting with the most-visited:
1. **Homepage** (`index.astro`) — highest traffic, most complex
2. **Pricing** (`pricing.astro`) — has custom JS for pricing calculator
3. **Product pages** (7 pages) — likely share common section patterns
4. **Solution pages** (14 pages) — may share a common template
5. **Tool pages** (15 pages) — likely share a converter tool template
6. **Document pages** (6 pages)
7. **Legal pages** (3 pages) — simplest, just text content
8. **Other root pages** (4 pages)

For each page:
- Extract the content from the `const content = '...'` string
- Identify reusable sections (hero, feature grid, CTA, testimonials)
- Create shared components where patterns repeat
- Write native Astro markup

This is the largest remaining task and can be done incrementally — the `set:html` pages work correctly in the meantime.

---

### Task 8: Remove jQuery / Webflow JS dependency (P3)

`BaseLayout.astro` loads jQuery 3.5.1 and 3 Webflow JS chunks. These are needed for:
- Header dropdown interactions (`w-dropdown`, `w-nav`)
- Cookie consent (`fs-cc` attributes)
- Form handling (`w-form`)
- Select placeholder color script

**Approach:**
1. Rewrite header dropdowns using CSS-only or lightweight JS (no jQuery)
2. The Finsweet cookie consent library is standalone and doesn't need jQuery
3. Form handling can use native HTML validation + a simple fetch submit
4. The select placeholder script is 20 lines and can be converted to vanilla JS

**Blocked by:** Task 7 (native Astro page rewrites) — no point removing jQuery while 52 pages still contain Webflow HTML that may depend on it.

---

### Task 9: Clean up unused local CSS files (P3)

Three files in `src/styles/` appear unused:
- `webflow.css` (368KB) — downloaded copy of Webflow CSS, not imported anywhere (CSS is loaded from CDN in BaseLayout)
- `global.css` (32 lines) — content duplicated as inline `<style>` in BaseLayout
- `blog.css` (51 lines) — content duplicated as inline `<style>` in BaseLayout

**After Task 2** (self-hosting CSS), `webflow.css` will be imported. At that point, `global.css` and `blog.css` can be imported too, and the duplicate inline styles in BaseLayout removed.

---

## Recommended Execution Order

```
Phase 1 (unblock launch):
  Task 1  →  Task 2  →  Task 3 + 4 + 5 (parallel)  →  Task 6

Phase 2 (quality improvement, can be incremental):
  Task 7 (page by page)  →  Task 8  →  Task 9
```

Phase 1 makes the site independent of Webflow CDN and fixes broken links — after that, it's deployable.

Phase 2 improves maintainability and performance — can be done over time.

---

## Quick Reference: Key Files

| Purpose | Path |
|---------|------|
| Astro config | `astro.config.mjs` |
| Content schemas | `src/content.config.ts` |
| Base layout (head, scripts, analytics) | `src/layouts/BaseLayout.astro` |
| Page layout (header + footer wrapper) | `src/layouts/PageLayout.astro` |
| Blog post template | `src/layouts/BlogPostLayout.astro` |
| What's-new template | `src/layouts/WhatsNewLayout.astro` |
| Header nav (~104KB with SVGs) | `src/components/header/Header.astro` |
| Footer grid | `src/components/footer/Footer.astro` |
| Footer CTA form | `src/components/footer/FooterForm.astro` |
| Cookie consent | `src/components/footer/CookieConsent.astro` |
| SEO meta tags | `src/components/head/SEO.astro` |
| Site constants | `src/lib/constants.ts` |
| Blog helpers | `src/lib/blog.ts` |
| Post redirects | `src/pages/post/[...slug].astro` |
| Webflow CSS (local copy) | `src/styles/webflow.css` |
