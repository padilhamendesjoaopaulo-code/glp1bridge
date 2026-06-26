# GLP1Bridge.com — Project Context

A niche, ad-supported (Google AdSense) informational site for **Medicare
beneficiaries** researching the **Medicare GLP-1 Bridge program** (informational
launch date in content: **July 1, 2026**). Audience skews 55+, so the site is
built for **clarity, accessibility, and trust**.

> **Not medical or legal advice.** Every page carries a disclaimer. Regulatory /
> factual claims must cite **CMS.gov**, **Medicaid.gov**, or **FDA.gov**.
> Coverage data is illustrative and must be marked "verify with your plan."

## Tech stack (hard rules)
- **Pure HTML + CSS + vanilla JS. No framework, no build step, no external JS/CSS.**
- All styles live in `styles.css` (single design system).
- All shared behavior lives in `script.js` (modules self-guard per page).
- No externally-hosted images — **inline SVG / CSS visuals only**.
- Mobile-first; verify layouts at **375px**.
- Every page: standard **nav, footer, disclaimer band**, working internal links.
- Every page must be listed in `sitemap.xml`.

## Design system (see `styles.css`)
- Palette: teal (`--teal-700`) primary, amber (`--amber-600`) CTA accent.
- Base font 18px, line-height 1.65, WCAG-AA contrast, 44px+ tap targets.
- Components: `.btn`, `.card`, `.callout`, `.badge`, `.steps`, `table.data`,
  `.wizard`, `.calc-grid`, `.chart` (pure-CSS bars), `.faq-item`, `.ad-slot`.

## Pages
**Content pages (carry AdSense):**
`index` · `eligibility` · `cost-calculator` · `covered-drugs` ·
`prior-authorization` · `non-medicare-options` · `weight-projection` ·
`pipeline-drugs` · `faq`

**Trust pages (NO ads):** `about` · `contact` · `privacy` · `terms`

## AdSense (Option A)
- Loader in `<head>` of the 9 content pages only.
- **Publisher ID is a placeholder: `ca-pub-XXXXXXXXXXXXXXXX`** — replace globally
  (and set real `data-ad-slot` IDs) before going live.
- Responsive units (`data-ad-format="auto"`, `data-full-width-responsive`).
- **Never** place ads inside wizard steps or the result screen. Place after the
  intro paragraph and between major sections.

## v2 work completed in this build
- **C** — 50-state Medicaid GLP-1 coverage table on `non-medicare-options.html`
  (sortable + search/status/PA filters). Data illustrative; cite Medicaid.gov/KFF.
- **D** — `weight-projection.html` week-by-week table + pure-CSS bar chart.
- **E** — `pipeline-drugs.html` GLP-1 development tracker.

## Conventions
- Replace `ca-pub-XXXXXXXXXXXXXXXX` and `data-ad-slot="0000000000"` before launch.
- When adding factual claims, append a "Sources" note linking the .gov page.
- Keep nav to the 6 primary links + "Check Eligibility" CTA; footer links all pages.
