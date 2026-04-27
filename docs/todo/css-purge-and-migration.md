# CSS Purge & Migration Plan

## Problem

`src/styles/main.css` is a 444KB (21,773 lines) Webflow export loaded on every page. In the build output it becomes `PageLayout.K3B4yoDt.css` at 364KB. Most CSS classes are unused on any given page since the entire stylesheet is imported globally via `BaseLayout.astro`:

```js
import '@/styles/main.css'
```

The file contains:
- A full CSS reset/normalize
- Webflow framework classes (`.w-container`, `.w-tab-link`, `.w-dropdown`, etc.) — 1,438 lines reference `w-` prefixed selectors
- 22 `@media` queries
- Page-specific Webflow node ID selectors (e.g., `#w-node-_4fab2caa-...`) for grid layouts
- No CSS custom properties or design tokens

## Recommended Approach

### Step 1: Add PurgeCSS to the build pipeline
- Install `@fullhuman/postcss-purgecss` or use Astro's PostCSS integration
- Configure it to scan all `.astro` files in `src/` for class usage
- Safelist dynamic classes (e.g., Webflow `w-` classes used in JS tab/accordion logic)
- Expected savings: 50-70% of the CSS payload (150-250KB)

### Step 2: Extract page-specific styles into Astro components
- Identify sections of `main.css` that only apply to specific pages
- Move those styles into `<style>` blocks in the corresponding `.astro` component files
- Astro automatically scopes these styles and only ships them when the component is rendered

### Step 3: Replace Webflow framework classes
- Gradually replace `.w-container`, `.w-row`, `.w-col-*` with modern CSS (grid/flexbox)
- Remove the Webflow normalize/reset in favor of a minimal modern reset
- Remove all `#w-node-*` ID selectors by replacing Webflow grid layouts with CSS Grid

### Step 4: Introduce design tokens
- Create CSS custom properties for colors, spacing, typography
- Replace hardcoded values throughout `main.css`
- This makes the remaining CSS more maintainable

## Key Files
- `src/styles/main.css` — the monolithic stylesheet
- `src/styles/global.css` — small global overrides (532 bytes, fine as-is)
- `src/styles/blog.css` — blog-specific styles (1.3KB, fine as-is)
- `src/layouts/BaseLayout.astro` — imports main.css globally

## Risks
- PurgeCSS may aggressively remove classes used by JavaScript (tab switching, accordion, dropdown logic in BaseLayout's inline scripts). These must be safelisted.
- Webflow's `w-` classes are deeply intertwined with layout — removing them requires testing every page.
