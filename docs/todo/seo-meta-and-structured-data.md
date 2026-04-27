# SEO: Meta Descriptions & Structured Data

## Problem 1: 41 Pages Missing Meta Descriptions

The following pages pass `description=""` (empty string) to the SEO component, resulting in empty `<meta name="description">` tags:

### Product pages (7)
- `src/pages/products/data-extraction.astro`
- `src/pages/products/document-workspace.astro`
- `src/pages/products/image-quality-check.astro`
- `src/pages/products/mobile-capture-sdk.astro`
- `src/pages/products/smart-document-classification.astro`
- `src/pages/products/smart-learning.astro`
- `src/pages/products/workflow-automation.astro`

### Solution pages (14)
- All files in `src/pages/solutions/*.astro`

### Tool pages (15)
- All files in `src/pages/tools/*.astro`

### Other pages (3-5)
- `src/pages/pricing.astro`
- `src/pages/schedule-demo.astro` (or `talk-with-us.astro`)
- `src/pages/why-formx.astro`

### How to fix
Each page passes props to the `<SEO>` component. Add a `description` prop with a unique, 120-160 character description that:
- Summarizes what the page is about
- Includes the primary keyword for that page
- Has a clear call-to-action or value proposition

Example:
```astro
<SEO
  title="Invoice OCR API - Extract Invoice Data Automatically | FormX.ai"
  description="Automate invoice data extraction with FormX.ai's OCR API. Extract line items, totals, and vendor details from any invoice format in seconds."
/>
```

## Problem 2: Missing Structured Data (JSON-LD)

Currently only blog posts have structured data (`Article` + `BreadcrumbList` in `BlogPostLayout.astro`).

### Recommended additions

**Homepage (`src/pages/index.astro`):**
- `Organization` schema — company name, logo, social profiles, contact info
- `WebSite` schema with `SearchAction` (if site search exists)

**Product pages:**
- `SoftwareApplication` schema — name, description, offers, operating system, application category

**Pages with FAQ sections (pricing, etc.):**
- `FAQPage` schema — list of questions and answers
- This enables rich FAQ snippets in Google search results

**All pages:**
- `BreadcrumbList` schema — already done for blog, extend to products/solutions/tools

### Implementation
Create reusable Astro components for each schema type:
- `src/components/head/OrganizationSchema.astro`
- `src/components/head/FAQSchema.astro`
- `src/components/head/SoftwareAppSchema.astro`
- `src/components/head/BreadcrumbSchema.astro` (generalize from BlogPostLayout)

Include them in the `<head>` of relevant pages.

### Validation
- Use Google's Rich Results Test: https://search.google.com/test/rich-results
- Use Schema.org validator: https://validator.schema.org/
