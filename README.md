# SMPH.Tech website

Marketing site for SMPH.Tech. Next.js 15 (App Router), TypeScript, Tailwind CSS v4.
The "Book a free call" form saves every enquiry to a Google Sheet and emails the owner.

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

| Script                                                 | What it does                                                                                                             |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `pnpm dev`                                             | Dev server                                                                                                               |
| `pnpm build` / `pnpm start`                            | Production build and server                                                                                              |
| `pnpm typecheck`                                       | TypeScript, strict                                                                                                       |
| `pnpm lint`                                            | ESLint                                                                                                                   |
| `pnpm test`                                            | Unit tests (zod schema, sheet-row sanitiser, rate limit, email, enquiry logic)                                           |
| `pnpm assets`                                          | Regenerates favicon, app icons, Apple touch icon and `public/og.png` from the logo tile                                  |
| `pnpm shots`                                           | Full-page screenshots of every route next to its design reference, with a pixel-diff (needs a running server, see below) |
| `pnpm e2e links` / `ui` / `form-success` / `form-fail` | Playwright click-tests (needs a running server)                                                                          |
| `pnpm check:content`                                   | After a build: fails on banned words/links and on any `[placeholder]` missing from `CONFIRM.md`                          |

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

Contact details (email, Instagram, YouTube, reply time) are set once in
[`src/content/site.ts`](src/content/site.ts). Everything still to be confirmed is listed, with
the page and exact text, in [`CONFIRM.md`](CONFIRM.md).

Team photos: `public/photos/`. 3D images: `public/3d/` (keep the filenames). Logo: `public/logo/logo-tile-720.png`.
The original design files are kept in `design-handoff/` for reference and for `pnpm shots`.

## How the contact form works

1. The browser validates with the shared zod schema ([`src/lib/contact-schema.ts`](src/lib/contact-schema.ts)).
2. It posts to `/api/contact` ([`src/app/api/contact/route.ts`](src/app/api/contact/route.ts)), which validates again with the same schema.
3. Bots are dropped quietly (they get a normal-looking `200`): a filled hidden field, or a post made less than 3 seconds after the page opened.
4. Rate limit: 5 submissions per IP per 10 minutes.
5. The row is added to Google Sheets and the owner is emailed, **in parallel**. The visitor sees success if at least one worked. If both fail they see a friendly message with the email address, and the server logs the reason. Stack traces and secrets are never sent to the browser.
6. One log line per submission: `{"evt":"contact","id":"SMPH-1A2B3C4D","sheet":"ok","email":"ok","ok":true,"ms":412}`. No names or messages are logged.

Spreadsheet safety: any value starting with `=`, `+`, `-` or `@` is stored with a leading `'` so it cannot run as a formula. HTML in the email body is escaped.

**Rate limit note.** The limiter is an in-memory map, so it works per server instance.
On Vercel (many instances) it is a speed bump, not a hard limit. For a hard limit, replace
`src/lib/rate-limit.ts` with Upstash Redis (`@upstash/ratelimit`) or Vercel KV.

### Running without keys (development)

With no Google or email settings and `NODE_ENV=development`, the API prints the enquiry to the
terminal with a `[dev] not sent` line and returns success, so you can build and test the form
without any accounts. In production, missing settings are logged as errors on every submission
and, if both Sheets and email are unconfigured, the visitor sees the failure message.

## Setup guide: Google Sheets (step by step)

You do this once. It takes about 10 minutes.

1. **Create a Google Cloud project.** Go to <https://console.cloud.google.com/>, click the project picker at the top, then **New project**. Name it `smph-website` and click **Create**. Make sure it is selected.
2. **Turn on the Sheets API.** Menu **APIs & Services > Library**, search **Google Sheets API**, open it, click **Enable**.
3. **Create a service account.** **APIs & Services > Credentials > Create credentials > Service account**. Name it `website-enquiries`, click **Create and continue**, skip the optional role and user steps, click **Done**.
4. **Create the JSON key.** Click the service account you just made, open the **Keys** tab, **Add key > Create new key > JSON > Create**. A `.json` file downloads. Keep it private. Do not commit it or email it.
5. **Create the sheet.** Go to <https://sheets.google.com>, create a blank spreadsheet, name it e.g. `SMPH.Tech enquiries`. Rename the first tab (bottom left) to exactly **`Enquiries`**. Leave it empty. The site writes the header row on the first submission.
6. **Share the sheet with the service account.** Click **Share**, paste the service account's email (the `client_email` value in the JSON, ending `...iam.gserviceaccount.com`), set the role to **Editor**, untick "Notify people", click **Share**.
7. **Copy the sheet ID.** In the browser address bar the URL looks like `https://docs.google.com/spreadsheets/d/`**`1AbCdEf...XyZ`**`/edit`. The bold part is the ID.
8. **Fill the env vars** (below): open the JSON key in a text editor and copy `client_email` and `private_key`.

Columns written, in order: **Received (IST), Name, Email or phone, Service, Message, Source page, Status, ID**.
Status is `New`; change it by hand as you work through enquiries. Times are Asia/Kolkata, `YYYY-MM-DD HH:mm`.

### Opening the sheet in Excel

The sheet is a normal Google Sheet. At any time use **File > Download > Microsoft Excel (.xlsx)**,
or open it in Excel on the web through Google Drive. The site deliberately does not write `.xlsx`
files itself, because serverless hosting has no permanent disk.

## Setup guide: email with Resend

1. Create an account at <https://resend.com> using the email address that should receive enquiries.
2. **API Keys > Create API Key** (permission: Sending access). Copy the key (starts `re_`). It is shown once.
3. Set `RESEND_API_KEY` to that key, `CONTACT_TO_EMAIL` to your inbox.

With the default sender `SMPH.Tech <onboarding@resend.dev>`, Resend only delivers to the address that
owns the Resend account. That is exactly right for owner notifications, so no domain is needed to start.

**Auto-reply to visitors** (optional) needs a verified domain: in Resend, **Domains > Add domain** and add the DNS records it
shows. Then set `CONTACT_FROM_EMAIL="SMPH.Tech <hello@yourdomain.com>"` and `SEND_AUTOREPLY=true`.
It only sends when the visitor gave an email address (not a phone number).

**Gmail instead of Resend (fallback).** Set `EMAIL_TRANSPORT=smtp`, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`,
`SMTP_USER=you@gmail.com` and `SMTP_PASS` to a Google **App Password** (Google Account > Security > 2-Step Verification >
App passwords). Same message, different transport.

## Environment variables

Copy [`.env.example`](.env.example) to `.env.local`. The comments there explain each one.

| Variable                                                                                    | Needed for                                                       |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`                                                                      | Canonical links, sitemap, Open Graph. Set to the live URL.       |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_TAB` | Saving to the sheet (`GOOGLE_SHEET_TAB` defaults to `Enquiries`) |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`                                  | Owner email via Resend                                           |
| `SEND_AUTOREPLY`                                                                            | `true` to also email the visitor (needs a verified domain)       |
| `EMAIL_TRANSPORT`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`                       | Nodemailer fallback                                              |

`GOOGLE_PRIVATE_KEY` must keep its `\n` sequences. Paste it exactly as it appears in the JSON file, including the quotes in `.env.local`.
On Vercel, paste the value without surrounding quotes. The code handles both.

## Deploy on Vercel

1. Push the repo to GitHub.
2. <https://vercel.com/new>, import the repo. Framework: Next.js (auto-detected). Install command `pnpm install`.
3. **Settings > Environment Variables**: add every variable from the table above for **Production** (and Preview if you want test submissions there).
4. Deploy. Then add the custom domain under **Settings > Domains** and set `NEXT_PUBLIC_SITE_URL` to it. Redeploy.

## Sending a test submission

1. Open `/contact` on the deployed site (or `pnpm dev` with the env vars set).
2. Fill the form with your own details and send. You should land on `/thank-you`.
3. Within a minute: a new row at the bottom of the `Enquiries` tab, and an email "New enquiry: ..." in the `CONTACT_TO_EMAIL` inbox with a button to open the sheet.
4. If a row is missing, check the Vercel function logs for `[contact] sheet failed:` (most often the sheet was not shared with the service account, or the tab is not named `Enquiries`). If the email is missing, look for `[contact] email failed:`.

The form waits about 3 seconds after the page opens before posting (the server ignores faster posts as bots), so a very fast submit takes a moment.

## Project layout

```
content.json             all copy (single source of truth)
src/content/             typed content modules, SITE (contact details, placeholders)
src/styles/tokens.css    design tokens (colours, radii, fonts, gradients)
src/styles/site.css      the approved design's CSS, ported
src/styles/extras.css    production additions (focus rings, drawer, form states)
src/components/          Header, Footer, Button, Marquee, ServiceBentoCard, ProcessSteps, ...
src/app/                 routes, API route, sitemap, robots, manifest
src/lib/                 schema, sheet row sanitiser, Sheets, mail, rate limit
scripts/                 assets, screenshots, e2e, content checks
design-handoff/          original reference HTML and assets
```

## Accessibility and motion

- Services dropdown opens on hover and keyboard focus, closes on Escape. The mobile menu is a native modal `<dialog>` (focus trap, Escape).
- One `<h1>` per page, skip link, visible focus rings, `alt=""` on decorative 3D art, descriptive alt on team photos.
- All animation (floating hero, chips, marquee, pulsing steps, hover motion, scroll reveal) is off under `prefers-reduced-motion`.
