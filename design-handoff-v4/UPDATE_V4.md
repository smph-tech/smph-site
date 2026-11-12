# SMPH.Tech site: Update V4 (for Claude Code)

This is a change request on top of the existing Next.js build. Do not rebuild from scratch. Keep the current design language (midnight blue, light sections, Plus Jakarta Sans, gradient buttons) and apply the changes below.

**Source of truth for look and layout:** `reference/*.html` (open them in a browser, desktop width, and `home-mobile-390.html` at phone width). Where this file and the reference disagree, the reference wins for visuals and this file wins for behaviour.

**Existing rules still apply:** no "Founder" wording, no work/portfolio page, no letter-mapping of S-M-P-H, no "Four friends. One team" line, no invented facts. Roles shown only with photos.

Install the new assets first:
- `assets/scenes/{web,mobile,systems,marketing,consulting}.png` -> `public/images/scenes/` (1600x1200 transparent PNGs; they replace the old 3D service images everywhere, including the home bento cards)
- `assets/tech-logos/*.svg` -> `public/images/tech/` (brand logos from Simple Icons, already coloured in each brand's colour). Use `next/image` or inline them.
- Keep `hero.png` (3D hero) on the home page and About hero. Remove the other old 3D service PNGs from the code once nothing uses them.

---

## 1. Navigation: no dropdown, add Home

- Header nav items, in this order: **Home**, **Services**, **How we work**, **About**, then the **Book a free call** button.
- **Services is a plain link to `/services`.** Delete the dropdown/mega-menu and its tests.
- The logo also links to `/`.
- The active page gets a 3px underline in the logo orange: `linear-gradient(90deg,#FF7A2E,#F73F09)`, inset 16px each side, 3px above the item's bottom edge, plus the existing subtle background.
- Mobile burger opens a full-screen menu with the same five items (Home first), the phone number and the Book a free call button. Close on route change and on Esc.
- **Mobile sticky bar** (below 900px): fixed at the bottom with two buttons, `Call` (`tel:+919566831192`) and `Book a free call`. Hide it on `/contact`. Add bottom padding to the page so it never covers content.
- Header has a light variant (`light` prop): ink text, used on `/how-we-work` only (its hero is light).

## 2. Services page (`/services`) redesign

Replace all 3D service imagery with the new scene images. Each service now has its own colour so the page is no longer all blue:

| Service | Card gradient (160deg) | Accent |
|---|---|---|
| Web applications | `#2F55E6 -> #141B6E` | `#3B66F0` |
| Mobile apps | `#10B58A -> #064A46` | `#10B981` |
| Management systems | `#FF8A3D -> #B5300B` | `#F73F09` |
| Digital marketing | `#E8338B -> #5E1470` | `#E8338B` |
| Tech consulting and automation | `#8A5CFF -> #2A1A86` | `#7C4DFF` |

Add a soft radial highlight on top right of each card, as in the reference (`radial-gradient(120% 90% at 90% 0%, rgba(255,255,255,.3-.5), transparent 55%)`).

Page structure:
1. Dark hero (centred): eyebrow, H1, lead, then **five pills** (one per service, each with a coloured dot in the accent colour) that scroll to the matching row (`#web`, `#mobile`, `#systems`, `#marketing`, `#consulting`).
2. Light section: five alternating rows (image left/right). Each row: card with the scene image (4:3), number + name in the accent colour, the problem quote as H2, one-line description, three bullets, a **row of real tool logos** (see section 6), and an "Explore ..." button to the service page.
3. **"How it feels" section** (replaces the old "Side by side" table, delete the table and the timeline column). See section 3.
4. "Your path" section (section 7), the CTA band, the footer.

Use the same card colours and scene images on: home bento cards, the service page hero, and the "Other services" cards at the bottom of each service page.

**Remove every "[X to Y weeks]" timeline** from the site: the Services table, the service pages ("Typical timeline" fact card) and the How we work stages. On service pages the three fact cards are now: `How we start` / `A free call, no obligation`, `Price` / `Quoted in writing after the free call`, `Examples` / the tags.

## 3. "How it feels" section (the old table, redesigned)

Dark navy section (`#0A1030`), title **"Which of these sounds like your week?"**, sub "Pick the sentence you have said out loud. Each one has a fix."

One row per service. Each row is a rounded card split in two:
- Left (translucent dark, 6px left bar in the accent colour): label `TODAY YOU SAY`, then the customer's sentence in quotes.
- Centre: a round arrow badge in the accent colour overlapping the split (hide on mobile, stack the two halves).
- Right (white): label `AFTER WE FIX IT` in green, then the outcome sentence, then the tool logos row (small 38px rounded tiles) and a link in the accent colour to the service page.

Copy (use exactly):

| Service | Today you say | After we fix it |
|---|---|---|
| Web applications | Every booking means a call, a message and a reminder. | Customers book and pay by themselves. Your team just sees the list. |
| Mobile apps | Customers keep asking if we have an app. | Your business sits on their home screen, one tap away. |
| Management systems | I am never sure which sheet has the latest numbers. | One screen shows orders, stock and payments, always current. |
| Digital marketing | Our work is good, but nobody finds us. | People search, find you, and message you. |
| Tech consulting and automation | We repeat the same tasks every day, and nobody likes it. | The repeat work runs by itself. Your team does the thinking. |

## 4. How we work (`/how-we-work`) reconstruction

The page must no longer be all dark.
1. **Light hero** (`linear-gradient(180deg,#FFF6EA,#EDF1FF)`, ink text, light header variant, soft orange and blue blobs). H1: "Five stages. You always know *where* you are." Under it a row of five white pills linking to each stage, each with a numbered coloured circle and the text `You feel heard / clear / in control / relieved / backed up`.
2. **Five full-width stage bands**, each with its own light tint and colour: Discover `#FF5A1F` on `#FFF1E8`, Plan `#3B66F0` on `#EEF2FF`, Build `#7C4DFF` on `#F3EFFF`, Launch `#10B981` on `#E9FAF3`, Support `#E8338B` on `#FFEEF6`. Two columns: left is a huge faded numeral (20% opacity), the stage name, a coloured pill `You feel: Heard` and a one-line promise (sticky on desktop). Right is three white cards (`We do`, `You get`, `We need from you`) with a 6px left bar in the stage colour and coloured bullets.
3. White section "Nervous about the first step? It is just a conversation." with three numbered cards (describe the problem / we ask what it costs you / you get an honest answer).
4. Light "Working terms" cards (coloured number badges).
5. "Your path" section, CTA band, footer.

Stage content and the feelings are in `reference/how-we-work.html` and `src/content/site.ts` should be updated to match (`feeling`, `promise`, `accent`, `tint` per stage). Remove the duration chips.

## 5. Logo colours in the site (subtle, do not change the overall design)

Add tokens: `--orange-1:#FF7A2E; --orange-2:#F73F09; --orange-soft:#FF5A1F; --cream:#FFF6EA`.
Use them only here:
- Eyebrow dot: orange with orange glow (was cyan).
- The `.grad` highlight word gradient now ends in orange: dark sections `#6F96FF -> #B08BFF 55% -> #FF8A4C`; light sections `#2F54E8 -> #7C4DFF 58% -> #F73F09`.
- Trust ticks under the hero and in forms: orange.
- Marquee separators and the connector line end on the home "five stages": orange.
- Team card role text: `#FFB48A`.
- Active nav underline, footer top line and footer column headings' small orange dash, the "Call" button in the footer, the "Your path" section (cream background) and its progress nodes.
- The logo tile glow stays.
Primary buttons stay blue-violet. Do not recolour backgrounds, headings or cards with orange.

## 6. Real tool logos

Brand logos are in `assets/tech-logos/`. They are trademarks of their owners; use them only to show the tools we work with. Per service (order matters, show the first 4 in the Services rows, all in the "How it feels" section and the service page "Built with tools such as" row):
- Web: React, Next.js, Node.js, PostgreSQL, Stripe
- Mobile: Flutter, React (label "React Native" where space allows), Android, Apple, Firebase
- Systems: PostgreSQL, Python, Node.js, Google Sheets
- Marketing: Google, Google Ads, Google Analytics, Instagram, Meta
- Consulting: Zapier, n8n, Make, Python

Put these in `site.ts` as `tools: string[]` per service. Add `// CONFIRM: only keep logos for tools we really use` above the data, and list it in CONFIRM.md. About page "Tools we use most" now shows each tool as a white pill with its logo (React, Next.js, Node.js, PostgreSQL, React Native, TypeScript, Figma, Tailwind CSS). Each logo `<svg>` or `<img>` needs `alt`/`aria-label` of the tool name.

## 7. Psychology: lead every visitor through every page

The goal is that a visitor who lands on any page is gently pulled through Home, Services, How we work, About and Contact. Do these, in this order of importance:

**a) "Your path" section** (component `<Journey current="home|services|how|about" />`), on every page above the CTA band, cream background `#FFF6EA -> #FFEAD3`:
- Title "Keep going. Each page answers *one* question." and the line "You are on step N of 5. Most people who see all of it know exactly what they want to ask us."
- A 5-node progress line: Home, Services, How we work, About, Talk to us. Nodes up to and including the current page are filled orange; the current one has an outer ring. If `localStorage` tracking (below) knows a page was visited, fill it too.
- Cards for the *other* pages plus a "Talk to us" card. The next page in sequence is highlighted as **Up next** (orange gradient card), the others white. Hooks (use exactly): Services: "Which of our five fixes matches your problem?" -> "See the services". How we work: "What happens after you book a call? No surprises." -> "See the five stages". About: "Who will actually build it? Meet the four of us." -> "Meet the team". Talk: "Ready? Tell us what is slowing you. We reply with next steps." -> "Book a free call".
- Sequence for "up next": Home -> Services, Services (and every service page) -> How we work, How we work -> About, About -> Contact.

**b) Visited tracking** (tiny client hook `useVisited`): store visited route keys in `localStorage` (`smph-visited`, wrapped in try/catch). Show a small orange dot under visited nav items. Fill visited nodes in the path. When all four pages are visited, change the CTA band title on the next page to "You have seen it all. Let us talk." (only that line). No popups, no blocking.

**c) "Up next" pill:** after the visitor scrolls past ~70% of a page, slide in a small pill at the bottom left (above the mobile sticky bar): "Up next: How we work ->". Dismissible with an x, remembered per session, hidden on `/contact` and `/thank-you`. Respect `prefers-reduced-motion`.

**d) Self-selection:** the "How it feels" section (section 3) and the home bento cards use first-person pain sentences so the visitor recognises themselves, then click into the matching service page.

**e) Familiarity and low risk:** the contact band shows the four team photos as small overlapping circles with "You will talk to the people who actually build it." Keep "Free first call", "Scope and price in writing" and the reply promise visible next to the form.

**f) Internal links:** every page has at least two contextual links to other pages (already in the reference). Do not add popups, countdowns, fake scarcity or fake social proof.

## 8. Footer

Rebuild the footer exactly as in the reference:
1. A 3px top line `linear-gradient(90deg,#FF7A2E,#F73F09 28%,#7C4DFF 68%,#22D3EE)`.
2. Top strip: "Ready when you are." + "Call us, or tell us the problem and we will reply with next steps." with two buttons: orange `Call +91 95668 31192` (`tel:+919566831192`) and `smph.tech@gmail.com` (`mailto:smph.tech@gmail.com`).
3. Four columns: Brand (logo, description, two 50px social tiles: Instagram gradient tile and WhatsApp green tile, both open in a new tab with `rel="noopener noreferrer"` and aria-labels), Services (all five), Explore (Home, Services, How we work, About, Book a free call), Get in touch (four rows with icon tiles: phone, email, Instagram `@smph.tech`, WhatsApp channel "Join for updates").
4. Bottom bar: "(c) 2026 SMPH.Tech . Engineering for business growth" and the reply-time line.

Links (put in `site.ts`, one place):
- phone: `+91 95668 31192`, tel `+919566831192`
- email: `smph.tech@gmail.com`
- Instagram: `https://www.instagram.com/smph.tech/` (the share link you were given has a tracking parameter, the clean profile URL is the same account)
- WhatsApp channel: `https://whatsapp.com/channel/0029Vb9H9qI7oQheRpgygP00`
Remove YouTube everywhere (footer, About, contact). Remove the `[EMAIL]`, `[HANDLE]` and `[CHANNEL]` placeholders and update `pnpm check:content`, `CONFIRM.md` and the tests.

Also: add the same phone and email in the contact band (two small pill buttons under the trust list), in the `/contact` page, and in the JSON-LD (`telephone`, `email`, `sameAs: [Instagram, WhatsApp channel]`).

## 9. Contact form UI

Match the reference: red asterisks on required labels (Name, Mobile number, Email, What is the problem?), `Service (optional)` select. No behaviour changes to the API/Apps Script integration.

## 10. Quality bar

- Keep Lighthouse mobile A11y/BP/SEO at 100, and re-check performance: scene PNGs are large, so convert them to WebP/AVIF via `next/image` with `sizes` set per layout, `priority` only on the hero image, and `loading="lazy"` for the rest.
- Brand logos must have accessible names; decorative duplicates `aria-hidden`.
- Colour contrast: white text on the orange card (`#FF7A2E -> #F73F09`) is large bold text only; do not use small white text on it.
- Update tests: nav items and order, no dropdown, footer links (tel, mailto, Instagram, WhatsApp channel), `Journey` next-page logic for every page, `useVisited`, and `check:content` (no timeline placeholders, no YouTube, no `[EMAIL]`).
- Run typecheck, lint, tests and build. Then give me a short report listing any place where you deviated from the reference and why.
