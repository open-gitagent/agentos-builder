---
name: apply-branding
description: Brand an AgenticOS to a specific company by setting the central brand config, the theme tokens, the logo, and the document title so the whole app reads and looks like the target company's product.
metadata:
  category: build
  version: "1.0.0"
---

# Apply Branding

## When to Use
Early in a build (Step 1), after learning the company name, product name, and brand identity.
Never guess branding — confirm it with the user.

## Inputs Needed
- Company name + product name (e.g. "Acme", "Acme Legal Command").
- Brand colors (or a logo to derive them from); preferred fonts; light/warm vs cool tone.
- A logo image file (or generate/placeholder one).

## Methodology
1. **`src/lib/brand.ts`** — set `productName`, `productTagline`, `companyName`, `logoSrc`,
   `poweredBy`. These flow into the sidebar header, page copy, and titles.
2. **Logo** — replace `public/logo.webp` with the company's logo (keep the filename, or update
   `brand.ts` + `index.html` if you change it).
3. **Theme** — in `src/index.css`, edit the `/* === BRAND THEME (edit me) === */` block: the HSL
   color tokens (`--background`, `--primary`, `--accent`, `--card`, …) and the font families in
   the `@theme inline` block (imported on line 1).
4. **Title** — set `<title>` in `index.html`.

## Output Format
A consistently branded app: sidebar, titles, and palette match the company. Report the brand
values you set and confirm the logo/theme applied.

## Notes
- Branding is the one thing the template intentionally centralizes — touch these four places and
  the whole product rebrands. Keep "Powered by Lyzr AgenticOS" as platform attribution unless
  the user asks otherwise.
