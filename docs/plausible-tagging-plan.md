# Plausible Analytics Tagging Plan

> How conversions are tracked on the FormX.ai marketing site. It follows the same model as
> authgear.com: a few canonical events, each carrying a `location` property that names the
> button. Plausible is loaded with `script.tagged-events.js` in
> `src/components/head/Analytics.astro`.

## How links get tagged

Links are **not** tagged by hand. On page load, `Analytics.astro` finds every link to a
conversion destination and adds `plausible-event-name--<event>` and
`plausible-event-location--<location>` classes. A CTA added anywhere — a page, a component,
blog markdown — is counted automatically.

| Event | Destination that triggers it |
|-------|------------------------------|
| `signup` | `formextractorai.com/signup` |
| `login` | `formextractorai.com/login` |
| `get-demo` | `/schedule-demo/` on this site, or any `calendly.com` link |

`location` is resolved in this order:

1. `data-plausible-location` on the link or an ancestor, used as is (e.g. `pricing-cards`).
2. `nav-header` for anything inside the site header.
3. `<page>-<section>`, where `<page>` comes from the URL (`home`, `tool`, `post`, `pricing`,
   `solution`, `landing`, `story`, `whats-new`, `schedule-demo`, else `page`) and `<section>`
   is the nearest `data-plausible-section` (`hero`, `cta-card`, `footer-form`, `story-cta`),
   else `footer`, else `inline` inside blog/what's-new body text, else `body`.

Examples: `tool-cta-card`, `home-hero`, `post-inline`, `tool-footer-form`, `pricing-body`.

To give a new CTA its own location, add `data-plausible-location="…"` to it. To name a new
reusable block, add `data-plausible-section="…"` to its root element.

## Form submissions

| Event | Where | Props |
|-------|-------|-------|
| `contact-form-submit` | Demo forms, after the Netlify POST succeeds and before the redirect to Calendly | `location` = `schedule-demo-page` \| `footer-form` \| `landing-hero` |

The Calendly booking itself happens on calendly.com and is not tracked.

## Plausible goals

| Goal | Type | Notes |
|------|------|-------|
| `signup` | Event | Split by `location` |
| `login` | Event | Split by `location` |
| `get-demo` | Event | Split by `location` |
| `contact-form-submit` (shown as "Submit Schedule Demo") | Event | The demo conversion |
| `Visit Schedule Demo` | Page `/schedule-demo/` | Matches the trailing-slash URL |

`location` must be registered as a custom property in Plausible for the split to show.

## History

- **`Signup` (capital S) stopped in January 2026.** It tagged a single element,
  `#primary-cta-b`, which no longer exists. It is kept for history; new clicks go to `signup`.
- **`Visit /schedule-demo` stopped in May 2026.** It matched `/schedule-demo`, and the site
  moved to trailing-slash URLs on 2026-05-06. Kept for history; use `Visit Schedule Demo`.
- Header "Sign In" (mobile menu) links to the signup page, so its clicks count as `signup` at
  `nav-header`.
