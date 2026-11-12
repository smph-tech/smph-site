# smph.tech website

Marketing site for smph.tech. Next.js 15 (App Router), TypeScript, Tailwind CSS v4.
The "Book a free call" form saves every enquiry as a row in a Google Sheet (through a Google Apps Script), and can optionally email the owner.

- Pages: `/`, `/services`, `/services/[slug]` (5 services), `/how-we-work`, `/about`, `/contact`, `/thank-you`
- No database, CMS, analytics or cookie banner.
- Hosting target: Vercel. It also runs on Netlify or any Node server (`pnpm build && pnpm start`).

## Quick start

```bash
pnpm install
cp .env.example .env.local      # optional in development, see "Running without keys"
pnpm dev                        # http://localhost:3000
```

If `pnpm` is missing, run `corepack enable pnpm` (Node 18+), or use `npm install` and `npm run <script>` instead.

| Script                                                                                         | What it does                                                                                                             |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`                                                                                     | Dev server                                                                                                               |
| `pnpm build` / `pnpm start`                                                                    | Production build and server                                                                                              |
| `pnpm typecheck`                                                                               | TypeScript, strict                                                                                                       |
| `pnpm lint`                                                                                    | ESLint                                                                                                                   |
| `pnpm test`                                                                                    | Unit tests (zod schema, sheet-row sanitiser, rate limit, email, enquiry logic)                                           |
| `pnpm assets`                                                                                  | Regenerates favicon, app icons, Apple touch icon and `public/og.png` from the logo tile                                  |
| `pnpm shots`                                                                                   | Full-page screenshots of every route next to its design reference, with a pixel-diff (needs a running server, see below) |
| `pnpm e2e phone` / `links` / `ui` / `tracker` / `contact-links` / `form-success` / `form-fail` | Playwright click-tests (needs a running server)                                                                          |
| `pnpm check:content`                                                                           | After a build: fails on banned words/links and on any `[placeholder]` missing from `CONFIRM.md`                          |

Playwright scripts need Chromium once: `pnpm exec playwright install chromium`.

```bash
pnpm build && pnpm start -p 3100 &
pnpm shots            # writes shots/site-*.png and shots/ref-*.png
pnpm e2e links
```

## Editing content

All copy lives in [`content.json`](content.json) and is loaded through `src/content/*.ts`.
Change a sentence there and rebuild. Inline markup in strings:

- `<grad>word</grad>` gradient headline word
- `<em>word</em>` emphasis
- `[anything in brackets]` a placeholder. It stays visible on the page until you replace it.

Contact details (phone, email, Instagram, WhatsApp channel, reply time), each service's colours, scene image and tool logos, and each stage's colours are set in
[`src/content/site.ts`](src/content/site.ts), in one place. Everything still to be confirmed is listed, with
the page and exact text, in [`CONFIRM.md`](CONFIRM.md).

Team photos: `public/photos/`. Hero 3D image: `public/3d/hero.png`. Service scene images: `public/images/scenes/`. Brand logos for tools: `public/images/tech/` (listed per service in `site.ts`; only keep logos for tools you really use). Logo: `public/logo/logo-tile-720.png`.
The design references are kept in `design-handoff-v4/` (current) and `design-handoff/` (earlier). `pnpm shots` compares the site with `design-handoff-v4/reference`.

## How the contact form works

1. The browser validates with the shared zod schema ([`src/lib/contact-schema.ts`](src/lib/contact-schema.ts)).
2. It posts to `/api/contact` ([`src/app/api/contact/route.ts`](src/app/api/contact/route.ts)), which validates again with the same schema.
3. Bots are dropped quietly (they get a normal-looking `200`): a filled hidden field, or a post made less than 3 seconds after the page opened.
4. Rate limit: 5 submissions per IP per 10 minutes.
5. The server POSTs the enquiry to your Google Apps Script web app, which adds the row to the sheet. It counts as saved only if the script answers `{ "ok": true }`.
6. If email is configured (it is optional, see below), the owner is emailed at the same time. The visitor sees success if the save worked, or the email went out. If neither worked they see a friendly message with the email address, and the server logs the reason. Stack traces and secrets are never sent to the browser.
7. One log line per submission: `{"evt":"contact","id":"SMPH-1A2B3C4D","sheet":"ok","email":"skipped","ok":true,"ms":412}`. No names, numbers or messages are logged.

**Fields:** Name, Mobile number, Email (all required), Service (optional), "What is the problem?" (required, 10 to 2000 characters), plus a hidden honeypot and timestamp.

**Mobile numbers.** Spaces and hyphens are removed before checking. Accepted: an Indian number (10 digits starting 6 to 9, optionally with `+91`, `91` or `0` in front), or an international number starting with `+` and 8 to 15 digits.

Spreadsheet safety: free-text values starting with `=`, `+`, `-` or `@` are stored with a leading `'` so they cannot run as a formula, and the Apps Script writes every cell as plain text. HTML in the email body is escaped.

**Rate limit note.** The limiter is an in-memory map, so it works per server instance.
On Vercel (many instances) it is a speed bump, not a hard limit. For a hard limit, replace
`src/lib/rate-limit.ts` with Upstash Redis (`@upstash/ratelimit`) or Vercel KV.

### Running without keys (development)

With no `APPS_SCRIPT_URL` and no email settings, and `NODE_ENV=development`, the API prints the enquiry to the
terminal with a `[dev] not sent` line and returns success, so you can build and test the form without any accounts.
In production, missing settings are logged as errors on every submission and, if nothing can save the enquiry,
the visitor sees the failure message.

> **Careful when testing locally.** If `.env.local` contains a real `APPS_SCRIPT_URL`, test submissions go into your real sheet. To test without that, start the server with the variables blanked: `APPS_SCRIPT_URL= APPS_SCRIPT_SECRET= pnpm dev`.

## Setup guide: Google Sheet with Apps Script (step by step)

This replaces service-account keys, which many Google organisations block. The script runs as you,
inside your own sheet. It takes about 10 minutes, once.

1. **Create the sheet.** Go to <https://sheets.google.com> and create a blank spreadsheet, e.g. `smph.tech enquiries`. You can leave it empty. The script creates a tab named `Enquiries` and the header row on the first enquiry.
2. **Open the script editor.** In the sheet, **Extensions > Apps Script**. A new tab opens with a file called `Code.gs`.
3. **Paste the script.** Delete everything in `Code.gs`, then paste the whole contents of [`apps-script/Code.gs`](apps-script/Code.gs) from this repo. Click the save icon. (Rename the project to `smph.tech enquiries` if you like.)
4. **Set the secret.** Make up a long random string (30 or more letters and numbers; a password manager can generate one). In the Apps Script editor click the gear icon (**Project Settings**), scroll to **Script Properties**, **Add script property**: name `SECRET`, value your string, then **Save script properties**. Keep this string; you need it again in step 8.
5. **Deploy as a web app.** Click **Deploy > New deployment**. Click the gear next to "Select type", choose **Web app**. Set **Description** to `v1`, **Execute as** to **Me**, and **Who has access** to **Anyone**. Click **Deploy**.
6. **Authorise.** Google asks for permission the first time: **Authorize access**, pick your account. If you see "Google hasn't verified this app", click **Advanced**, then **Go to smph.tech enquiries (unsafe)**, then **Allow**. This is your own script writing to your own sheet.
7. **Copy the web app URL.** It is shown after deploying and ends in `/exec`, like `https://script.google.com/macros/s/AKfy.../exec`. Copy it.
8. **Set the environment variables:** `APPS_SCRIPT_URL` = the `/exec` URL, `APPS_SCRIPT_SECRET` = the same secret string as in step 4. Locally put them in `.env.local`; on Vercel see "Deploy" below.
9. **Quick check.** Open the `/exec` URL in a browser. You should see `{"ok":true,"service":"smph-enquiries"}`.

The secret is what stops strangers from adding rows to your sheet: a request without the right `secret` is refused. Anyone can reach the `/exec` URL, which is why the secret matters. Do not share the URL and secret publicly, and never commit `.env.local`.

**If you change the script later**, use **Deploy > Manage deployments > pencil icon > Version: New version > Deploy**. The URL stays the same. Saving the file alone does not update the live web app.

Columns written, in order: **Received (IST), Name, Mobile, Email, Service, Message, Source page, Status, ID**.
Status is `New`; change it by hand as you work through enquiries. Times are Asia/Kolkata, `YYYY-MM-DD HH:mm`. Every value is stored as text, so a mobile number keeps its `+` and any leading zero.

### Opening the sheet in Excel

The sheet is a normal Google Sheet. At any time use **File > Download > Microsoft Excel (.xlsx)**,
or open it in Excel on the web through Google Drive. The site deliberately does not write `.xlsx`
files itself, because serverless hosting has no permanent disk.

## Email notification (optional)

Email is off unless `RESEND_API_KEY` is set. With it unset, nothing is sent, nothing breaks, and nobody sees a warning, in development or production.
The Google Sheet is then the only record, so check it regularly.

To turn it on with Resend:

1. Create an account at <https://resend.com> using the email address that should receive enquiries.
2. **API Keys > Create API Key** (permission: Sending access). Copy the key (starts `re_`). It is shown once.
3. Set `RESEND_API_KEY` to that key and `CONTACT_TO_EMAIL` to your inbox.
4. Optional: `SHEET_URL` (the link to your sheet) adds an "Open the Google Sheet" button to the email.

With the default sender `smph.tech <onboarding@resend.dev>`, Resend only delivers to the address that
owns the Resend account. That is exactly right for owner notifications, so no domain is needed to start.
The email has the visitor's email as reply-to, so you can answer straight from your inbox.

**Auto-reply to visitors** (optional) needs a verified domain: in Resend, **Domains > Add domain** and add the DNS records it
shows. Then set `CONTACT_FROM_EMAIL="smph.tech <hello@yourdomain.com>"` and `SEND_AUTOREPLY=true`.

**Gmail instead of Resend (fallback).** Set `EMAIL_TRANSPORT=smtp`, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`,
`SMTP_USER=you@gmail.com`, `SMTP_PASS` to a Google **App Password** (Google Account > Security > 2-Step Verification >
App passwords) and `CONTACT_TO_EMAIL`. Choosing `smtp` is itself the switch, so `RESEND_API_KEY` is not needed. Same message, different transport.

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local`. The comments there explain each one.

| Variable                                                              | Needed for                                                           |
| --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                                                | Canonical links, sitemap, Open Graph. Set to the live URL.           |
| `APPS_SCRIPT_URL`, `APPS_SCRIPT_SECRET`                               | Saving enquiries to the sheet (**required in production**)           |
| `SHEET_URL`                                                           | Optional: link to the sheet, shown in the owner email                |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`            | Optional owner email via Resend. No key, no email.                   |
| `SEND_AUTOREPLY`                                                      | Optional: `true` to also email the visitor (needs a verified domain) |
| `EMAIL_TRANSPORT`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Optional Nodemailer fallback                                         |

## Deploy on Vercel

1. Push the repo to GitHub.
2. <https://vercel.com/new>, import the repo. Framework: Next.js (auto-detected). Install command `pnpm install`.
3. **Settings > Environment Variables**: add `APPS_SCRIPT_URL`, `APPS_SCRIPT_SECRET` and `NEXT_PUBLIC_SITE_URL` for **Production** (and Preview if you want test submissions there). Add the email variables only if you want email.
4. Deploy. Then add the custom domain under **Settings > Domains** and set `NEXT_PUBLIC_SITE_URL` to it. Redeploy.

## Sending a test submission

1. Open `/contact` on the deployed site (or run locally with the variables set).
2. Fill the form with your own details and send. You should land on `/thank-you`.
3. Within a few seconds a new row appears at the bottom of the `Enquiries` tab. If email is on, a "New enquiry: ..." message also arrives. Delete the test row afterwards.
4. If no row appears, check the Vercel function logs for `[contact] save failed:`. Usual causes: the deployment access is not **Anyone**, the URL is not the `/exec` one, the two secrets differ, or you edited the script but did not deploy a new version. A message such as `Apps Script did not return JSON` means Google served a sign-in or error page instead of the script.

The form waits about 3 seconds after the page opens before posting (the server ignores faster posts as bots), so a very fast submit takes a moment. The first request after a quiet spell can take a few seconds while Apps Script starts up.

## Project layout

```
content.json             all copy (single source of truth)
src/content/             typed content modules, SITE (contact details, placeholders)
src/styles/tokens.css    design tokens (colours, radii, fonts, gradients)
src/styles/site.css      the approved design's CSS, ported
src/styles/extras.css    production additions (focus rings, drawer, form states)
src/components/          Header, Footer, Button, Marquee, ServiceBentoCard, ProcessSteps, ...
src/app/                 routes, API route, sitemap, robots, manifest
src/lib/                 schema, Apps Script client, sheet payload sanitiser, mail, rate limit
apps-script/Code.gs      the Google Apps Script to paste into the sheet
scripts/                 assets, screenshots, e2e, content checks
design-handoff/          original reference HTML and assets
```

## How visitors are led through the site

Every main page ends with a **Your path** section (cream background) above the closing band: five nodes, one per page
(Home, Services, How we work, About, Talk to us), and a card for each page that is not the current one. The next page is the
**Up next** card. The order and the card logic are in [`src/lib/journey.ts`](src/lib/journey.ts) and are unit tested; the
behaviour is in [`src/components/JourneyTracker.tsx`](src/components/JourneyTracker.tsx).

- **Tracker:** each card carries `data-i`, the index of its node (0 Home, 1 Services, 2 How we work, 3 About, 4 Talk to us). One node is `.is-active` at a time: the one for the card the visitor points at (mouse only, `pointerType === 'mouse'`, no `(hover: hover)` gate), focuses, or, on a phone, has swiped into view. It defaults to "Up next", so the tracker is never idle. An orange line runs from the current node to the active one (`--from` and `--len` on `.pth`). The current page is a solid navy node with "You are here"; visited pages are pale orange.
- **Visited tracking** (`useVisited`): the pages a visitor has seen are kept in `localStorage` (`smph-visited`). They give the path nodes their visited state. The top nav shows no dots; only the active page is marked. Once all four main pages have been seen, the closing band on the next page says "You have seen it all. Let us talk." Nothing blocks or pops up, and the site works with storage blocked.
- **"Up next" pill:** desktop only (901px and up; it is not rendered on phones or tablets). After about 70% scroll, a small pill slides in at the bottom left. The x dismisses it for the rest of the session. Hidden on `/contact` and `/thank-you`.
- **On phones** the "Your path" cards are a swipeable carousel with the next step first, and nothing sticky is shown except the WhatsApp button.
- No popups, countdowns, fake scarcity or fake social proof.

## Phone layout and the WhatsApp button

- The phone layer is [`src/styles/phone.css`](src/styles/phone.css), ported from `design-handoff-v5/reference/phone-layer.reference.css`. Breakpoints are container queries on `.pg`: phone is up to 640px, tablet up to 900px. Section padding comes from `--sec-pad-y` (120px desktop, 88px tablet, 52px phone) and per-section `--pt`/`--pb` set with `padVars()` in `src/lib/pad.ts`.
- The home hero shows the picture first on phones and tablets using CSS `order` (the H1 stays first in the HTML).
- **WhatsApp button:** [`src/components/WhatsAppFab.tsx`](src/components/WhatsAppFab.tsx), on every page except `/thank-you`. The number is `SITE.whatsappNumber` in `src/content/site.ts` and the message is `whatsapp.message` in `content.json`. It is rendered in `layout.tsx` outside `.pg`: `.pg` is a size container, which makes it the containing block for `position: fixed`, so a button inside it would scroll with the page.
- **Brand:** the name is always lowercase, `BRAND = 'smph.tech'` in `site.ts`. `pnpm check:content` fails if any other spelling appears in `src/`, `content.json` or a built page.

## Email and phone links

[`src/components/ContactLinks.tsx`](src/components/ContactLinks.tsx) is the only place the address and number are rendered as links (footer, contact band, menu, form error).

- **Email:** the `href` is always `mailto:` (right-click copy, screen readers, phones). On a desktop (`(hover: hover) and (pointer: fine)`), where a `mailto:` often opens nothing, a click opens Gmail compose in a new tab instead. A **Copy** button beside the address copies it for people on Outlook or another mail app, and a 2-second toast says "Email copied".
- **Phone:** touch devices dial with `tel:`; on a desktop a click copies the number and the toast says "Number copied". WhatsApp links stay on `wa.me`.
- The toast is one `role="status"` element ([`Toaster.tsx`](src/components/Toaster.tsx)), fed by `showToast()` in `src/lib/toast.ts`.

## Accessibility and motion

- The header is five plain links (no dropdown). The mobile menu is a full-screen native modal `<dialog>` (focus trap, Escape, closes on navigation, focus returns to the burger, page scroll locked while open).
- One `<h1>` per page, skip link, visible focus rings, `alt=""` on decorative 3D art, descriptive alt on team photos.
- All animation (floating hero, chips, marquee, pulsing steps, hover motion, scroll reveal) is off under `prefers-reduced-motion`.
