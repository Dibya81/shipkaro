# ShipKaro website

Marketing site for ShipKaro: "You need it. We ship it."

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · Motion · lucide-react.
Fully static, no database. Deploys to Vercel as-is.

Pages: `/` (home), `/start` (project request form that opens WhatsApp), `/privacy`, and a
custom 404. SEO extras are generated automatically: Open Graph and Twitter images,
favicon and app icons, `sitemap.xml`, `robots.txt` and a web manifest.

---

## Edit the content: `src/config/site.ts`

Everything visible on the site comes from **one file**: `src/config/site.ts`.
Open it, change a value, save. Lines marked `TODO` are placeholders to replace before launch.

| What you want to change | Where in `site.ts` |
| --- | --- |
| Brand name, tagline, production URL, logo path | `brand` |
| WhatsApp number, Instagram handle, email | `contact` |
| Revisions included, advance %, international payment line | `policies` |
| Header links and button label | `nav` |
| Hero pill, headline, subtext, buttons, ticks | `hero` |
| The "Live delivery tracker" card | `tracker` |
| The capability strip | `capabilities` |
| Service cards (and the pills on `/start`) | `services`, `somethingElse` |
| "What we build" heading | `buildSection` |
| Process steps | `processSection` |
| FAQ questions and answers | `faqSection` |
| Orange CTA band | `ctaBand` |
| `/start` page text, form labels, errors | `startPage` |
| Privacy policy | `privacyPage` |
| 404 page | `notFoundPage` |
| Page title, description, keywords | `seo` |

**Before launch, set at least:**

- `contact.whatsappNumber`: country code + number, digits only, e.g. `919876543210`
- `contact.instagram`, `contact.email`
- `brand.url`: your real domain (used for SEO, the sitemap and social cards)
- `policies.revisions`, `policies.internationalPayment`

**Services.** Each card is one object in `services`:

```ts
{ slug: "gym-fitness-management", title: "Gym & Fitness Management",
  description: "Members, plans, attendance and renewals.",
  price: "Custom quote", highlight: false }
```

- `slug` is used in links: the card opens `/start?service=<slug>` with that service preselected.
- `highlight: true` shows the price tag in orange (use it for fixed prices like `"From ₹499"`).
- Add, remove or reorder objects freely; the grid and the `/start` pills follow.

**Logo.** Replace `public/logo.svg`. The header renders it in the current text colour, so use a
single-colour SVG with a transparent background. The favicon, Apple icon and social image
are generated from the same file at build time.

## Light / dark theme

Light is the default. Visitors switch themes with the pull-cord at the top right; the choice is
saved in their browser. All colours are CSS variables in `src/app/globals.css`, under
`:root[data-theme="light"]` and `:root[data-theme="dark"]`. To change the default, edit
`DEFAULT_THEME` in `src/lib/theme.ts` and move the bare `:root` selector in `globals.css`
to the other block.

The cord's sounds can be muted from the footer ("Sound on/off").

---

## Run locally

Needs Node.js 20 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build, the same as Vercel runs:

```bash
npm run build
npm start          # http://localhost:3000
```

Lint: `npm run lint`

## Optional: log form requests to Google Sheets

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SHEETS_WEBHOOK`.
Full Apps Script code and setup steps: [`docs/google-sheets-webhook.md`](docs/google-sheets-webhook.md).
Without it, the form simply opens WhatsApp.

---

## Deploy to Vercel

1. Push this repo to GitHub (or GitLab / Bitbucket).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo. Vercel detects Next.js;
   keep the default settings.
3. Optional: under **Environment Variables**, add `NEXT_PUBLIC_SHEETS_WEBHOOK`.
4. Click **Deploy**.
5. **Analytics:** in the Vercel project, open the **Analytics** tab and click **Enable**.
   The tracking code is already in the site (`@vercel/analytics`).
6. **Custom domain:** Project → **Settings → Domains**. Then set `brand.url` in `site.ts`
   to that domain and push, so the sitemap and social cards use it.

Every push to the main branch redeploys automatically.

## Project structure

```
src/
  config/site.ts          all editable content
  app/                    routes, metadata, icons, sitemap, robots
    globals.css           design tokens (light + dark), theme rope + ink transition CSS
  components/             header, footer, home sections, /start form, theme rope
  lib/
    theme.ts              theme state (data-theme + localStorage)
    ink-transition.ts     the ink-spill theme transition
    rope-sound.ts         synthesized rope sounds (Web Audio)
    whatsapp.ts           wa.me link helpers
docs/google-sheets-webhook.md
public/logo.svg
```
