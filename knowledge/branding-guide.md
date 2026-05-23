# Branding Guide

Branding is centralized so the whole product rebrands from a few places. Always confirm brand
details with the user — never guess a company's identity.

## The four touch points
1. **`dashboard/src/lib/brand.ts`** — `productName`, `productTagline`, `companyName`, `logoSrc`,
   `poweredBy`. Flows into the sidebar header, page copy, and titles.
2. **`dashboard/public/logo.webp`** — the logo image (keep the filename, or update `brand.ts` +
   `index.html`).
3. **`dashboard/src/index.css`** — the `/* === BRAND THEME (edit me) === */` block: HSL color
   tokens (`--background`, `--primary`, `--accent`, `--card`, `--success`, `--warning`, …) and the
   fonts in the `@theme inline` block (imported on line 1).
4. **`dashboard/index.html`** — `<title>`.

## Choosing a palette
- Match the company's brand colors. If only a logo is given, derive a primary + accent from it.
- Adjust warmth to the domain's tone (e.g. legal/finance → trust-y navy/slate or deep brown;
  sales/growth → energetic blue/teal; people/HR → warmer purples).
- Keep contrast and the `success`/`warning`/`destructive` semantics intact.

## Defaults
The template ships a warm/earthy palette with Playfair Display (headings) + DM Sans (body),
Lucide icons only (no emojis), and "Powered by Lyzr AgenticOS" attribution. Keep the attribution
unless the user asks otherwise.
