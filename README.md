# Ovoko BE landing page (FR)

Static site with no build step. Open `index.html` in a browser to preview it.

## Pages
- `index.html`: full page
- `simple.html`: short version

## Hero A / Hero B
Both pages include both heroes:
- Hero A is the default.
- Hero B loads when you add `?hero=b` to the URL, e.g. `index.html?hero=b`.

Use the two URLs as the two ad variants.

## Tracking
- UTM parameters and click IDs (fbclid, gclid) on the landing URL are passed through to every ovoko.be link.
- When the landing URL has none, links get `utm_source=landing&utm_medium=lp_be_fr`.
- Every CTA click sends `fbq('trackCustom','OutboundClick',{cta})` and pushes `outbound_click` to `dataLayer`.
- The hero listing cards count as CTAs too (`hero-card-*`).
- Paste the Meta Pixel base code where the `<!-- Meta Pixel -->` comment is, in the `<head>` of both pages.

## Motion
- Numbers count up and price bars grow when they scroll into view.
- Cards and photos drift slightly and follow the mouse on desktop.
- Sliders loop endlessly (swipe, arrows and dots). Lists that would stack on phones become swipe sliders.
- All motion switches off for visitors with "reduce motion" enabled. Without JavaScript the page shows its final state.

## Photos
The photos of people at work come from two sources:
- the Ovoko official brand book;
- stills from the Le Transporteur partner video.

## SEO & sharing
- Title, description, canonical, Open Graph and Twitter tags, plus WebPage/Organization JSON-LD, are set on both pages.
- The share image is `assets/img/og-image.jpg` (1200×630).
- Icons: `favicon.ico`, an SVG favicon, `apple-touch-icon`, and 192/512 PNGs in `site.webmanifest`.
- `index.html` is indexable. `simple.html` is `noindex, follow` because it is an A/B variant of the same page.
- `robots.txt` and `sitemap.xml` are included.
- Absolute URLs use `https://ovoko-be-landing.vercel.app`. Find and replace it if the page moves to another domain.

## Deploy (about 1 minute)
- **Vercel:** go to vercel.com/new, choose "Deploy" with no framework, and drag this folder in.
- **Netlify:** drag this folder onto app.netlify.com/drop.
- **Any static host:** upload the folder as it is. The paths are relative.

## Press logos
The logos in `assets/press/` come from these sources:
- La Voix du Nord, RFI and MSN: Wikimedia Commons.
- Les Numériques: the logo on its own site.
- Le Journal de l'Automobile: traced from the logo on its site.

## Before going live
- FAQ questions 2–6 need a native French proofread.
- "100 % entreprises vérifiées": needs a confirmed source.
- The 76 % footnote: confirm what the study compared.
