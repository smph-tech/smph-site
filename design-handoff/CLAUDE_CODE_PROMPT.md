# Build the SMPH.Tech website

You are building the marketing website for **SMPH.Tech**, a small team of four that engineers growth for businesses with software, systems and marketing. The design is already approved. Your job is to rebuild it faithfully as a production Next.js site, add a working "Book a free call" form that saves every enquiry to a Google Sheet and emails the owner, and make it fast, accessible and responsive.

Work in stages, commit after each stage, and run typecheck, lint and build before moving on. Start by reading this whole file, then the handoff folder, then post a short plan before writing code.

---

## 0. What is in this folder (the handoff)

```
CLAUDE_CODE_PROMPT.md     this file
content.json              ALL site copy and structured content (single source of truth)
reference/*.html          the approved design, one standalone HTML file per page
assets/3d/                rendered 3D images: hero, web, mobile, systems, marketing, consulting (transparent PNG)
assets/logo/              logo-tile-720.png (transparent, rounded) and logo-smph-original.png (1080x1080 on black)
assets/photos/            four 4:5 team portraits (subbaiah, madeswaran, parthesh, harish)
assets/source/            original photo files
3d-source/                three.js scene + render script used to make the 3D images (optional, for later tweaks)
```

**The reference HTML is the visual spec.** Open each file in a browser at 1440px and 390px wide. Port its CSS, spacing, colours, type sizes, gradients, shadows, animations and hover states as exactly as you can. Do not redesign, "improve" or restyle. Do not substitute your own taste for the reference. If something in the reference cannot work in production, tell me and propose a minimal fix.

All text lives in `content.json`. Load it into typed content modules (`src/content/*.ts`) and render from there, so copy can be edited in one place.

---

## 1. Tech stack (decided, do not swap)

- **Next.js 15, App Router, TypeScript (strict)**
- **Tailwind CSS v4** for layout and tokens, plus small CSS modules or a global stylesheet where the reference uses gradients, blobs, keyframes or container queries that are clumsy in utilities
- **Fonts via `next/font/google`:** Plus Jakarta Sans (400, 500, 600, 700, 800) and JetBrains Mono (400, 500, 600). Self-hosted by Next, no external font requests.
- **Motion:** CSS keyframes for the ambient animations. Use `motion` (Framer Motion) only for subtle scroll-reveal (fade and rise, 12px, once). Everything must respect `prefers-reduced-motion`.
- **Images:** `next/image` for all raster images, with proper `sizes`, `priority` only for the hero image and logo
- **Form:** `react-hook-form` + `zod` (same schema shared by client and server)
- **Google Sheets:** the `googleapis` package with a service account
- **Email:** `resend` (primary). Provide a Nodemailer + Gmail SMTP fallback behind an env flag.
- **Hosting target:** Vercel (also works on Netlify or a Node server). No database is needed.
- **Tooling:** pnpm (or npm if pnpm is missing), ESLint, Prettier, Playwright for the final screenshot check

Do not add a CMS, auth, a database, analytics scripts, cookie banners or any other dependency without asking.

---

## 2. Routes

| Route | Reference file |
|---|---|
| `/` | `reference/index.html` |
| `/services` | `reference/services.html` |
| `/services/web-applications` | `reference/service-web-applications.html` |
| `/services/mobile-apps` | `reference/service-mobile-apps.html` |
| `/services/management-systems` | `reference/service-management-systems.html` |
| `/services/digital-marketing` | `reference/service-digital-marketing.html` |
| `/services/tech-consulting-automation` | `reference/service-tech-consulting-automation.html` |
| `/how-we-work` | `reference/how-we-work.html` |
| `/about` | `reference/about.html` |
| `/contact` | the contact section from `index.html` as a full page |
| `/thank-you` | simple confirmation page (match the design) |

- Service pages come from ONE dynamic route `app/services/[slug]/page.tsx` driven by `content.json` (`generateStaticParams`, `generateMetadata`, `notFound()` for bad slugs).
- The reference links to `index.html#contact` for "Book a free call". In production, every "Book a free call" button links to `/contact` except on the home page, where it scrolls to `#contact`.
- **There is no Work, Portfolio, Case Studies or Projects page anywhere.** The team has no projects yet. Do not create one, link to one, or invent client logos, testimonials, statistics or reviews.

---

## 3. Design system (extracted from the reference, treat the reference CSS as authoritative)

Create design tokens in one place (`src/styles/tokens.css` and the Tailwind theme):

- Backgrounds: `#060A22` (page), `#04061A` (footer), light sections `#EDF1FF`, ink text on light `#0B1230`, body text on dark `#EAF0FF`, muted on dark `#A3B3DC`, muted on light `#56628C`
- Accent: blue `#4F7BFF`, violet `#7C4DFF` / `#8B5CF6`, cyan `#22D3EE`
- Primary button gradient `135deg, #4F7BFF, #7C4DFF` with the glow shadow from the reference; white button; ghost button (glass)
- Gradient text for highlighted headline words (`.grad`), two variants (on dark, on light)
- CTA band gradient `135deg, #2646DE, #6C3DF0 62%, #8A3CF0`
- Radii: cards 26 to 34px, buttons 16px, pills 999px. Glass cards use a faint white gradient, 1px white border at ~12% and backdrop blur
- Blurred colour "blobs" and the faint grid background in dark sections
- Type: headlines Plus Jakarta Sans 800 with tight tracking; labels in JetBrains Mono uppercase with the small glowing-dot "eyebrow" pill
- Page container max width 1240px, 40px side padding (22px on small screens)

**Responsive behaviour:** the reference uses container queries with a breakpoint at 900px. Use a standard media query at 900px (or container queries if you prefer), and match the narrow layout shown at 390px: single column, stacked bento cards, stacked hero, simplified process, and the hero floating chips hidden on narrow screens. Test at 390, 768, 1024, 1440 and 1920.

**Animations to keep** (from the reference): hero image floating loop, floating status chips, scrolling marquee strip, pulsing step numbers in the process timeline, card hover lift with icon tilt, dashed arrow nudge, hover colour on team photos. Add a small scroll-reveal. All disabled under `prefers-reduced-motion`.

---

## 4. Components to build

`Header` (logo + name, nav, "Services" dropdown with icon + one-line description per service, "Book a free call" button, **a real mobile menu** (accessible drawer or sheet) because the reference only shows a burger icon), `Footer`, `Eyebrow`, `Button` (primary, ghost, white, dark), `GlassCard`, `SectionHeading`, `Marquee`, `ServiceBentoCard`, `ProcessSteps`, `WhyCards`, `TeamGrid`, `ContactSection` (with the form), `CtaBand`, `FactBand`, `FeatureGrid`, `FaqAccordion` (use native `<details>` or an accessible equivalent), `OtherServices`, `ServiceRow` (services overview zig-zag), `CompareTable`, `HowTimeline`.

Keyboard access for the dropdown (opens on focus, Escape closes), visible focus rings, correct landmarks, one `<h1>` per page, descriptive `alt` text for team photos and `alt=""` for decorative 3D images.

---

## 5. Content rules (strict)

1. **Never** use the word "Founder" or "Founders" anywhere.
2. Team members are shown with **name and role only**: Subbaiah S (Full-Stack Developer), Madeswaran M (Full-Stack Developer), Parthesh S (UI/UX Designer), Harish S (Technical Lead). Keep this order. No bios.
3. Do not split the name into letters, do not assign letters of "SMPH" to people, and do not explain what SMPH stands for.
4. Do not use the line "Four friends. One team." or similar.
5. Do not invent facts: no client counts, years in business, revenue figures, awards, certifications, testimonials or fake logos.
6. Every `[bracketed placeholder]` in `content.json` (timelines, payment terms, code ownership, reply time, email, Instagram, YouTube, tools) must stay clearly marked in the UI until the owner fills it. Collect them all in `src/content/site.ts` where possible (`SITE.email`, `SITE.instagram`, `SITE.youtube`, `SITE.replyTime`) and list every remaining placeholder in a root `CONFIRM.md` with the page and the exact text.
7. Plain, direct English. No filler, no "cutting-edge", no emojis.

---

## 6. The contact form (the important part)

Every submission must (a) be saved as a new row in a Google Sheet that opens in Excel, and (b) send an email notification to the owner. A visitor must never see an error if at least one of the two succeeded.

### 6.1 Form fields

- `name` (required, 2 to 80 chars)
- `contact` (required): an email address or a phone number. Validate that it is one or the other (email format, or 7 to 15 digits with an optional + and spaces).
- `message` (required, 10 to 2000 chars): "What is the problem?"
- `service` (optional select): Web applications, Mobile apps, Management systems, Digital marketing, Tech consulting and automation, Not sure. When the form is opened from a service page, preselect that service.
- `company` (hidden honeypot, must be empty)
- `startedAt` (hidden timestamp, reject submissions made in under 3 seconds)

Same zod schema in `src/lib/contact-schema.ts` for client and server. Inline field errors, disabled submit while sending, loading state, success state (redirect to `/thank-you` or an in-place confirmation), and a friendly failure state with a direct email link as the fallback.

### 6.2 API route `app/api/contact/route.ts` (Node runtime)

1. Parse and validate with zod. Reject honeypot or too-fast submissions with a normal-looking 200 (do not tip off bots) but do nothing.
2. Basic rate limit: max 5 submissions per IP per 10 minutes (in-memory map is acceptable for a first version; note in README that Upstash/Vercel KV is the upgrade for multi-instance).
3. Append the row to Google Sheets (section 6.3).
4. Send the owner notification email (section 6.4).
5. Run steps 3 and 4 with `Promise.allSettled`. If at least one succeeds, return success. If both fail, return a 500 with a generic message and log the details server-side. Never return stack traces or secrets.
6. Sanitise values before writing to the sheet: prefix any value starting with `=`, `+`, `-` or `@` with a single quote to prevent spreadsheet formula injection. Escape HTML in the email body.
7. Log one structured line per submission (no personal data beyond a short id and the outcome).

### 6.3 Google Sheets

- Use a **service account** (`googleapis`, scope `https://www.googleapis.com/auth/spreadsheets`). Env vars: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY` (handle `\n` unescaping), `GOOGLE_SHEET_ID`, `GOOGLE_SHEET_TAB` (default `Enquiries`).
- Columns, in order: `Received (IST)`, `Name`, `Email or phone`, `Service`, `Message`, `Source page`, `Status`, `ID`. `Status` is written as `New`. Write the header row automatically if the tab is empty.
- Timestamp in `Asia/Kolkata`, formatted `YYYY-MM-DD HH:mm`.
- Use `spreadsheets.values.append` with `valueInputOption: 'USER_ENTERED'` only after sanitising (or `RAW` if you prefer, then no sanitising is needed for formulas, but keep it consistent).
- The sheet is a normal Google Sheet. The owner can use File > Download > Microsoft Excel (.xlsx) at any time, and can open it in Excel online. Say this in the README. Do not build a server-side `.xlsx` file writer: serverless disks are not persistent.

### 6.4 Email

- Primary: **Resend**. Env vars: `RESEND_API_KEY`, `CONTACT_TO_EMAIL` (the owner's inbox), `CONTACT_FROM_EMAIL` (default `SMPH.Tech <onboarding@resend.dev>` until a domain is verified).
- Note for the README: with `onboarding@resend.dev`, Resend only delivers to the email address that owns the Resend account, which is exactly right for owner notifications. Auto-replies to visitors need a verified domain, so make the visitor auto-reply optional behind `SEND_AUTOREPLY=true` and only send it when `contact` is an email address.
- Owner email: subject `New enquiry: {name} ({service or "General"})`, a clean HTML + plain-text body with all fields, the source page, the time in IST, `reply-to` set to the visitor's email when they gave one, and a link to open the Google Sheet.
- Fallback transport: if `EMAIL_TRANSPORT=smtp`, use Nodemailer with `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (a Gmail app password works). Same message.
- Never hard-code any email address. Read everything from env.

### 6.5 Local development without credentials

If env vars are missing in development, the API logs the payload to the console and returns success with a clear `[dev] not sent` log line, so the UI can be built and tested without keys. In production, missing env vars must fail loudly at startup of the request, not silently.

Provide `.env.example` with every variable and a short comment.

### 6.6 README setup guide (write it step by step for a non-expert)

Include exact steps for: creating a Google Cloud project, enabling the Google Sheets API, creating a service account and JSON key, creating the sheet with a tab named `Enquiries`, **sharing the sheet with the service-account email as Editor**, copying the sheet ID from the URL, creating a Resend account and API key, setting env vars locally and on Vercel, sending a test submission, and downloading the sheet as Excel.

---

## 7. SEO, performance, accessibility

- `metadata` per page (title, description, canonical, Open Graph, Twitter), `metadataBase` from `NEXT_PUBLIC_SITE_URL`
- Generate favicon, `apple-touch-icon` (180), 192 and 512 icons from `assets/logo/logo-tile-720.png` using `sharp` in a script (`pnpm assets`), and an Open Graph image (1200x630, midnight background, logo tile, the headline)
- `app/sitemap.ts`, `app/robots.ts`, JSON-LD `Organization` and `Service` (no fake ratings or addresses)
- Convert the 3D PNGs and photos to optimised formats through `next/image`; hero image `priority`; everything else lazy
- Targets (mobile, production build): Lighthouse Performance 90+, Accessibility 95+, SEO 95+, no layout shift from images or fonts, no console errors
- Colour contrast AA for all text. Do not rely on colour alone.

---

## 8. Photos and images

- Team photos are in `assets/photos/` (4:5). Put them in `public/photos/`. Show them in full colour with the gradient name overlay shown in the reference.
- 3D images go to `public/3d/`. Use the exact files; do not regenerate or restyle them. Keep their filenames: `hero.png`, `web.png`, `mobile.png`, `systems.png`, `marketing.png`, `consulting.png`.
- The logo is `assets/logo/logo-tile-720.png`. Use it in the header and footer at 44px with the radius shown in the reference. Never recolour or redraw the logo.

---

## 9. Quality checks before you say you are done

1. `pnpm typecheck`, `pnpm lint` and `pnpm build` pass with no warnings you cannot justify.
2. Use Playwright to screenshot every route at 1440x900 (full page) and 390x844 (full page), and compare each against the matching `reference/*.html` rendered at the same size. Fix visible differences in layout, spacing, colour, type and imagery. List any difference you deliberately kept.
3. Test the form: validation errors, honeypot rejection, success path in dev mode, and the failure state. Write unit tests for the zod schema and the sheet-row sanitiser (formula injection cases).
4. Click-test: every nav link, the dropdown (mouse and keyboard), the mobile menu, every "Book a free call", every service card, every footer link. No dead links, no 404s, no links to `.dc.html` or `.html` reference files.
5. Search the codebase and built HTML for the banned content: `Founder`, `Four friends`, "Work", "Case stud", "Portfolio", "Projects" (as nav or page), and confirm none appear.
6. Confirm `CONFIRM.md` lists every remaining `[placeholder]`.

---

## 10. Deliverables

- A working repository, committed in logical stages, with a clear README (setup, env, scripts, deployment on Vercel, how to edit content in `content.json`, how to fill placeholders)
- `.env.example`, `CONFIRM.md`
- A final report to me: what was built, anything that differs from the reference and why, what I must do manually (Google service account, Resend key, env vars on Vercel, domain), and how to run a test submission

Start now with your plan, then build.
