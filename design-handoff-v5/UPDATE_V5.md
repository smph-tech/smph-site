# smph.tech site: Update V5 (for Claude Code)

Apply on top of the current build. Do not rebuild. The desktop design stays as it is. This update is a **phone-first restructuring**, a lowercase brand name and a floating WhatsApp button.

**Visual source of truth:** `reference/*.html`.
- Desktop pages: `index.html`, `services.html`, `how-we-work.html`, `about.html`, `service-*.html`.
- **Phone pages (open them with Chrome DevTools at 390 wide, or any phone):** `PHONE-home-390.html`, `PHONE-menu-open-390.html`, `PHONE-services-390.html`, `PHONE-how-we-work-390.html`, `PHONE-about-390.html`, `PHONE-service-page-390.html`.
- `reference/phone-layer.reference.css` is the exact CSS used for the phone layer in the design. Class names match the existing build (`.herogrid`, `.bento`, `.bc`, `.steps`, `.sp`, `.wc`, `.tm`, `.tc`, `.jc`, `.jcard`, `.fcard`, `.ftg2`, `.zz`, `.fr`, `.rib`, `.stg2`, `.sbox`, `.sq`, `.oc`, ...). Port it into the project's CSS. Breakpoints are **container queries on `.pg`**, as before: phone is `max-width: 640px`, tablet is `max-width: 900px`.

---

## 1. Brand name is lowercase everywhere: `smph.tech`

- Replace every visible "SMPH.Tech" with **`smph.tech`**: header and footer wordmark, hero copy ("smph.tech finds what is holding your business back..."), About, copyright, form copy, alt texts, aria-labels, page titles, meta descriptions, Open Graph, JSON-LD `name`, sitemap/robots comments, tests.
- Add one constant `BRAND = 'smph.tech'` in `site.ts` and use it everywhere. Make sure no CSS applies `text-transform: uppercase/capitalize` to the wordmark (`.brand span { text-transform: none }`).
- Extend `pnpm check:content` to fail if the string `SMPH.Tech` (any other casing than `smph.tech`) appears in `src/`, except inside the logo image file name.

## 2. Floating WhatsApp button (desktop and phone)

- A round green (`#25D366`) button with the white WhatsApp icon (`assets/tech-logos/whatsapp.svg`, set `fill="#fff"`), fixed bottom-right: **60px at right 24 / bottom 24 on desktop, 54px at right 14 / bottom 16 on phone** (add `env(safe-area-inset-bottom)`). Soft pulsing ring (disable under `prefers-reduced-motion`).
- Desktop: on hover or keyboard focus, a small white label slides out to its left: "Chat with us on WhatsApp". No label on phone.
- Link: `https://wa.me/919566831192?text=Hi%20smph.tech%2C%20I%20would%20like%20to%20talk%20about%20a%20project.` with `target="_blank" rel="noopener noreferrer"` and `aria-label="Chat with smph.tech on WhatsApp"`. Put the number in `site.ts` (`whatsappNumber`) and in CONFIRM.md: "Confirm +91 95668 31192 is on WhatsApp. If not, use the WhatsApp channel link instead."
- Show it on every page, including `/contact`. Hide it only on `/thank-you`.
- **Important:** `.pg` has `container-type: inline-size`, which makes it the containing block for `position: fixed` children. Render the button **outside `.pg`** (as a sibling in `layout.tsx`), not inside it, or it will scroll with the page. The reference files do this.
- Use `z-index` above the page but below the mobile menu overlay.

## 3. Remove the floating mobile bar and the "Up next" pill on phone

- **Delete the fixed bottom bar** (`Call` + `Book a free call`) completely, and any bottom padding that was added for it. Nothing sticky is shown on phone except the WhatsApp button. The header already has the menu, and every page ends with the "Book a free call" band.
- **Do not show the "Up next" pill on phone** (it collided with content and with the WhatsApp button). Keep it on desktop only (min-width 901px). The "Your path" section covers the phone.

## 4. Phone layout, section by section

Everything below is for **container width up to 640px** unless stated. Match `PHONE-*.html`.

**Global**
- Wrap padding 20px. Section vertical padding 52px (was 120px). Page-hero sections: top 4px (header is 64px), bottom 40px. Use CSS variables (`--sec-pad-y`: 120px desktop, 88px tablet, 52px phone) instead of inline numbers.
- Header height 64px, logo tile 38px, burger button 44x44 tap target.
- Type: `.h1` `clamp(30px, 9cqw, 38px)`, `.h2` `clamp(25px, 7.2cqw, 30px)`, lead 15.5px, eyebrow 11px. Buttons 52px high, 14px radius. In any flex-wrap row of buttons, make buttons full width (stacked).
- No horizontal page scroll at 360px. Only the carousels below scroll sideways.

**Mobile menu** (`PHONE-menu-open-390.html`): full-screen overlay with the same hero background. Close (X) in the header, big 28px links Home / Services / How we work / About with arrows and an orange dot on the current page, then full-width `Book a free call` and `Call +91 95668 31192`, then the email and the Instagram and WhatsApp-channel tiles. Lock body scroll while open, close on route change, Esc and link click, trap focus, return focus to the burger.

**Home hero: picture above, text below.**
- On phone and tablet the 3D image comes **first**, then the eyebrow, H1, lead, buttons, trust ticks. Use CSS `order: -1` on the image column (do not duplicate the image in the DOM, keep the H1 first in source order for SEO and screen readers).
- Image 108% wide (`margin: 0 -4%`), keep the floating chips but smaller (12px text, 24px icon). Buttons stacked, full width. Trust ticks wrap in two columns.
- The same "picture first" rule applies to: About hero, and the service page hero card (`.sh .svcard`).

**Services on the home page: one grid, like desktop.**
- `.bento` is a **2-column grid** on phone and tablet. Five services plus a sixth card **"Not sure which one? Tell us the problem. We will point you to the fix. -> Talk to us"** (orange gradient `#FF7A2E -> #F73F09`, links to `#contact`). The sixth card is hidden on desktop, so desktop stays 2 + 3.
- Compact card: scene image on top (4:3, contained), service name (16px bold), and the "See how we help" arrow link at the bottom. Hide the number and the quote on phone (the quote stays on desktop, and on the Services page). Card radius 22px, padding 10px 14px 16px, no hover lift.
- Tablet (641 to 900px): same 2-column grid with the larger cards (min-height 440px, quote visible).

**Five stages (home):** a single vertical timeline. Circle on the left (44px) with a gradient line connecting them (blue to violet to orange), title and one-line text on the right. No stacked big blocks.

**"How we think" cards:** compact rows: icon tile 50px on the left, title and text on the right, 12px gap between cards.

**The people who build it: 2 x 2 grid** (same as desktop's four across, folded to two). Name 14.5px, role 10.5px, 10px gap, photos 4:5. Hide the "About us" button in the heading row on phone.

**"Your path":** keep the 5-node progress line (labels 11px). The cards become a **horizontal scroll-snap carousel**: cards 80% wide, `scroll-snap-type: x mandatory`, `scroll-padding: 0 20px`, edge-to-edge scroll area (`margin: 0 -20px; padding: 4px 20px 18px`), scrollbar hidden. "Up next" is first.

**Contact band:** form card padding 22px, 13px/14px input padding, 16px font (stops iOS zoom), textarea 92px. Trust list, team avatars, then the two contact pills stacked full width.

**Footer:** top strip stacks: heading, text, then full-width orange `Call` and `Email` buttons. Brand block full width with the two social tiles. `Services` and `Explore` side by side in two columns. `Get in touch` full width. Bottom bar stacked, left-aligned.

**Services page (phone):** the five service pills become one horizontally scrollable row (no wrapping). Each service row: scene card on top (full width), then number and name, the problem quote at 23px, description, three bullets, tool chips (12.5px, wrapping), full-width button. "How it feels" rows stack (left sentence, then white after-card). The "Other services" cards on every service page become a **2 x 2 grid**.

**How we work (phone):** light hero, then the five stage pills in one scrollable row. Each stage band: huge faded numeral 78px, name 28px, colour pill, promise, then the three `We do / You get / We need from you` boxes stacked (padding 16px 18px, left bar 5px). "Your first call" and "Working terms" cards: single column, 12px gap.

**Service pages (phone):** picture card first, then breadcrumb is above it, then H1 and buttons stacked. The three fact cards stack (18px values). "Does any of this sound familiar" numbers 44px. Feature cards single column (padding 20px). The 4 "How it works" steps become the same vertical timeline as the home stages (44px circle left). FAQ rows padding 0 18px.

## 5. Quality bar

- Hero image: only the hero image is `priority`. Scene images use `sizes` per layout: grid card on phone `45vw`, row card `100vw` up to 640, so phones do not download 1600px PNGs. Prefer WebP/AVIF through `next/image`.
- Keep Lighthouse mobile A11y/BP/SEO at 100. Tap targets at least 44px. Carousels must be keyboard reachable (focusable cards, visible focus ring).
- Tests (Playwright) at 390x844, 360x740 and 768x1024:
  1. `document.documentElement.scrollWidth <= window.innerWidth` on every route.
  2. Home: the hero image's top is above the H1's top; `.bento` has 2 columns and 6 children on phone, 5 on desktop (6th hidden).
  3. Team grid has 2 columns on phone and 4 on desktop.
  4. WhatsApp button exists on every route except `/thank-you`, is `position: fixed`, inside the viewport at bottom-right, and its `href` starts with `https://wa.me/`.
  5. No element with the old mobile bar class/test id exists; the "Up next" pill is not rendered at 390 wide.
  6. The page text never contains `SMPH.Tech`.
- Run typecheck, lint, tests and build, then report briefly: what you changed, and any place you deviated from the reference and why.

## 6. Add to CONFIRM.md

- Is +91 95668 31192 a WhatsApp number? (floating button uses it)
- Confirm the pre-filled WhatsApp message text.
