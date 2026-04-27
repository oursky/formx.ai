# Tailwind + `main.css` migration inventory

Reference: [`src/styles/main.css`](../../src/styles/main.css) (~21.6k lines, Webflow export). Tokens live in `:root` around lines **1712–1742**.

## CSS custom properties (mirror in Tailwind `@theme`)

| Token | Usage |
| --- | --- |
| `--primary-formx-green`, `--typography-heading`, `--typography-body`, `--typography-link` | Brand / text |
| `--neutral-*`, `--primary-green-*`, `--secondary-*` | Surfaces, accents |
| `--footer-blue`, `--footer-list-title` | Footer |

Tailwind entry: [`src/styles/tailwind.css`](../../src/styles/tailwind.css) — `@theme` maps **formx-***, **neutral-***, **primary-green-***, **secondary-***, **gray-300**, and accent tokens to the same `var(--*)` names in `main.css` `:root` (use utilities like `text-neutral-600`, `bg-primary-green-20`).

## Layout primitives (migrate in order)

1. **Chrome (slice 1 — started)**  
   - Components: [`Header.astro`](../../src/components/header/Header.astro), [`Footer.astro`](../../src/components/footer/Footer.astro)  
   - Legacy hooks: `.header` (~2671), `.header-logo` (~2681), `.container-header` (~4352), `.footer-logo-container` (~2751), `.nav-menu` (~2733), `.footer` / `.footer-grid-v2` (search in `main.css`).  
   - Tailwind: `min-w-0`, `max-w-full`, `img-fluid` / `img-icon` on key images.

2. **Page shell**  
   - [`PageLayout.astro`](../../src/layouts/PageLayout.astro) — `.page-wrapper`  
   - Containers: `.container-default`, `.w-container` (many pages).

3. **Sections & marketing blocks**  
   - `.section`, `.product-hero`, `.product-2-block-*`, `._2-block-flex*`, `.button-primary`, card grids (`._3-block-grid`, `._4-block-grid`), tabs (`.w-tab-*`, `.home-tabs-menu`).

4. **Blog / what’s new**  
   - [`blog.css`](../../src/styles/blog.css), `.rt-post`, `.whats-new-content` — align with Tailwind utilities over time.

5. **Low priority / likely removable later**  
   - `.styleguide-*` (no `.astro` references found) — candidate for a dedicated purge pass after visual QA.

## Completed removals from `main.css`

- `@media (max-width: 991px)` global `img { width: auto; }` (was ~13975–13977) — broke fluid columns.  
- `@media (max-width: 479px)` global `img { width: 56px; }` (was ~18272–18274) — forced all images to 56px on small screens.
- `.page-wrapper` base + `.page-wrapper.relative.overflow-visible` + mobile `.page-wrapper` overrides — moved to Tailwind utilities on [`PageLayout.astro`](../../src/layouts/PageLayout.astro) (`relative`, `overflow-hidden`, `max-[479px]:overflow-visible`, `min-w-0`, `max-w-full`).
- `.footer-with-form` margin / transparent background rules — replaced by Tailwind on [`FooterForm.astro`](../../src/components/footer/FooterForm.astro) (`-mt-[60px]`, `max-[767px]:-mt-10`, `bg-transparent`).

## Utilities / components

| Class | Role |
| --- | --- |
| `img-fluid` | `max-w-full` + `h-auto` |
| `img-fluid-block` | + `w-full` (heroes, columns) |
| `img-fluid-cover` | + `object-cover` (avatars / thumbs) |
| `img-icon` | Icons / small SVGs (`shrink-0`, no stretch) |

Optional wrapper: [`ResponsiveImage.astro`](../../src/components/shared/ResponsiveImage.astro).

## Next slices (suggested)

1. Rebuild header layout (flex, breakpoints) in Tailwind; delete matching `.header` / `.nav-menu` / `.container-header` rules from `main.css`.  
2. Same for footer grid and typography.  
3. Extract repeated section wrappers into Astro partials + Tailwind; trim `.product-*` and `._2-block-*` in chunks with `npm run build` + visual diff after each chunk.

---

## Tailwind-first conventions (utilities over custom CSS)

These rules apply to **new and refactored** UI. Legacy `main.css` remains until each slice removes its selectors.

### Defaults

- **Layout, spacing, flex/grid, typography, responsive behavior:** prefer **Tailwind utilities** on the element in `.astro` (e.g. `flex`, `gap-6`, `max-w-full`, `min-w-0`, `max-[991px]:flex-col`).
- **Colors:** use theme-backed utilities from [`tailwind.css`](../../src/styles/tailwind.css) `@theme` (e.g. `text-formx-heading`, `bg-formx-footer`, `text-neutral-600`) so values stay tied to `main.css` `:root` tokens until tokens move fully into `@theme`.

### When not to use raw utilities

- If the **same utility cluster appears 3+ times**, add **one** helper in `tailwind.css` under `@layer components` using `@apply` (same pattern as `img-fluid*`).
- If something is **impossible or unreadable** with utilities alone, use a **small** co-located stylesheet for that component—avoid growing `global.css`.

### `global.css`

- **Do not** add new rules here except **cross-cutting** concerns (skip link, honeypot, Webflow container pseudo-elements, or fixes that must load after `main.css` until the owning slice migrates).
- When a slice replaces behavior with utilities, **delete** the matching `global.css` rule in the same change.

### Legacy Webflow class names

- Keep classes like `_2-block-flex`, `w-container`, `button-primary` while `main.css` still defines them.
- Add Tailwind classes **alongside** them to adjust layout; remove Webflow classes only in the same PR as deleting their `main.css` rules.

### Verification

- After each slice: spot-check **375px**, **991px**, desktop; run **`npm run build`**.

---

## Preflight milestone (Tailwind base reset)

Tailwind **Preflight** is **off** (`tailwind.css` imports only `tailwindcss/theme` + `tailwindcss/utilities`) because [`main.css`](../../src/styles/main.css) still ships Webflow resets and element rules; turning Preflight on now would **double-reset** typography, buttons, and images.

**To enable later:** when `main.css` is small enough (or limited to non-conflicting widgets), switch the Tailwind entry to `@import "tailwindcss";` (full bundle) **or** add `@import "tailwindcss/preflight" layer(base);` **before** utilities, then run visual regression on blog, home, pricing, and one product page before merging.
