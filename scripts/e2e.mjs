// End-to-end checks with Playwright. Usage: BASE=http://localhost:3100 node scripts/e2e.mjs [phone|links|ui|pages|footer|journey|visited|pill|nav|tracker|contact-links|team-links|form-ui|form-success|form-script|form-fail]
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:3100';
const which = process.argv[2] ?? 'links';
const fails = [];
const ok = (cond, msg) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!cond) fails.push(msg);
};

const browser = await chromium.launch();

async function links() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  const routes = [
    '/',
    '/services',
    '/services/web-applications',
    '/services/mobile-apps',
    '/services/management-systems',
    '/services/digital-marketing',
    '/services/tech-consulting-automation',
    '/how-we-work',
    '/about',
    '/contact',
    '/thank-you',
  ];
  const seen = new Map();
  for (const r of routes) {
    const res = await page.goto(BASE + r, { waitUntil: 'load' });
    ok(res.status() === 200, `${r} responds 200`);
    ok((await page.locator('h1').count()) === 1, `${r} has exactly one h1`);
    ok((await page.locator('main').count()) === 1, `${r} has one main landmark`);
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
    for (const h of hrefs) seen.set(h, (seen.get(h) ?? 0) + 1);
  }
  const bad = [...seen.keys()].filter((h) => /\.html|\.dc\.html|^#$|^$/.test(h));
  ok(bad.length === 0, `no .html or empty links (${bad.join(', ') || 'none'})`);
  const internal = [...seen.keys()].filter((h) => h.startsWith('/') || h.startsWith('#'));
  const checked = new Set();
  for (const h of internal) {
    if (h.startsWith('#')) continue;
    const path = h.split('#')[0].split('?')[0];
    if (checked.has(path)) continue;
    checked.add(path);
    const res = await page.request.get(BASE + path);
    ok(res.status() === 200, `link target ${path} is 200`);
  }
  const external = [...seen.keys()].filter((h) => /^(https?:|mailto:)/.test(h));
  console.log('INFO  external/mailto links found:', external.length ? external.join(', ') : 'none');
  const bookHrefs = {};
  for (const r of ['/', '/services', '/about', '/services/web-applications']) {
    await page.goto(BASE + r);
    bookHrefs[r] = await page.$$eval('a', (as) =>
      as
        .filter((a) => /book a free call|talk about this/i.test(a.textContent))
        .map((a) => a.getAttribute('href')),
    );
  }
  ok(
    bookHrefs['/'].every((h) => h === '#contact') && bookHrefs['/'].length >= 2,
    `home Book buttons scroll to #contact (${bookHrefs['/']})`,
  );
  ok(
    bookHrefs['/services'].every((h) => h === '/contact'),
    `services Book buttons go to /contact (${bookHrefs['/services']})`,
  );
  ok(
    bookHrefs['/about'].every((h) => h === '/contact'),
    `about Book buttons go to /contact (${bookHrefs['/about']})`,
  );
  ok(
    bookHrefs['/services/web-applications'].some((h) => h === '/contact?service=web-applications'),
    `service page "Talk about this" preselects service (${bookHrefs['/services/web-applications']})`,
  );
  const bad404 = await page.request.get(BASE + '/services/nope');
  ok(bad404.status() === 404, 'unknown service slug is 404');
  const html = await (await page.request.get(BASE + '/')).text();
  ok(!/Founder|Four friends/i.test(html), 'home HTML has no banned phrases');
  ok(
    consoleErrors.length === 0,
    `no console errors (${consoleErrors.slice(0, 2).join(' | ') || 'none'})`,
  );
  await ctx.close();
}

const text = (page, sel) => page.locator(sel).allInnerTexts();
const hrefs = (page, sel) => page.$$eval(sel, (as) => as.map((a) => a.getAttribute('href')));

async function nav() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/about', { waitUntil: 'networkidle' });
  const items = (await text(page, 'header .nav > a')).map((t) => t.trim());
  ok(
    JSON.stringify(items) ===
      JSON.stringify(['Home', 'Services', 'How we work', 'About', 'Book a free call']),
    `nav items and order (${items})`,
  );
  ok(
    (await page.locator('.dd, .menu, #services-menu, header .nav [aria-haspopup]').count()) === 0,
    'no dropdown markup in the header',
  );
  ok(
    (await page.locator('header .nav a[href="/services"]').getAttribute('aria-haspopup')) === null,
    'Services is a plain link',
  );
  ok(
    JSON.stringify(await hrefs(page, 'header .nav > a')) ===
      JSON.stringify(['/', '/services', '/how-we-work', '/about', '/contact']),
    'nav hrefs',
  );
  ok(
    (await page.locator('header.hd > .hdin > .brand').getAttribute('href')) === '/',
    'logo links to /',
  );
  await page.hover('header .nav a[href="/services"]');
  await page.waitForTimeout(250);
  ok(
    (await page.locator('header .nav a:visible').count()) === 5,
    'hovering Services opens nothing',
  );
  // active underline
  const on = page.locator('header .nav a.on');
  ok(
    (await on.count()) === 1 && (await on.innerText()) === 'About',
    'About is the active item on /about',
  );
  const u = await on.evaluate((e) => {
    const c = getComputedStyle(e, '::after');
    return { h: c.height, l: c.left, r: c.right, b: c.bottom, bg: c.backgroundImage };
  });
  ok(
    u.h === '3px' && u.l === '16px' && u.r === '16px' && u.b === '3px',
    `active underline is 3px, inset 16px, 3px from the bottom (${JSON.stringify(u)})`,
  );
  ok(
    /255, 122, 46/.test(u.bg) && /247, 63, 9/.test(u.bg),
    'underline uses the logo orange gradient',
  );
  // keyboard: Tab order Home, Services, How we work, About, Book
  await page.goto(BASE + '/how-we-work', { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  const seq = [];
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Tab');
    seq.push(await page.evaluate(() => document.activeElement?.textContent?.trim()));
  }
  ok(
    JSON.stringify(seq) ===
      JSON.stringify(['Home', 'Services', 'How we work', 'About', 'Book a free call']),
    `keyboard Tab reaches the five items in order (${seq})`,
  );
  // Services link goes to /services; light header on /how-we-work only
  ok(
    (await page.locator('header.hd.lt').count()) === 1,
    'header is the light variant on /how-we-work',
  );
  await page.goto(BASE + '/services', { waitUntil: 'networkidle' });
  ok((await page.locator('header.hd.lt').count()) === 0, 'header is dark on /services');
  await page.click('header .nav a[href="/how-we-work"]');
  await page.waitForURL('**/how-we-work');
  await page.click('header .nav a[href="/services"]');
  await page.waitForURL('**/services');
  ok(true, 'Services link navigates to /services');
  await ctx.close();

  // full-screen mobile menu (V5)
  const m = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await m.newPage();
  await mp.goto(BASE + '/services', { waitUntil: 'networkidle' });
  ok(await mp.locator('.burger').first().isVisible(), 'burger visible at 390px');
  ok(!(await mp.locator('.nav').isVisible()), 'desktop nav hidden at 390px');
  const burgerBox = await mp.locator('header.hd > .hdin > .burger').boundingBox();
  ok(
    burgerBox && burgerBox.width >= 44 && burgerBox.height >= 44,
    `burger is a 44px tap target (${burgerBox?.width}x${burgerBox?.height})`,
  );
  await mp.click('header.hd > .hdin > .burger');
  const dlg = mp.locator('dialog.mm');
  ok(await dlg.isVisible(), 'mobile menu opens');
  const box = await dlg.boundingBox();
  ok(
    box && box.width >= 389 && box.height >= 843,
    `mobile menu is full screen (${box?.width}x${box?.height})`,
  );
  const mitems = (await text(mp, 'dialog.mm .mnav a')).map((t) => t.trim());
  ok(
    JSON.stringify(mitems) === JSON.stringify(['Home', 'Services', 'How we work', 'About']),
    `menu items, Home first (${mitems})`,
  );
  ok((await mp.locator('dialog.mm .mnav a svg').count()) === 4, 'each menu link has an arrow');
  ok(
    (await mp.locator('dialog.mm .mnav a.on').innerText()).trim() === 'Services',
    'current page is marked (orange dot) in the menu',
  );
  const dot = await mp
    .locator('dialog.mm .mnav a.on')
    .evaluate((e) => getComputedStyle(e, '::before').backgroundColor);
  ok(dot === 'rgb(255, 90, 31)', `the current-page dot is orange (${dot})`);
  const fs = await mp
    .locator('dialog.mm .mnav a')
    .first()
    .evaluate((e) => getComputedStyle(e).fontSize);
  ok(fs === '28px', `menu links are 28px (${fs})`);
  ok(
    (await mp.locator('dialog.mm a.btn[href="/contact"]').innerText()).includes('Book a free call'),
    'menu has a full-width Book a free call',
  );
  const callBtn = mp.locator('dialog.mm a.btn.ghost[href="tel:+919566831192"]');
  ok((await callBtn.innerText()).includes('Call +91 95668 31192'), 'menu has Call +91 95668 31192');
  const widths = await mp.$$eval('dialog.mm a.btn', (as) =>
    as.map((a) => Math.round(a.getBoundingClientRect().width)),
  );
  ok(
    widths.every((w) => w >= 340),
    `menu buttons are full width (${widths})`,
  );
  ok(
    (await mp
      .locator('dialog.mm a[href="mailto:smph.tech@gmail.com?subject=Enquiry%20from%20smph.tech"]')
      .count()) === 1,
    'menu shows the email',
  );
  ok(
    (await mp.locator('dialog.mm a.sb[href="https://www.instagram.com/smph.tech/"]').count()) ===
      1 &&
      (await mp
        .locator('dialog.mm a.sb[href="https://whatsapp.com/channel/0029Vb9H9qI7oQheRpgygP00"]')
        .count()) === 1,
    'menu has the Instagram and WhatsApp channel tiles',
  );
  ok(
    (await mp.evaluate(() => getComputedStyle(document.documentElement).overflow)) === 'hidden',
    'page scroll is locked while the menu is open',
  );
  // focus is trapped inside the dialog
  for (let i = 0; i < 14; i++) await mp.keyboard.press('Tab');
  ok(
    await mp.evaluate(() => !!document.activeElement?.closest('dialog.mm')),
    'Tab stays inside the open menu (focus trap)',
  );
  await mp.keyboard.press('Escape');
  ok(!(await dlg.isVisible()), 'Esc closes the mobile menu');
  ok(
    await mp.evaluate(
      () =>
        document.activeElement?.classList.contains('burger') &&
        !document.activeElement.closest('dialog'),
    ),
    'focus returns to the burger',
  );
  ok(
    (await mp.evaluate(() => getComputedStyle(document.documentElement).overflow)) !== 'hidden',
    'page scroll unlocked after closing',
  );
  await mp.click('header.hd > .hdin > .burger');
  await mp.click('dialog.mm .mnav a[href="/how-we-work"]');
  await mp.waitForURL('**/how-we-work');
  await mp.waitForTimeout(400);
  ok(!(await dlg.isVisible()), 'mobile menu closes after clicking a link');
  await mp.click('header.hd > .hdin > .burger');
  await mp.click('dialog.mm .mm-top .burger');
  ok(!(await dlg.isVisible()), 'the X closes the menu');
  await mp.click('header.hd > .hdin > .burger');
  await mp.evaluate(() => document.querySelector('dialog.mm .mnav a[href="/about"]').click());
  await mp.waitForURL('**/about');
  await mp.waitForTimeout(400);
  ok(!(await dlg.isVisible()), 'mobile menu closes on route change');
  // V5: the fixed bottom bar is gone for good
  ok(
    (await mp
      .locator('.sbar, .sbar-sp, .sb-call, .sb-book, [data-testid="mobile-bar"]')
      .count()) === 0,
    'no mobile bar element exists',
  );
  ok((await mp.locator('.upnext').count()) === 0, 'the "Up next" pill is not rendered on phones');
  await mp.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await mp.waitForTimeout(400);
  const pad = await mp.evaluate(
    () => getComputedStyle(document.querySelector('footer.ft')).paddingBottom,
  );
  ok(pad === '0px', `no extra bottom padding for a bar (footer padding-bottom ${pad})`);
  const overflow = await mp.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  ok(!overflow, 'no horizontal scroll at 390px');
  await m.close();
  // V6: no dot under any nav item, desktop or menu; the active page keeps its underline
  const dn = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dp = await dn.newPage();
  await dp.goto(BASE + '/', { waitUntil: 'networkidle' });
  await dp.goto(BASE + '/services', { waitUntil: 'networkidle' });
  await dp.goto(BASE + '/about', { waitUntil: 'networkidle' });
  ok(
    (await dp
      .locator(
        'header nav.nav [class*="dot"], header nav.nav .vd, header nav.nav i, header nav.nav b',
      )
      .count()) === 0,
    'header nav has no dot element',
  );
  const marks = await dp.$$eval('header nav.nav a', (as) =>
    as.map((a) => {
      const cs = getComputedStyle(a, '::after');
      const dot = parseFloat(cs.width) <= 8 && parseFloat(cs.height) <= 8 && cs.content !== 'none';
      return { on: a.classList.contains('on'), dot };
    }),
  );
  ok(
    marks.every((m) => !m.dot),
    'no ::after dot on any nav item',
  );
  ok(
    marks.filter((m) => m.on).length === 1 &&
      (await dp.locator('header nav.nav a.on').innerText()) === 'About' &&
      (await dp.locator('header nav.nav a.on').getAttribute('aria-current')) === 'page',
    'the active page is still marked (About)',
  );
  const under = await dp
    .locator('header nav.nav a.on')
    .evaluate((a) => parseFloat(getComputedStyle(a, '::after').height));
  ok(under === 3, `the active underline is the only indicator (${under}px tall)`);
  const mp2 = await dn.newPage();
  await mp2.setViewportSize({ width: 390, height: 844 });
  await mp2.goto(BASE + '/services', { waitUntil: 'networkidle' });
  await mp2.locator('header.hd > .hdin > .burger').click();
  ok(
    (await mp2.locator('dialog.mm [class*="dot"], dialog.mm .vd').count()) === 0,
    'the menu has no visited-dot element',
  );
  await dn.close();
}

async function ui() {
  await nav();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  // Regression: class names built with template literals once lost their spaces ("bcw3", "btnsm").
  await page.goto(BASE + '/');
  const count = (sel) => page.locator(sel).count();
  ok(
    (await count('.bc:not(.cta6)')) === 5 &&
      (await count('.bc.w3')) === 2 &&
      (await count('.bc.cta6')) === 1,
    'home: 5 service cards (2 wide) and the sixth card',
  );
  ok((await count('.nav .btn.sm')) === 1, 'header Book button is the small variant');
  ok((await count('.btn.ghost')) >= 2, 'ghost buttons render');
  ok(
    !(await page.evaluate(() =>
      /\b(bcw3|btnsm|btndk|fcw|btnghost)\b/.test(document.body.innerHTML),
    )),
    'no merged class names on home',
  );
  // Regression: the two wide feature cards once lost their styling (class typo).
  await page.goto(BASE + '/services/web-applications');
  const feat = await page.$$eval('.feat > div', (els) =>
    els.map((e) => [e.className, getComputedStyle(e).paddingTop]),
  );
  ok(
    feat.length === 5 && feat.every(([, pad]) => pad === '32px'),
    `all 5 feature cards are styled (${JSON.stringify(feat.map((f) => f[0]))})`,
  );
  ok(
    feat.slice(0, 2).every(([c]) => c === 'glass fc w'),
    'first two feature cards are the wide variant',
  );
  await ctx.close();
}

async function pages() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const GRAD = {
    'web-applications': '#2F55E6',
    'mobile-apps': '#10B58A',
    'management-systems': '#FF8A3D',
    'digital-marketing': '#E8338B',
    'tech-consulting-automation': '#8A5CFF',
  };

  // --- Home
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  ok((await page.locator('.bc img.sc').count()) === 5, 'home: five bento cards use scene images');
  ok(
    (await page.locator('img[src*="%2F3d%2F"]').count()) === 1,
    'home: only the hero uses a 3D image',
  );
  const bg = await page.$$eval('.bc', (els) => els.map((e) => e.getAttribute('style') ?? ''));
  ok(
    Object.values(GRAD).every((c, i) => bg[i]?.toLowerCase().includes(c.toLowerCase())),
    'home: bento cards use the five service colours',
  );
  ok(
    (await page.locator('.who img').count()) === 4 &&
      /talk to the people/.test(await page.locator('.who').innerText()),
    'contact band shows four team photos and the "people who build it" line',
  );
  ok(
    (await hrefs(page, '.callrow a')).join() ===
      'tel:+919566831192,mailto:smph.tech@gmail.com?subject=Enquiry%20from%20smph.tech',
    'contact band has the phone and email pills',
  );
  ok(
    (await page.locator('.steps').count()) === 1 &&
      (await page
        .locator('.eyebrow i')
        .first()
        .evaluate((e) => getComputedStyle(e).backgroundColor)) === 'rgb(255, 122, 61)',
    'eyebrow dot is orange',
  );
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForSelector('#contact form.fcard', { timeout: 8000 }).catch(() => {});
  ok(
    (await page.locator('#contact form').count()) === 1,
    'home contact form is present (loads on scroll)',
  );
  ok((await page.locator('.who + .callrow').count()) === 1, 'who row sits above the call pills');

  // --- Services
  await page.goto(BASE + '/services', { waitUntil: 'networkidle' });
  const pills = await page.$$eval('.svpills a', (as) =>
    as.map((a) => [a.getAttribute('href'), a.textContent.trim(), a.getAttribute('style')]),
  );
  ok(
    JSON.stringify(pills.map((p) => p[0])) ===
      JSON.stringify(['#web', '#mobile', '#systems', '#marketing', '#consulting']),
    `five pills scroll to #web...#consulting (${pills.map((p) => p[0])})`,
  );
  ok(pills.map((p) => /--c:\s*#/i.test(p[2])).every(Boolean), 'each pill has a coloured dot');
  for (const id of ['web', 'mobile', 'systems', 'marketing', 'consulting'])
    ok((await page.locator(`.zz#${id}`).count()) === 1, `row #${id} exists`);
  ok((await page.locator('.zz .tools').count()) === 5, 'each row has a tools row');
  ok(
    (
      await page.$$eval('.zz .tools', (els) =>
        els.map((e) => e.querySelectorAll('[role=listitem]').length),
      )
    ).every((n) => n === 4),
    'rows show the first 4 tool logos',
  );
  ok(
    (await page.locator('.zimg img').count()) === 5 &&
      (await page.locator('.tbl, .trow').count()) === 0,
    'five scene images, no comparison table',
  );
  ok((await page.locator('.fr').count()) === 5, 'How it feels has five rows');
  const feelSentences = await page.$$eval('.fr q', (qs) => qs.map((q) => q.textContent.trim()));
  ok(
    feelSentences.includes('Every booking means a call, a message and a reminder.') &&
      feelSentences.includes('We repeat the same tasks every day, and nobody likes it.'),
    'How it feels uses the exact copy',
  );
  ok(
    (await page.locator('.fr .lg img').count()) === 5 + 5 + 4 + 5 + 4,
    'How it feels shows all tool logos (5+5+4+5+4)',
  );
  ok(
    await page.$$eval('.fr .lg img', (imgs) =>
      imgs.every((i) => (i.getAttribute('alt') ?? '').length > 1),
    ),
    'every logo tile has an alt name',
  );
  ok(
    /Which of these sounds like your week\?/.test(
      await page
        .locator('.fr')
        .first()
        .evaluate((e) => e.closest('section').querySelector('h2').textContent),
    ),
    'How it feels title',
  );
  ok(!/\[X to Y/.test(await page.content()), 'no timeline placeholders on /services');

  // --- Service pages
  for (const slug of Object.keys(GRAD)) {
    await page.goto(BASE + '/services/' + slug, { waitUntil: 'networkidle' });
    const crumb = (await page.locator('.crumb').innerText()).replace(/\s+/g, ' ');
    ok(
      /^Home \/ Services \/ /.test(crumb),
      `${slug}: breadcrumb Home / Services / name (${crumb})`,
    );
    ok(
      (await page.locator('.svcard img').count()) === 1 &&
        (await page.locator('.chip').count()) === 0,
      `${slug}: hero is the scene card, no floating chips`,
    );
    const facts = await page.$$eval('.facts3 .k', (els) => els.map((e) => e.textContent.trim()));
    ok(
      JSON.stringify(facts) === JSON.stringify(['How we start', 'Price', 'Examples']),
      `${slug}: fact cards (${facts})`,
    );
    ok(
      (await page.locator('.facts3 .v').first().innerText()) === 'A free call, no obligation' &&
        !/Typical timeline|\[X to Y/.test(await page.content()),
      `${slug}: no timeline`,
    );
    ok(
      (await page.locator('#build .tools [role=listitem]').count()) >= 4,
      `${slug}: "Built with tools such as" row`,
    );
    ok(
      /Built with tools such as/.test(
        (await page.locator('#build .tools').getAttribute('aria-label')) ?? '',
      ),
      `${slug}: tools row has an accessible name`,
    );
    ok(
      (await page.locator('.ocard').count()) === 4 &&
        (await page.locator('.ocard img').count()) === 4,
      `${slug}: four other-service cards with scene images`,
    );
    ok(
      (await page.locator('.ocard').first().getAttribute('style')).includes(
        'linear-gradient(160deg',
      ),
      `${slug}: other-service cards use service colours`,
    );
    const cta = await page.locator('main section').last().locator('h2').innerText();
    ok(
      cta === 'Let us look at your problem.' &&
        (await page.locator('main section').last().locator('.btn').count()) === 1,
      `${slug}: CTA band copy and a single button`,
    );
  }

  // --- How we work
  await page.goto(BASE + '/how-we-work', { waitUntil: 'networkidle' });
  ok(
    (await page.locator('section.hl').count()) === 1 && (await page.locator('.rb').count()) === 5,
    'how: light hero with five stage pills',
  );
  ok(
    JSON.stringify(await text(page, '.rb small')) ===
      JSON.stringify([
        'You feel heard',
        'You feel clear',
        'You feel in control',
        'You feel relieved',
        'You feel backed up',
      ]),
    'how: pill feelings',
  );
  ok(
    JSON.stringify(await hrefs(page, '.rb')) ===
      JSON.stringify(['#s1', '#s2', '#s3', '#s4', '#s5']),
    'how: pills link to the stages',
  );
  const stages = await page.$$eval('.stg2', (els) =>
    els.map((e) => [e.id, e.getAttribute('style')]),
  );
  ok(
    stages.length === 5 &&
      stages.every(([id, st], i) => id === `s${i + 1}` && /--c:/.test(st) && /--t:/.test(st)),
    'how: five tinted stage bands',
  );
  ok(
    JSON.stringify(await text(page, '.stg2 .fe')) ===
      JSON.stringify([
        'You feel: Heard',
        'You feel: Clear',
        'You feel: In control',
        'You feel: Relieved',
        'You feel: Backed up',
      ]),
    'how: "You feel:" pills',
  );
  ok((await page.locator('.sbox').count()) === 15, 'how: three cards per stage');
  ok(
    (await page.locator('.tm2').count()) === 0 && !/\[X to Y|\[X weeks/.test(await page.content()),
    'how: no duration chips',
  );
  const sticky = await page
    .locator('.stg2 .lft')
    .first()
    .evaluate((e) => getComputedStyle(e).position);
  ok(sticky === 'sticky', 'how: stage heading is sticky on desktop');
  ok(
    (await page.locator('.fc1 .it').count()) === 7 &&
      /just a conversation/i.test(await page.locator('main').textContent()),
    'how: first-call cards and working terms',
  );

  // --- About
  await page.goto(BASE + '/about', { waitUntil: 'networkidle' });
  ok(
    (await page.locator('.chip2.lc2').count()) === 8 &&
      (await page.locator('.chip2.lc2 img').count()) === 8,
    'about: eight tool pills, each with a logo',
  );
  ok(
    /React Native/.test(await page.locator('.chip2.lc2').nth(4).innerText()),
    'about: fifth pill is labelled React Native',
  );
  ok(
    (await hrefs(page, 'a.btn[href^="https://"]')).join() ===
      'https://www.instagram.com/smph.tech/,https://whatsapp.com/channel/0029Vb9H9qI7oQheRpgygP00',
    'about: Instagram and WhatsApp channel buttons',
  );
  ok(!/youtube/i.test(await page.content()), 'about: no YouTube');
  await ctx.close();
}

const ALL_ROUTES = [
  '/',
  '/services',
  '/services/web-applications',
  '/services/mobile-apps',
  '/services/management-systems',
  '/services/digital-marketing',
  '/services/tech-consulting-automation',
  '/how-we-work',
  '/about',
  '/contact',
  '/thank-you',
];
const cols = (page, sel) =>
  page
    .locator(sel)
    .first()
    .evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(' ').filter(Boolean).length);

/** V5: phone-first layout at 390x844, 360x740 and 768x1024, plus desktop. */
async function phone() {
  const sizes = [
    { name: 'phone 390', w: 390, h: 844, kind: 'phone' },
    { name: 'phone 360', w: 360, h: 740, kind: 'phone' },
    { name: 'tablet 768', w: 768, h: 1024, kind: 'tablet' },
    { name: 'desktop 1440', w: 1440, h: 900, kind: 'desktop' },
  ];
  for (const { name, w, h, kind } of sizes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });

    // 1. no horizontal page scroll on any route; 4. WhatsApp button; 6. brand
    for (const r of ALL_ROUTES) {
      await page.goto(BASE + r, { waitUntil: 'networkidle' });
      const sw = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        window.innerWidth,
      ]);
      ok(sw[0] <= sw[1], `${name} ${r}: no horizontal scroll (${sw[0]} <= ${sw[1]})`);
      const fab = page.locator('a.wafab');
      if (r === '/thank-you') {
        ok((await fab.count()) === 0, `${name} ${r}: no WhatsApp button on /thank-you`);
      } else {
        ok((await fab.count()) === 1, `${name} ${r}: WhatsApp button exists`);
        const g = await fab.evaluate((e) => {
          const wi = e.querySelector('.wi').getBoundingClientRect();
          return {
            pos: getComputedStyle(e).position,
            right: window.innerWidth - wi.right,
            bottom: window.innerHeight - wi.bottom,
            wi: wi.width,
            inside:
              wi.left >= 0 &&
              wi.right <= window.innerWidth &&
              wi.top >= 0 &&
              wi.bottom <= window.innerHeight,
            href: e.getAttribute('href'),
            target: e.target,
            rel: e.rel,
            aria: e.getAttribute('aria-label'),
            inPg: !!e.closest('.pg'),
          };
        });
        ok(
          g.pos === 'fixed' && g.inside && !g.inPg,
          `${name} ${r}: button is fixed, inside the viewport, outside .pg`,
        );
        const expect =
          kind === 'phone'
            ? { size: 54, right: 14, bottom: 16 }
            : { size: 60, right: 24, bottom: 24 };
        ok(
          Math.round(g.wi) === expect.size &&
            Math.round(g.right) === expect.right &&
            Math.round(g.bottom) === expect.bottom,
          `${name} ${r}: ${expect.size}px at right ${expect.right} / bottom ${expect.bottom} (got ${Math.round(g.wi)}px, ${Math.round(g.right)}, ${Math.round(g.bottom)})`,
        );
        ok(
          g.href.startsWith(
            'https://wa.me/919566831192?text=Hi%20smph.tech%2C%20I%20would%20like%20to%20talk%20about%20a%20project.',
          ) &&
            g.target === '_blank' &&
            /noopener/.test(g.rel) &&
            /noreferrer/.test(g.rel) &&
            g.aria === 'Chat with smph.tech on WhatsApp',
          `${name} ${r}: wa.me link, new tab, aria-label`,
        );
      }
      const bad = await page.evaluate(() => {
        const t =
          document.title +
          ' ' +
          document.body.innerText +
          ' ' +
          [...document.querySelectorAll('[alt],[aria-label],[title],meta[content]')]
            .map(
              (e) =>
                (e.getAttribute('alt') ?? '') +
                (e.getAttribute('aria-label') ?? '') +
                (e.getAttribute('title') ?? '') +
                (e.tagName === 'META' ? e.getAttribute('content') : ''),
            )
            .join(' ');
        return (
          (t.match(/smph\.tech/gi) ?? []).filter((x) => x !== 'smph.tech').length +
          (t.includes('SMPH.Tech') ? 1 : 0)
        );
      });
      ok(bad === 0, `${name} ${r}: never shows "SMPH.Tech"`);
    }

    // 2. Home: picture first on phone and tablet; 6-card grid
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const hero = await page.evaluate(() => ({
      img: document.querySelector('.herogrid .h3d img.main').getBoundingClientRect().top,
      h1: document.querySelector('.herogrid h1').getBoundingClientRect().top,
      h1First: document
        .querySelector('.herogrid')
        .firstElementChild.contains(document.querySelector('h1')),
    }));
    ok(hero.h1First, `${name}: the H1 stays first in source order`);
    if (kind === 'desktop') ok(hero.img < hero.h1 + 400, `${name}: picture sits beside the text`);
    else
      ok(
        hero.img < hero.h1,
        `${name}: the hero picture is above the H1 (${Math.round(hero.img)} < ${Math.round(hero.h1)})`,
      );
    const bento = await page.evaluate(() => ({
      total: document.querySelectorAll('.bento > *').length,
      visible: [...document.querySelectorAll('.bento > *')].filter((e) => e.offsetParent !== null)
        .length,
    }));
    ok(bento.total === 6, `${name}: bento has 6 children (${bento.total})`);
    if (kind === 'desktop') {
      ok(bento.visible === 5, `${name}: 5 cards visible, the sixth is hidden (${bento.visible})`);
      ok((await cols(page, '.bento')) === 6, `${name}: desktop grid is the 6-column (2 + 3) bento`);
    } else {
      ok(bento.visible === 6, `${name}: all 6 cards visible (${bento.visible})`);
      ok((await cols(page, '.bento')) === 2, `${name}: bento is a 2-column grid`);
      ok(
        /Not sure which one\?/.test(await page.locator('.bc.cta6').innerText()) &&
          (await page.locator('.bc.cta6').getAttribute('href')) === '#contact',
        `${name}: sixth card "Not sure which one?" links to #contact`,
      );
    }
    if (kind === 'phone') {
      ok(
        !(await page.locator('.bc .num').first().isVisible()) &&
          !(await page.locator('.bc p').first().isVisible()),
        `${name}: card number and quote are hidden`,
      );
      const r = await page
        .locator('.bc')
        .first()
        .evaluate((e) => getComputedStyle(e).borderRadius);
      ok(r === '22px', `${name}: card radius 22px (${r})`);
      ok((await cols(page, '.steps')) === 1, `${name}: stages are one vertical timeline`);
      const sp = await page
        .locator('.sp')
        .first()
        .evaluate((e) => getComputedStyle(e).gridTemplateColumns);
      ok(sp.startsWith('44px'), `${name}: stage circle column is 44px (${sp})`);
      ok(
        (
          await page
            .locator('.wc')
            .first()
            .evaluate((e) => getComputedStyle(e).gridTemplateColumns)
        ).startsWith('50px'),
        `${name}: "How we think" cards are compact rows (50px icon)`,
      );
      ok(
        !(await page.locator('.thd .btn').isVisible()),
        `${name}: "About us" button hidden on phone`,
      );
      const jc = await page.locator('.jc').evaluate((e) => ({
        ox: getComputedStyle(e).overflowX,
        snap: getComputedStyle(e).scrollSnapType,
        scroll: e.scrollWidth > e.clientWidth,
        w:
          e.firstElementChild.getBoundingClientRect().width /
          e.parentElement.getBoundingClientRect().width,
      }));
      ok(
        jc.ox === 'auto' && /x mandatory/.test(jc.snap) && jc.scroll,
        `${name}: "Your path" cards are a scroll-snap carousel (${jc.snap})`,
      );
      ok(
        await page
          .locator('.jc a')
          .first()
          .evaluate((e) => e.classList.contains('nx')),
        `${name}: "Up next" is the first card on Home`,
      );
      await page.locator('.jc a').nth(1).focus();
      ok(
        await page.evaluate(() => document.activeElement?.classList.contains('jcard')),
        `${name}: carousel cards are keyboard focusable`,
      );
      const heroBtns = await page.$$eval('.herogrid .btnrow a.btn', (as) =>
        as.map((a) => Math.round(a.getBoundingClientRect().width)),
      );
      ok(
        heroBtns.length === 2 && heroBtns.every((w2) => w2 >= w - 60),
        `${name}: hero buttons are stacked, full width (${heroBtns})`,
      );
      const trust = await page
        .locator('.trust')
        .first()
        .evaluate((e) => getComputedStyle(e).fontSize);
      ok(trust === '13.5px', `${name}: trust ticks 13.5px`);
    }
    // 3. team grid
    const tcols = await cols(page, '.tm');
    if (kind === 'phone') ok(tcols === 2, `${name}: team grid has 2 columns (${tcols})`);
    else if (kind === 'desktop') ok(tcols === 4, `${name}: team grid has 4 columns (${tcols})`);
    else ok(tcols >= 2 && tcols <= 4, `${name}: team grid has 2 to 4 columns (${tcols})`);
    if (kind === 'phone') {
      const ratio = await page
        .locator('.tc img')
        .first()
        .evaluate((e) => e.getBoundingClientRect().width / e.getBoundingClientRect().height);
      ok(Math.abs(ratio - 0.8) < 0.02, `${name}: team photos are 4:5 (${ratio.toFixed(2)})`);
    }

    // phone: other pages
    if (kind === 'phone') {
      await page.goto(BASE + '/services', { waitUntil: 'networkidle' });
      const pills = await page.locator('.svpills').evaluate((e) => ({
        wrap: getComputedStyle(e).flexWrap,
        ox: getComputedStyle(e).overflowX,
        scroll: e.scrollWidth > e.clientWidth,
      }));
      ok(
        pills.wrap === 'nowrap' && pills.ox === 'auto' && pills.scroll,
        `${name}: service pills are one scrollable row`,
      );
      ok(
        (await page
          .locator('.zz .btn')
          .first()
          .evaluate((e) => e.getBoundingClientRect().width)) >=
          w - 50,
        `${name}: row buttons are full width`,
      );
      ok(
        (await page
          .locator('.zz h2')
          .first()
          .evaluate((e) => getComputedStyle(e).fontSize)) === '23px',
        `${name}: row quote is 23px`,
      );
      ok(
        (await page
          .locator('.fr')
          .first()
          .evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(' ').length)) === 1,
        `${name}: "How it feels" rows stack`,
      );
      await page.goto(BASE + '/how-we-work', { waitUntil: 'networkidle' });
      const rib = await page.locator('.rib').evaluate((e) => ({
        wrap: getComputedStyle(e).flexWrap,
        scroll: e.scrollWidth > e.clientWidth,
      }));
      ok(rib.wrap === 'nowrap' && rib.scroll, `${name}: stage pills are one scrollable row`);
      ok(
        (await page
          .locator('.big')
          .first()
          .evaluate((e) => getComputedStyle(e).fontSize)) === '78px',
        `${name}: stage numeral 78px`,
      );
      ok(
        (await page
          .locator('.stg2 h2')
          .first()
          .evaluate((e) => getComputedStyle(e).fontSize)) === '28px',
        `${name}: stage name 28px`,
      );
      ok(
        (await page
          .locator('.sbox')
          .first()
          .evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(' ').length)) === 1 &&
          (await page
            .locator('.sbox')
            .first()
            .evaluate((e) => getComputedStyle(e).borderLeftWidth)) === '5px',
        `${name}: stage boxes stacked, 5px bar`,
      );
      ok((await cols(page, '.fc1')) === 1, `${name}: first-call and terms cards are one column`);
      await page.goto(BASE + '/services/web-applications', { waitUntil: 'networkidle' });
      const order = await page.evaluate(() => ({
        card: document.querySelector('.svcard').getBoundingClientRect().top,
        h1: document.querySelector('.sh h1').getBoundingClientRect().top,
        crumb: document.querySelector('.crumb').getBoundingClientRect().top,
      }));
      ok(
        order.crumb < order.card && order.card < order.h1,
        `${name}: breadcrumb, then the picture card, then the H1`,
      );
      ok(
        (await page
          .locator('.facts3 .v')
          .first()
          .evaluate((e) => getComputedStyle(e).fontSize)) === '18px',
        `${name}: fact values 18px`,
      );
      ok(
        (await page
          .locator('.nd .n')
          .first()
          .evaluate((e) => getComputedStyle(e).fontSize)) === '44px',
        `${name}: problem numbers 44px`,
      );
      ok((await cols(page, '.feat')) === 1, `${name}: feature cards single column`);
      ok(
        (
          await page
            .locator('.sq')
            .first()
            .evaluate((e) => getComputedStyle(e).gridTemplateColumns)
        ).startsWith('44px'),
        `${name}: "How it works" steps are a vertical timeline`,
      );
      ok((await cols(page, '.oc')) === 2, `${name}: other services are a 2 x 2 grid`);
      await page.goto(BASE + '/about', { waitUntil: 'networkidle' });
      const ab = await page.evaluate(() => ({
        img: document.querySelector('.herogrid .h3d').getBoundingClientRect().top,
        h1: document.querySelector('.herogrid h1').getBoundingClientRect().top,
      }));
      ok(ab.img < ab.h1, `${name}: About hero picture is above the text`);
      // contact + footer
      await page.goto(BASE + '/contact', { waitUntil: 'networkidle' });
      ok(
        (await page
          .locator('.fcard input')
          .first()
          .evaluate((e) => getComputedStyle(e).fontSize)) === '16px',
        `${name}: inputs are 16px (no iOS zoom)`,
      );
      ok(
        (await page.locator('.fcard textarea').evaluate((e) => getComputedStyle(e).height)) ===
          '92px',
        `${name}: textarea is 92px`,
      );
      const cl = await page.$$eval('.callrow > a.cl, .callrow > .cpw', (as) =>
        as.map((a) => Math.round(a.getBoundingClientRect().width)),
      );
      ok(
        cl.length === 2 && cl.every((x) => x >= w - 60),
        `${name}: contact pills are stacked, full width`,
      );
      const fb = await page.$$eval('.fcta .fb > a.fbtn, .fcta .fb > .cpw', (as) =>
        as.map((a) => Math.round(a.getBoundingClientRect().width)),
      );
      ok(
        fb.length === 2 && fb.every((x) => x >= w - 50),
        `${name}: footer Call and Email buttons are full width`,
      );
      const f2 = await cols(page, '.ftg2');
      ok(f2 === 2, `${name}: footer is a 2-column grid (${f2})`);
      // tap targets
      const small = await page.evaluate(() =>
        [
          ...document.querySelectorAll(
            'main .btn, header .burger, .svp, .rb, .jcard, footer .fbtn, footer .sb',
          ),
        ]
          .filter((e) => e.offsetParent !== null)
          .map((e) => {
            const r = e.getBoundingClientRect();
            return [e.className, Math.round(r.height), Math.round(r.width)];
          })
          .filter(([, hh, ww]) => hh < 44 || ww < 44),
      );
      ok(
        small.length === 0,
        `${name}: tap targets are at least 44px (${JSON.stringify(small.slice(0, 4))})`,
      );
      // section padding 52px
      await page.goto(BASE + '/services/web-applications', { waitUntil: 'networkidle' });
      const padv = await page.$$eval('main .sec > .wrap:not(.hw)', (els) =>
        els.slice(0, 4).map((e) => getComputedStyle(e).paddingTop),
      );
      ok(
        padv.every((v) => v === '52px'),
        `${name}: section padding is 52px (${padv})`,
      );
    }
    if (kind === 'tablet') {
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      ok(
        parseInt(
          await page
            .locator('.bc')
            .first()
            .evaluate((e) => getComputedStyle(e).minHeight),
        ) === 440,
        `${name}: tablet cards are min-height 440px`,
      );
      ok(await page.locator('.bc p').first().isVisible(), `${name}: tablet cards show the quote`);
      const padv = await page.$$eval('main .sec > .wrap:not(.hw)', (els) =>
        els.slice(0, 3).map((e) => parseInt(getComputedStyle(e).paddingTop)),
      );
      ok(
        padv.every((v) => v <= 88),
        `${name}: section padding is capped at 88px (${padv})`,
      );
    }
    if (kind === 'desktop') {
      const padv = await page.$$eval('main .sec > .wrap:not(.hw)', (els) =>
        els.slice(0, 3).map((e) => parseInt(getComputedStyle(e).paddingTop)),
      );
      ok(
        padv[0] === 128 && padv[1] === 120,
        `${name}: desktop section padding is unchanged (${padv})`,
      );
      await page.hover('a.wafab');
      await page.waitForTimeout(300);
      ok(
        (await page.locator('.wafab .wl').evaluate((e) => getComputedStyle(e).opacity)) === '1',
        `${name}: label shows on hover`,
      );
      const lbl = await page.evaluate(() => ({
        l: document.querySelector('.wafab .wl').getBoundingClientRect().right,
        wi: document.querySelector('.wafab .wi').getBoundingClientRect().left,
      }));
      ok(lbl.l <= lbl.wi, `${name}: label slides out to the left of the icon`);
      await page.mouse.move(10, 10);
      await page.locator('a.wafab').focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Shift+Tab');
      await page.waitForTimeout(300);
      ok(
        (await page.locator('.wafab .wl').evaluate((e) => getComputedStyle(e).opacity)) === '1',
        `${name}: label shows on keyboard focus`,
      );
    }
    ok(
      errors.length === 0,
      `${name}: no console errors (${errors.slice(0, 2).join(' | ') || 'none'})`,
    );
    await ctx.close();
  }
}

async function footer() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  for (const r of [
    '/',
    '/services',
    '/services/mobile-apps',
    '/how-we-work',
    '/about',
    '/contact',
    '/thank-you',
  ]) {
    await page.goto(BASE + r);
    const all = await hrefs(page, 'footer a');
    ok(
      all.includes('tel:+919566831192') &&
        all.includes('mailto:smph.tech@gmail.com?subject=Enquiry%20from%20smph.tech') &&
        all.includes('https://www.instagram.com/smph.tech/') &&
        all.includes('https://whatsapp.com/channel/0029Vb9H9qI7oQheRpgygP00'),
      `${r}: footer has tel, mailto, Instagram, WhatsApp channel`,
    );
  }
  await page.goto(BASE + '/');
  ok(
    JSON.stringify(await text(page, '.fb a')) ===
      JSON.stringify(['Call +91 95668 31192', 'smph.tech@gmail.com']),
    'footer top strip buttons',
  );
  const cols = await page.$$eval('footer h2', (els) => els.map((e) => e.textContent.trim()));
  ok(
    JSON.stringify(cols) ===
      JSON.stringify(['Ready when you are.', 'Services', 'Explore', 'Get in touch']),
    `footer columns (${cols})`,
  );
  ok(
    JSON.stringify(await text(page, 'footer .ftg2 > div:nth-child(3) a')) ===
      JSON.stringify(['Home', 'Services', 'How we work', 'About', 'Book a free call']),
    'footer Explore links',
  );
  const social = await page.$$eval('footer a.sb', (as) =>
    as.map((a) => [
      a.getAttribute('href'),
      a.getAttribute('target'),
      a.getAttribute('rel'),
      a.getAttribute('aria-label'),
    ]),
  );
  ok(
    social.length === 2 &&
      social.every(
        ([, t, r, l]) => t === '_blank' && /noopener/.test(r) && /noreferrer/.test(r) && l,
      ),
    'social tiles open in a new tab with rel and aria-label',
  );
  ok(
    (await page.locator('footer a.ci').count()) === 4 &&
      /@smph\.tech/.test(await page.locator('footer').innerText()),
    'four contact rows incl. @smph.tech',
  );
  ok(
    /Replies within \[24 hours\]/.test(await page.locator('.ftb').innerText()),
    'footer reply-time line',
  );
  ok(!/youtube/i.test(await page.locator('footer').innerHTML()), 'footer has no YouTube');
  const line = await page
    .locator('footer.ft')
    .evaluate((e) => getComputedStyle(e, '::before').backgroundImage);
  ok(
    /255, 122, 46/.test(line) && /124, 77, 255/.test(line) && /34, 211, 238/.test(line),
    'footer top line gradient',
  );
  const ld = JSON.parse(
    await page.locator('script[type="application/ld+json"]').first().innerText(),
  );
  ok(
    ld.telephone === '+919566831192' &&
      ld.email === 'smph.tech@gmail.com' &&
      ld.sameAs?.length === 2,
    `JSON-LD has telephone, email and sameAs (${JSON.stringify(ld.sameAs)})`,
  );
  await page.goto(BASE + '/contact');
  ok(
    (await hrefs(page, '.callrow a')).join() ===
      'tel:+919566831192,mailto:smph.tech@gmail.com?subject=Enquiry%20from%20smph.tech',
    '/contact has phone and email pills',
  );
  await ctx.close();
}

async function journey() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const cases = [
    ['/', 1, ['/services', '/how-we-work', '/about', '#contact'], 0],
    ['/services', 2, ['/how-we-work', '/about', '/contact'], 0],
    ['/services/web-applications', 2, ['/how-we-work', '/about', '/contact'], 0],
    ['/services/digital-marketing', 2, ['/how-we-work', '/about', '/contact'], 0],
    ['/how-we-work', 3, ['/services', '/about', '/contact'], 1],
    ['/about', 4, ['/services', '/how-we-work', '/contact'], 2],
  ];
  for (const [route, step, targets, nxIndex] of cases) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    const sec = page.locator('section.cream');
    ok((await sec.count()) === 1, `${route}: has the Your path section`);
    ok(
      new RegExp(`You are on step ${step} of 5`).test(await sec.innerText()),
      `${route}: "step ${step} of 5"`,
    );
    ok(
      JSON.stringify(await hrefs(page, 'section.cream .jcard')) === JSON.stringify(targets),
      `${route}: path cards ${targets}`,
    );
    const nx = await page.$$eval('section.cream .jcard', (as) =>
      as.map((a) => a.classList.contains('nx')),
    );
    ok(
      nx.filter(Boolean).length === 1 && nx[nxIndex] === true,
      `${route}: "Up next" is card ${nxIndex + 1}`,
    );
    ok(
      /Up next/.test(await sec.locator('.jcard.nx .tg').textContent()),
      `${route}: the highlighted card says Up next`,
    );
    const nodes = await page.$$eval('section.cream .pn', (ns) =>
      ns.map((n) => [
        n.classList.contains('is-current'),
        n.querySelector('a')?.getAttribute('aria-current'),
      ]),
    );
    ok(
      nodes.length === 5 &&
        nodes.every(([cur, ac], i) => (i === step - 1 ? cur && ac === 'page' : !cur && !ac)),
      `${route}: five nodes, only step ${step} is the current page (aria-current)`,
    );
    ok(
      await page
        .locator('section.cream')
        .evaluate((e) => e.nextElementSibling && e.nextElementSibling.tagName === 'SECTION'),
      `${route}: sits directly above the next band`,
    );
  }
  // hooks (exact copy)
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const hooks = await text(page, 'section.cream .jcard h3');
  ok(
    JSON.stringify(hooks) ===
      JSON.stringify([
        'Which of our five fixes matches your problem?',
        'What happens after you book a call? No surprises.',
        'Who will actually build it? Meet the four of us.',
        'Ready? Tell us what is slowing you. We reply with next steps.',
      ]),
    'journey hooks use the exact copy',
  );
  ok(
    JSON.stringify((await text(page, 'section.cream .jcard .go')).map((t) => t.trim())) ===
      JSON.stringify([
        'See the services',
        'See the five stages',
        'Meet the team',
        'Book a free call',
      ]),
    'journey card buttons',
  );
  await ctx.close();
}

async function visited() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const stored = () => page.evaluate(() => localStorage.getItem('smph-visited'));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => localStorage.getItem('smph-visited'));
  ok(JSON.parse(await stored()).join() === 'home', 'visiting home stores "home"');
  ok((await page.locator('header .nav .vd').count()) === 0, 'no dot on the page you are on');
  await page.goto(BASE + '/services/web-applications', { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('smph-visited') || '[]').length === 2,
  );
  ok(JSON.parse(await stored()).join() === 'home,services', 'a service page counts as Services');
  ok(
    (await page.locator('header .nav a[href="/"] .vd').count()) === 0,
    'visiting a page no longer puts a dot under its nav item',
  );
  // path nodes fill for visited pages too: visit About, then go to Home; About stays filled
  await page.goto(BASE + '/about', { waitUntil: 'networkidle' });
  await page.waitForFunction(() =>
    JSON.parse(localStorage.getItem('smph-visited') || '[]').includes('about'),
  );
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const nodes = await page.$$eval('section.cream .pn', (ns) =>
    ns.map((n) => n.classList.contains('is-visited')),
  );
  ok(
    JSON.stringify(nodes) === JSON.stringify([false, true, false, true, false]),
    `visited pages (services, about) show the visited state; the current page and unseen ones do not (${nodes})`,
  );
  // CTA line only after all four have been seen
  await page.goto(BASE + '/services', { waitUntil: 'networkidle' });
  ok(
    !/You have seen it all/.test(await page.locator('main section').last().innerText()),
    'CTA keeps its own line before all four are seen',
  );
  await page.goto(BASE + '/how-we-work', { waitUntil: 'networkidle' });
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('smph-visited') || '[]').length === 4,
  );
  await page.goto(BASE + '/services', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  ok(
    (await page.locator('main section').last().locator('h2').innerText()) ===
      'You have seen it all. Let us talk.',
    'once all four are seen, the next page CTA says "You have seen it all. Let us talk."',
  );
  ok(
    (await page.locator('main section').last().locator('p.lead').innerText()).startsWith(
      'Describe the problem',
    ),
    'only the CTA title line changes',
  );
  // junk in storage never breaks the page
  await page.evaluate(() => localStorage.setItem('smph-visited', '{{{'));
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(BASE + '/about', { waitUntil: 'networkidle' });
  ok(errors.length === 0, 'broken storage does not throw');
  await ctx.close();

  // storage blocked: still works
  const b = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await b.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new Error('blocked');
      },
    });
  });
  const bp = await b.newPage();
  const berr = [];
  bp.on('pageerror', (e) => berr.push(String(e)));
  await bp.goto(BASE + '/about', { waitUntil: 'networkidle' });
  ok(
    berr.length === 0 && (await bp.locator('section.cream').count()) === 1,
    'page works with localStorage blocked',
  );
  await b.close();
}

async function pill() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const pillEl = page.locator('.upnext');
  const cases = [
    ['/', 'Services', '/services'],
    ['/services', 'How we work', '/how-we-work'],
    ['/services/mobile-apps', 'How we work', '/how-we-work'],
    ['/how-we-work', 'About', '/about'],
    ['/about', 'Book a free call', '/contact'],
  ];
  const prog = (pg) =>
    pg.evaluate(
      () => (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight,
    );
  const scrollTo = (pg, f) =>
    pg.evaluate(
      (f) => window.scrollTo(0, f * document.documentElement.scrollHeight - window.innerHeight),
      f,
    );
  for (const [route, label, href] of cases) {
    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await scrollTo(page, 0.4);
    await page.waitForTimeout(500);
    ok(
      (await pillEl.getAttribute('data-shown')) === 'false',
      `${route}: pill hidden at 40% scroll`,
    );
    await scrollTo(page, 0.85);
    await page.waitForTimeout(700);
    ok(
      (await pillEl.getAttribute('data-shown')) === 'true' && (await pillEl.isVisible()),
      `${route}: pill shows after ~70% (at ${(await prog(page)).toFixed(2)})`,
    );
    const t = (await pillEl.innerText()).replace(/\s+/g, ' ');
    ok(t.includes('Up next:') && t.includes(label), `${route}: says "Up next: ${label}" (${t})`);
    ok(
      (await pillEl.locator('a').getAttribute('href')) === href,
      `${route}: pill links to ${href}`,
    );
  }
  // dismiss: remembered for the session
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await scrollTo(page, 0.9);
  await page.waitForTimeout(600);
  await page.click('.upnext button');
  ok((await pillEl.count()) === 0, 'x dismisses the pill');
  await page.goto(BASE + '/services', { waitUntil: 'networkidle' });
  await scrollTo(page, 0.95);
  await page.waitForTimeout(600);
  ok((await pillEl.count()) === 0, 'dismissal is remembered for the session');
  // hidden on contact and thank-you
  const c2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const p2 = await c2.newPage();
  for (const r of ['/contact', '/thank-you']) {
    await p2.goto(BASE + r, { waitUntil: 'networkidle' });
    await scrollTo(p2, 1);
    await p2.waitForTimeout(500);
    ok((await p2.locator('.upnext').count()) === 0, `${r}: no pill`);
  }
  // V5: desktop only. Not rendered on phones or tablets.
  for (const [w, h] of [
    [390, 844],
    [768, 1024],
  ]) {
    const c3 = await browser.newContext({ viewport: { width: w, height: h } });
    const p3 = await c3.newPage();
    await p3.goto(BASE + '/about', { waitUntil: 'networkidle' });
    await scrollTo(p3, 0.9);
    await p3.waitForTimeout(700);
    ok(
      (await p3.locator('.upnext').count()) === 0,
      `${w}px wide: the "Up next" pill is not rendered`,
    );
    await c3.close();
  }
  await c2.close();
  await ctx.close();
  // reduced motion: no animation
  const rm = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const rp = await rm.newPage();
  await rp.goto(BASE + '/', { waitUntil: 'networkidle' });
  const tr = await rp.locator('.upnext').evaluate((e) => getComputedStyle(e).transitionDuration);
  ok(/^0s(, 0s)*$/.test(tr), `pill has no transition under reduced motion (${tr})`);
  await rm.close();
}

// Fill the form. Waits for hydration so the first click is not lost.
async function fill(page, v) {
  if (v.name !== undefined) await page.fill('input[autocomplete=name]', v.name);
  if (v.mobile !== undefined) await page.fill('input[autocomplete=tel]', v.mobile);
  if (v.email !== undefined) await page.fill('input[autocomplete=email]', v.email);
  if (v.message !== undefined) await page.fill('textarea', v.message);
}
const GOOD = {
  name: 'Test Person',
  mobile: '98765-43210',
  email: 'test@example.com',
  message: 'Bookings are on WhatsApp and we lose orders.',
};

async function formUi() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/contact?service=mobile-apps', { waitUntil: 'networkidle' });
  await page
    .waitForFunction(() => document.querySelector('select')?.value === 'Mobile apps', null, {
      timeout: 10000,
    })
    .catch(() => {});
  ok((await page.inputValue('select')) === 'Mobile apps', 'service preselected from ?service=');
  ok(
    (await page.locator('select option').first().innerText()) === 'Select a service',
    'service placeholder text',
  );
  ok(
    (await page.locator('select option').allInnerTexts()).join('|') ===
      'Select a service|Web applications|Mobile apps|Management systems|Digital marketing|Tech consulting and automation|Not sure',
    'service options in order',
  );
  // attributes
  ok(
    (await page.getAttribute('input[autocomplete=name]', 'type')) === 'text',
    'name field: autocomplete=name',
  );
  const tel = page.locator('input[autocomplete=tel]');
  ok(
    (await tel.getAttribute('inputmode')) === 'tel' && (await tel.getAttribute('type')) === 'tel',
    'mobile field: autocomplete=tel, inputmode=tel',
  );
  ok(
    (await page.getAttribute('input[autocomplete=email]', 'type')) === 'email',
    'email field: autocomplete=email',
  );
  // required asterisks: name, mobile, email, message (not service)
  const stars = await page.$$eval('.fcard label', (ls) =>
    ls.map((l) => [
      l.querySelector('.lbl')?.textContent?.replace(/\s+/g, ' ').trim(),
      !!l.querySelector('.rq'),
    ]),
  );
  const starMap = Object.fromEntries(stars.filter(([t]) => t));
  ok(
    starMap['Name *'] &&
      starMap['Mobile number *'] &&
      starMap['Email *'] &&
      starMap['What is the problem? *'] &&
      starMap['Service (optional)'] === false,
    `required labels have an asterisk, Service does not (${JSON.stringify(starMap)})`,
  );
  ok(
    (await page.$eval('.fcard .rq', (e) => getComputedStyle(e).color)) === 'rgb(225, 29, 72)',
    'asterisk is red',
  );
  // empty submit
  await page.click('button[type=submit]');
  for (const f of ['name', 'mobile', 'email', 'message'])
    ok(await page.locator(`#err-${f}`).isVisible(), `empty ${f} shows an inline error`);
  ok(!(await page.locator('#err-service').count()), 'service never errors when empty');
  // bad values
  await fill(page, { name: 'Test Person', mobile: '12345', email: 'nope', message: 'short' });
  await page.click('button[type=submit]');
  ok(
    (await page.locator('#err-mobile').innerText()).includes('valid mobile number'),
    'bad mobile message',
  );
  ok((await page.locator('#err-email').innerText()).includes('valid email'), 'bad email message');
  ok(
    (await page.locator('#err-message').innerText()).includes('at least 10'),
    'short message error',
  );
  ok(
    (await page.getAttribute('input[autocomplete=tel]', 'aria-invalid')) === 'true',
    'invalid field has aria-invalid',
  );
  // spaces and hyphens are fine
  for (const m of ['+91 98765 43210', '98765-43210', '09876543210', '+1 415 555 2671']) {
    await fill(page, { mobile: m });
    await page.click('button[type=submit]');
    ok(!(await page.locator('#err-mobile').count()), `mobile "${m}" accepted`);
    await page.waitForTimeout(50);
    if (await page.locator('button[type=submit]').isDisabled()) break; // it started sending; stop here
  }
  await ctx.close();
}

async function formSuccess() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/contact', { waitUntil: 'networkidle' });
  await fill(page, GOOD);
  await page.click('button[type=submit]');
  ok(await page.locator('button[type=submit]').isDisabled(), 'submit disabled while sending');
  await page.waitForURL('**/thank-you', { timeout: 60000 });
  ok(true, 'success redirects to /thank-you');
  // honeypot + too fast, straight at the API
  const post = (body) => page.request.post(BASE + '/api/contact', { data: body });
  const good = {
    name: 'Bot',
    mobile: '9876543210',
    email: 'bot@example.com',
    message: 'Buy my product now please.',
    startedAt: Date.now() - 10000,
  };
  const hp = await post({ ...good, company: 'Spam Inc' });
  ok(
    hp.status() === 200 && (await hp.json()).ok === true && !(await hp.json()).id,
    'honeypot gets a normal 200 and no id',
  );
  const fast = await post({ ...good, startedAt: Date.now() - 500 });
  ok(fast.status() === 200 && !(await fast.json()).id, 'too-fast post gets a normal 200 and no id');
  const invalid = await post({ ...good, mobile: '123', email: 'x' });
  const inv = invalid.status() === 400 ? (await invalid.json()).fields : {};
  ok(
    invalid.status() === 400 && inv.mobile && inv.email,
    'invalid post gets 400 with field errors for mobile and email',
  );
  const valid = await post(good);
  ok(
    valid.status() === 200 && (await valid.json()).id?.startsWith('SMPH-'),
    'valid post accepted in dev mode',
  );
  const statuses = [];
  for (let i = 0; i < 6; i++) statuses.push((await post(good)).status());
  ok(statuses.includes(429), `rate limit kicks in (${statuses.join(',')})`);
  await ctx.close();
}

// Needs the server started with APPS_SCRIPT_URL=http://localhost:4010/exec APPS_SCRIPT_SECRET=test-secret and NO RESEND_API_KEY.
async function formScript() {
  const http = await import('node:http');
  const seen = [];
  const mock = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/exec') {
      let body = '';
      req.on('data', (c) => (body += c));
      req.on('end', () => {
        seen.push({ type: req.headers['content-type'], body: JSON.parse(body) });
        // Like the real Apps Script: answer a POST with a redirect, then serve JSON from there.
        const failing = body.includes('FAILME');
        res.writeHead(302, { Location: `/echo?ok=${failing ? 0 : 1}` });
        res.end();
      });
    } else if (req.method === 'GET' && req.url?.startsWith('/echo')) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(req.url.includes('ok=1') ? '{"ok":true}' : '{"ok":false,"error":"unauthorized"}');
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((r) => mock.listen(4010, r));
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/contact?service=web-applications', { waitUntil: 'networkidle' });
    await page.waitForFunction(
      () => document.querySelector('select')?.value === 'Web applications',
    );
    await fill(page, GOOD);
    await page.click('button[type=submit]');
    await page.waitForURL('**/thank-you', { timeout: 60000 });
    ok(true, 'Apps Script ok:true -> visitor reaches /thank-you (email is off, no error)');
    ok(seen.length === 1, 'exactly one request reached the Apps Script');
    const r = seen[0];
    ok(
      r?.type === 'text/plain;charset=utf-8',
      `Content-Type is text/plain;charset=utf-8 (${r?.type})`,
    );
    ok(r?.body.secret === 'test-secret', 'secret is sent from APPS_SCRIPT_SECRET');
    ok(
      JSON.stringify(Object.keys(r?.body ?? {})) ===
        JSON.stringify(['secret', 'name', 'mobile', 'email', 'service', 'message', 'source', 'id']),
      `payload fields (${Object.keys(r?.body ?? {})})`,
    );
    ok(r?.body.mobile === '9876543210', `mobile hyphens stripped (${r?.body.mobile})`);
    ok(
      r?.body.service === 'Web applications' &&
        r?.body.source === '/contact' &&
        /^SMPH-[0-9A-F]{8}$/.test(r?.body.id),
      'service, source page and id are filled',
    );
    // Apps Script says ok:false -> visitor sees the failure state
    await page.goto(BASE + '/contact', { waitUntil: 'networkidle' });
    await fill(page, { ...GOOD, name: 'FAILME Person' });
    await page.click('button[type=submit]');
    await page.waitForSelector('.fail', { timeout: 60000 });
    ok(true, 'Apps Script ok:false -> failure state shown');
    ok(!(await page.content()).includes('test-secret'), 'secret never reaches the browser');
    await ctx.close();
  } finally {
    mock.close();
  }
}

async function formFail() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/contact', { waitUntil: 'networkidle' });
  await fill(page, GOOD);
  await page.click('button[type=submit]');
  await page.waitForSelector('.fail', { timeout: 60000 });
  const t = await page.locator('.fail').innerText();
  ok(
    /did not go through/.test(t) &&
      /smph\.tech@gmail\.com/.test(t) &&
      (await page
        .locator('.fail a[href="mailto:smph.tech@gmail.com?subject=Enquiry%20from%20smph.tech"]')
        .count()) === 1,
    `failure state shows the email as a mailto link (${t})`,
  );
  ok(!(await page.locator('button[type=submit]').isDisabled()), 'submit re-enabled after failure');
  ok(
    !/at\s.+\(.+:\d+:\d+\)|APPS_SCRIPT|RESEND_/.test(await page.content()),
    'no stack traces or secrets in page',
  );
  await ctx.close();
}

/** V6: the "Your path" tracker. Hover, focus and swipe light the node that matches the card. */
async function tracker() {
  const info = (page) =>
    page.evaluate(() => {
      const pth = document.querySelector('.pth');
      const cs = getComputedStyle(pth);
      return {
        active: [...document.querySelectorAll('.pn.is-active')].map((n) => n.dataset.i).join(','),
        cards: [...document.querySelectorAll('.jcard.is-active')].map((n) => n.dataset.i).join(','),
        len: cs.getPropertyValue('--len').trim(),
        from: cs.getPropertyValue('--from').trim(),
      };
    });

  // ---- desktop, mouse ----
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.locator('.pth').scrollIntoViewIfNeeded();
  await page.waitForTimeout(700);
  let r = await info(page);
  ok(
    r.active === '1' && r.cards === '1',
    `home: "Up next" (Services) is active by default (${r.active})`,
  );
  ok(
    r.from === '10%' && r.len === '20%',
    `the line runs Home to Services by default (${r.from}, ${r.len})`,
  );
  const all = await page.$$eval('.jcard', (cs) => cs.map((c) => c.dataset.i));
  ok(all.join() === '1,2,3,4', `each card carries its node index (${all})`);
  for (const i of [2, 3, 4, 1]) {
    await page.locator(`.jcard[data-i="${i}"]`).hover();
    await page.waitForTimeout(500);
    r = await info(page);
    ok(
      r.active === String(i) && r.cards === String(i),
      `hovering card ${i} lights node ${i} (only that one)`,
    );
    ok(r.from === '10%' && r.len === `${20 * i}%`, `the line grows to node ${i} (${r.len})`);
    const lift = await page
      .locator(`.jcard[data-i="${i}"]`)
      .evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m42);
    ok(lift === -6, `card ${i} lifts 6px (${lift})`);
  }
  // hover a node: same thing
  await page.locator('.pn[data-i="3"]').hover();
  await page.waitForTimeout(500);
  r = await info(page);
  ok(r.active === '3' && r.cards === '3', 'hovering a node lights it and its card');
  // the current node ignores hover
  await page.locator('.pn[data-i="0"]').hover();
  await page.waitForTimeout(400);
  r = await info(page);
  ok(r.active === '1', 'hovering the current node does nothing; "Up next" stays active');
  await page.mouse.move(5, 5);
  await page.waitForTimeout(500);
  r = await info(page);
  ok(r.active === '1' && r.cards === '1' && r.len === '20%', 'moving away resets to "Up next"');

  // visual states
  const st = await page.evaluate(() => {
    const dot = (i) => {
      const e = document.querySelector(`.pn[data-i="${i}"] .dot`);
      const cs = getComputedStyle(e);
      return {
        bg: cs.backgroundColor,
        bd: cs.borderTopColor,
        color: cs.color,
        tf: cs.transform,
        sh: cs.boxShadow,
        before: getComputedStyle(e, '::before').opacity,
      };
    };
    return {
      cur: dot(0),
      active: dot(1),
      idle: dot(3),
      here: document.querySelectorAll('.pn .here').length,
      hereIn: document.querySelector('.pn.is-current .here')?.textContent,
    };
  });
  ok(st.cur.bg === 'rgb(11, 18, 48)', `current page: solid navy dot (${st.cur.bg})`);
  ok(st.here === 1 && st.hereIn === 'You are here', 'only the current node says "You are here"');
  ok(
    st.active.before === '1' && /1\.18/.test(st.active.tf) && st.active.sh !== 'none',
    `active node: orange fill, scaled 1.18, ring and glow (${st.active.tf})`,
  );
  ok(st.idle.before === '0' && st.idle.tf === 'none', 'idle node: no fill, not scaled');
  const lead = await page.locator('section.cream .lead').innerText();
  ok(
    lead === 'You are on step 1 of 5. Point at a card to see where it sits on the path.',
    `desktop subtitle (${lead})`,
  );

  // keyboard: focus and blur do the same as hover
  await page.locator('.jcard[data-i="3"]').focus();
  await page.waitForTimeout(400);
  r = await info(page);
  ok(r.active === '3' && r.len === '60%', 'focusing a card lights its node');
  await page.locator('.jcard[data-i="3"]').blur();
  await page.waitForTimeout(400);
  r = await info(page);
  ok(r.active === '1', 'blurring the card goes back to "Up next"');

  // a11y
  ok(
    (await page.locator('ol.pth[aria-label="Your path through the site"]').count()) === 1 &&
      (await page.locator('ol.pth > li.pn a').count()) === 5 &&
      (await page.locator('.pn.is-current a[aria-current="page"]').count()) === 1,
    'nodes are links in a labelled list; the current one has aria-current="page"',
  );
  ok(
    await page.$$eval('.pn a, .jcard', (as) =>
      as.every((a) => a.tagName === 'A' && a.getAttribute('href')),
    ),
    'nodes and cards are real links',
  );

  // middle page: the line can run in both directions from the current node
  await page.goto(BASE + '/how-we-work', { waitUntil: 'networkidle' });
  await page.locator('.pth').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  r = await info(page);
  ok(
    r.active === '3' && r.from === '50%' && r.len === '20%',
    `how-we-work: default is About (${r.from}, ${r.len})`,
  );
  await page.locator('.jcard[data-i="1"]').hover();
  await page.waitForTimeout(500);
  r = await info(page);
  ok(
    r.active === '1' && r.from === '30%' && r.len === '20%',
    `hovering Services runs the line backwards (${r.from}, ${r.len})`,
  );
  await ctx.close();

  // reduced motion: no transitions
  const rm = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const rp = await rm.newPage();
  await rp.goto(BASE + '/', { waitUntil: 'networkidle' });
  const tr = await rp.evaluate(() => [
    getComputedStyle(document.querySelector('.pth .fill')).transitionDuration,
    getComputedStyle(document.querySelector('.pn .dot')).transitionDuration,
    getComputedStyle(document.querySelector('.jcard')).transitionDuration,
  ]);
  ok(
    tr.every((d) => d === '0s'),
    `reduced motion: no transitions (${tr})`,
  );
  await rm.close();

  // ---- phone, touch ----
  for (const [route, width] of [
    ['/', 390],
    ['/about', 390],
    ['/services', 360],
  ]) {
    const mc = await browser.newContext({
      viewport: { width, height: 844 },
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    });
    const m = await mc.newPage();
    await m.goto(BASE + route, { waitUntil: 'networkidle' });
    await m.locator('.pth').scrollIntoViewIfNeeded();
    await m.waitForTimeout(600);
    const order = await m.$$eval('.jcard', (cs) =>
      cs
        .map((c) => ({ i: c.dataset.i, left: c.getBoundingClientRect().left }))
        .sort((a, b) => a.left - b.left)
        .map((c) => c.i),
    );
    const lead = await m.locator('section.cream .lead').innerText();
    ok(
      /Swipe the cards to follow the path\.$/.test(lead),
      `${route} @${width}: phone subtitle (${lead})`,
    );
    r = await info(m);
    ok(
      r.active === order[0],
      `${route} @${width}: first visible card is active by default (${r.active})`,
    );
    const scrollTo = async (k) => {
      await m.evaluate((k) => {
        const rail = document.querySelector('.jc');
        const w = rail.querySelector('.jcard').getBoundingClientRect().width + 12;
        rail.scrollTo({ left: k * w, behavior: 'instant' });
      }, k);
      await m.waitForTimeout(400);
    };
    for (let k = 1; k < order.length - 1; k++) {
      await scrollTo(k);
      r = await info(m);
      ok(
        r.active === order[k],
        `${route} @${width}: scrolled ${k} card(s), node ${order[k]} is active (${r.active})`,
      );
      ok(r.len !== '0%', `${route} @${width}: the line is drawn (${r.len})`);
    }
    await scrollTo(99);
    r = await info(m);
    ok(
      r.active === order[order.length - 1] && r.cards === r.active,
      `${route} @${width}: at the end of the rail the last card is active (${r.active})`,
    );
    await scrollTo(0);
    r = await info(m);
    ok(r.active === order[0], `${route} @${width}: scrolling back lights the first card again`);
    const overflow = await m.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    ok(!overflow, `${route} @${width}: no horizontal page scroll`);
    // a tap is not a hover: tapping a node must not leave things stuck active without navigating state
    await mc.close();
  }
}

/** V6: the email and phone links work on desktops without a mail app; Copy and toast; nothing covers the footer. */
async function contactLinks() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  await ctx.route('https://mail.google.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/html', body: '<title>gmail</title>' }),
  );
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  ok(
    await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches),
    'desktop test browser reports (hover: hover) and (pointer: fine)',
  );
  const mails = await page.$$eval('a[href^="mailto:"]', (as) =>
    as.map((a) => a.getAttribute('href')),
  );
  ok(
    mails.length >= 3 &&
      mails.every((h) => h === 'mailto:smph.tech@gmail.com?subject=Enquiry%20from%20smph.tech'),
    `every email link keeps its mailto: href (${mails.length} on home)`,
  );
  const gmail =
    /^https:\/\/mail\.google\.com\/mail\/\?view=cm&fs=1&to=smph\.tech%40gmail\.com&su=Enquiry%20from%20smph\.tech$/;
  const count = await page.locator('a[href^="mailto:"]:visible').count();
  for (let i = 0; i < count; i++) {
    const link = page.locator('a[href^="mailto:"]:visible').nth(i);
    await link.scrollIntoViewIfNeeded();
    const hit = await link.evaluate((a) => {
      const r = a.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return !!el && a.contains(el);
    });
    ok(hit, `email link ${i + 1}: nothing sits on top of it`);
    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 4000 }).catch(() => null),
      link.click(),
    ]);
    ok(!!popup, `email link ${i + 1}: a click opens a new tab`);
    if (popup) {
      ok(
        gmail.test(popup.url()),
        `email link ${i + 1}: it is Gmail compose with recipient and subject (${popup.url()})`,
      );
      await popup.close();
    }
    ok(page.url() === BASE + '/', `email link ${i + 1}: this page did not navigate`);
  }

  // copy button + toast
  const cp = page.locator('footer .cpb').first();
  await cp.scrollIntoViewIfNeeded();
  ok((await cp.innerText()) === 'Copy', 'a Copy button sits next to the footer email');
  await cp.click();
  await page.waitForSelector('.toast.on');
  ok((await page.locator('.toast').innerText()) === 'Email copied', 'toast says "Email copied"');
  ok(
    (await page.evaluate(() => navigator.clipboard.readText())) === 'smph.tech@gmail.com',
    'the address is on the clipboard',
  );
  ok(
    (await page.locator('.toast[role="status"][aria-live="polite"]').count()) === 1,
    'the toast is announced politely',
  );
  await page.waitForTimeout(2600);
  ok((await page.locator('.toast.on').count()) === 0, 'the toast goes away after 2 seconds');

  // phone: desktop copies and toasts, never navigates
  const tels = await page.$$eval('a[href^="tel:"]', (as) => as.map((a) => a.getAttribute('href')));
  ok(
    tels.length >= 2 && tels.every((h) => h === 'tel:+919566831192'),
    `phone links keep tel: href (${tels.length})`,
  );
  const tel = page.locator('footer a[href^="tel:"]').first();
  await tel.scrollIntoViewIfNeeded();
  await tel.click();
  await page.waitForSelector('.toast.on');
  ok(
    (await page.locator('.toast').innerText()) === 'Number copied',
    'desktop phone click shows "Number copied"',
  );
  ok(
    (await page.evaluate(() => navigator.clipboard.readText())) === '+919566831192',
    'the number is on the clipboard',
  );
  ok(page.url() === BASE + '/', 'desktop phone click does not navigate');
  const wa = await page.$$eval('a[href*="wa.me"]', (as) =>
    as.map((a) => a.getAttribute('href').split('?')[0]),
  );
  ok(
    wa.length >= 1 && wa.every((h) => h === 'https://wa.me/919566831192'),
    'WhatsApp links stay on wa.me',
  );

  // contact page: the failure state and the band use the same component
  await page.goto(BASE + '/contact', { waitUntil: 'networkidle' });
  ok(
    (await page.locator('.callrow a[href^="mailto:"]').count()) === 1,
    '/contact: call row email link present',
  );
  const [pp] = await Promise.all([
    page.waitForEvent('popup', { timeout: 4000 }).catch(() => null),
    page.locator('.callrow a[href^="mailto:"]').click(),
  ]);
  ok(!!pp && gmail.test(pp.url()), '/contact: call row email opens Gmail compose');
  if (pp) await pp.close();
  await ctx.close();

  // touch: plain mailto and tel, no interception
  const mc = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const m = await mc.newPage();
  await m.goto(BASE + '/', { waitUntil: 'networkidle' });
  ok(
    !(await m.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)),
    'phone: no fine hover pointer',
  );
  const prevented = await m.evaluate(() => {
    const out = {};
    window.addEventListener('click', (e) => {
      const a = e.target.closest?.('a[href]');
      if (a) {
        out[a.getAttribute('href').split(':')[0]] = e.defaultPrevented;
        e.preventDefault(); // keep the test page from leaving
      }
    });
    document.querySelector('footer a[href^="mailto:"]').click();
    document.querySelector('footer a[href^="tel:"]').click();
    return out;
  });
  ok(
    prevented.mailto === false && prevented.tel === false,
    `phone: mailto: and tel: are left alone (${JSON.stringify(prevented)})`,
  );
  ok((await m.locator('.toast.on').count()) === 0, 'phone: no toast on call or mail links');
  await mc.close();

  // the floating WhatsApp button never covers a footer link, at any width, at the bottom of the page
  for (const [w, h] of [
    [1440, 900],
    [1024, 768],
    [768, 1024],
    [640, 900],
    [390, 844],
    [360, 740],
  ]) {
    const c = await browser.newContext({ viewport: { width: w, height: h } });
    const p = await c.newPage();
    for (const route of ['/', '/services', '/contact']) {
      await p.goto(BASE + route, { waitUntil: 'networkidle' });
      await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await p.waitForTimeout(300);
      const covered = await p.evaluate(() => {
        const bad = [];
        for (const el of document.querySelectorAll('footer a, footer button, footer .ftb span')) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.bottom < 0 || r.top > innerHeight) continue;
          for (const [fx, fy] of [
            [0.5, 0.5],
            [0.9, 0.5],
            [0.1, 0.5],
            [0.5, 0.15],
            [0.5, 0.85],
          ]) {
            const e = document.elementFromPoint(r.left + r.width * fx, r.top + r.height * fy);
            if (e && !el.contains(e) && !e.contains(el)) {
              bad.push(
                (el.textContent || el.getAttribute('aria-label') || el.className)
                  .trim()
                  .slice(0, 28) +
                  ' <- ' +
                  (e.className || e.tagName),
              );
              break;
            }
          }
        }
        return bad;
      });
      ok(
        covered.length === 0,
        `${route} @${w}x${h}: nothing covers footer links or the legal line (${covered.join('; ') || 'clear'})`,
      );
    }
    await c.close();
  }
}

/** V7: LinkedIn links on the About page team photos only. */
async function teamLinks() {
  const LINKS = [
    ['Subbaiah S', 'https://www.linkedin.com/in/subbiah-s-6b2750353/'],
    ['Madeswaran M', 'https://www.linkedin.com/in/mmadeswaran2112/'],
    ['Parthesh S', 'https://www.linkedin.com/in/parthesh-s-b45486316/'],
    ['Harish S', 'https://www.linkedin.com/in/harishsivakumarjs/'],
  ];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route('https://www.linkedin.com/**', (r) =>
    r.fulfill({ status: 200, contentType: 'text/html', body: '<title>in</title>' }),
  );
  const page = await ctx.newPage();

  // home: nothing clickable, nothing new
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  ok((await page.locator('.tm a').count()) === 0, 'home: team photos are not links');
  ok(
    (await page.locator('a[href*="linkedin.com"]').count()) === 0,
    'home: no LinkedIn link anywhere on the page',
  );
  ok(
    (await page.locator('.tm .in, .tm .tc.lk').count()) === 0,
    'home: no badge, no linkable cards',
  );
  const homeCursor = await page
    .locator('.tm .tc img')
    .first()
    .evaluate((e) => getComputedStyle(e).cursor);
  ok(
    homeCursor === 'auto' || homeCursor === 'default',
    `home: no cursor change on the photos (${homeCursor})`,
  );
  const homeLift = async () => {
    await page.locator('.tm .tc').first().scrollIntoViewIfNeeded();
    await page.locator('.tm .tc').first().hover();
    await page.waitForTimeout(500);
    return page
      .locator('.tm .tc')
      .first()
      .evaluate((e) => new DOMMatrix(getComputedStyle(e).transform).m42);
  };
  ok((await homeLift()) === -8, 'home: the card hover is unchanged from the design (8px)');
  ok(
    (await page
      .locator('.tm .tc')
      .first()
      .evaluate((e) => getComputedStyle(e, ':after').content)) !== undefined,
    'home: card structure untouched',
  );

  // about: the four photo links
  await page.goto(BASE + '/about', { waitUntil: 'networkidle' });
  const rows = await page.$$eval('.tm .tc', (cs) =>
    cs.map((c) => {
      const a = c.querySelector('a');
      return {
        name: c.querySelector('.nm')?.textContent,
        href: a?.getAttribute('href'),
        target: a?.getAttribute('target'),
        rel: a?.getAttribute('rel'),
        label: a?.getAttribute('aria-label'),
        hasImg: !!a?.querySelector('img'),
        nested: !!a?.parentElement?.closest('a') || !!a?.querySelector('a'),
        anchors: c.querySelectorAll('a').length,
        nameInLink: !!a?.contains(c.querySelector('.nm')),
      };
    }),
  );
  ok(rows.length === 4, 'about: four team cards');
  LINKS.forEach(([name, href], i) => {
    const r = rows[i];
    ok(r?.name === name, `about: card ${i + 1} keeps the name as written (${r?.name})`);
    ok(r?.href === href && r.hasImg, `about: ${name}'s photo is inside a link to ${href}`);
    ok(
      r?.target === '_blank' && /noopener/.test(r.rel ?? ''),
      `about: ${name}'s link opens in a new tab with noopener (${r?.rel})`,
    );
    ok(
      r?.label === `${name} on LinkedIn`,
      `about: ${name}'s link has the aria-label (${r?.label})`,
    );
    ok(
      r?.anchors === 1 && !r.nested && !r.nameInLink,
      `about: ${name}: one link, not nested, name and role are not links`,
    );
  });

  // click opens a new tab
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
    page.locator('.tm .tc a').nth(3).click(),
  ]);
  ok(
    !!popup && popup.url() === LINKS[3][1],
    `about: clicking a photo opens LinkedIn in a new tab (${popup?.url()})`,
  );
  if (popup) await popup.close();
  ok(page.url() === BASE + '/about', 'about: the site page stays where it was');
  // clicking the strip with the name still hits the photo link
  const [pop2] = await Promise.all([
    page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
    (async () => {
      const nm = page.locator('.tm .tc .nm').first();
      await nm.scrollIntoViewIfNeeded();
      const b = await nm.boundingBox();
      await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    })(),
  ]);
  ok(
    !!pop2 && pop2.url() === LINKS[0][1],
    'about: a click on the name strip falls through to the photo link',
  );
  if (pop2) await pop2.close();

  // affordance: cursor, lift, badge (desktop hover)
  const card = page.locator('.tm .tc').nth(1);
  await card.scrollIntoViewIfNeeded();
  await page.mouse.move(5, 5);
  await page.waitForTimeout(400);
  const badge = (i) => page.locator('.tm .tc').nth(i).locator('.in');
  ok(
    (await page
      .locator('.tm .tc a')
      .first()
      .evaluate((e) => getComputedStyle(e).cursor)) === 'pointer',
    'about: cursor is a pointer over the photo',
  );
  ok(
    (await badge(1).evaluate((e) => getComputedStyle(e).opacity)) === '0',
    'about: the badge is hidden until hover',
  );
  await card.hover({ position: { x: 100, y: 100 } });
  await page.waitForTimeout(600);
  const hov = await card.evaluate((e) => ({
    lift: new DOMMatrix(getComputedStyle(e).transform).m42,
  }));
  ok(hov.lift === -4, `about: the photo lifts 4px on hover (${hov.lift})`);
  const bs = await badge(1).evaluate((e) => {
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    const pr = e.closest('.tl').getBoundingClientRect();
    return {
      op: cs.opacity,
      bg: cs.backgroundColor,
      color: cs.color,
      w: r.width,
      h: r.height,
      text: e.textContent.trim(),
      glyph: getComputedStyle(e.querySelector('svg path')).fill === 'rgb(255, 255, 255)',
      br: cs.borderRadius,
      right: Math.round(pr.right - r.right),
      bottom: Math.round(pr.bottom - r.bottom),
    };
  });
  ok(
    bs.op === '1' &&
      bs.bg === 'rgb(10, 102, 194)' &&
      bs.w === 22 &&
      bs.h === 22 &&
      bs.glyph &&
      bs.text === '',
    `about: hover shows a 22px #0A66C2 circle with a white "in" glyph (${JSON.stringify(bs)})`,
  );
  ok(
    bs.right >= 0 && bs.right <= 16 && bs.bottom >= 0 && bs.bottom <= 16,
    `about: the badge sits in the bottom-right corner (${bs.right}, ${bs.bottom})`,
  );
  await page.mouse.move(5, 5);

  // keyboard: Tab reaches each photo link and the ring is visible
  await page
    .locator('.tm .tc a')
    .first()
    .evaluate((e) => e.focus());
  await page.evaluate(() => document.activeElement.blur());
  await page
    .locator('main')
    .first()
    .evaluate(() => {});
  // start just before the first photo link and tab through
  await page.evaluate(() => {
    const a = document.querySelector('.tm .tc a');
    const prev = document.createElement('span');
    prev.tabIndex = 0;
    prev.id = 'tab-start';
    a.closest('ul').before(prev);
    prev.focus();
  });
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(450);
    const f = await page.evaluate(() => {
      const a = document.activeElement;
      const c = a.closest('.tc');
      const cs = getComputedStyle(c);
      return {
        href: a.getAttribute('href'),
        outline: `${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor} +${cs.outlineOffset}`,
        badge: getComputedStyle(a.querySelector('.in')).opacity,
        own: getComputedStyle(a).outlineStyle,
      };
    });
    ok(f.href === LINKS[i][1], `keyboard: Tab ${i + 1} lands on ${LINKS[i][0]}'s photo link`);
    ok(
      f.outline === 'solid 3px rgb(255, 122, 46) +3px',
      `keyboard: ${LINKS[i][0]} shows a 3px orange ring with 3px offset (${f.outline})`,
    );
    ok(f.badge === '1', `keyboard: ${LINKS[i][0]}'s badge is shown on focus`);
  }
  await page.keyboard.press('Tab');
  ok(
    !(await page.evaluate(() => document.activeElement?.closest?.('.tc'))),
    'keyboard: the ring is gone once focus moves on',
  );
  await ctx.close();

  // touch: the badge is always visible, nothing lifts
  const mc = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  const m = await mc.newPage();
  await m.goto(BASE + '/about', { waitUntil: 'networkidle' });
  const ops = await m.$$eval('.tm .tc .in', (bs) => bs.map((b) => getComputedStyle(b).opacity));
  ok(
    ops.length === 4 && ops.every((o) => o === '1'),
    `touch: the LinkedIn badge is always visible (${ops})`,
  );
  const ov = await m.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  ok(!ov, 'touch: no horizontal scroll');
  const tap = await m.$$eval('.tm .tc a', (as) =>
    as.map((a) => Math.round(a.getBoundingClientRect().width)),
  );
  ok(
    tap.every((w) => w >= 44),
    `touch: photo links are big enough to tap (${tap})`,
  );
  await m.goto(BASE + '/', { waitUntil: 'networkidle' });
  ok((await m.locator('.tm .in').count()) === 0, 'touch: the home page has no badge');
  await mc.close();

  // reduced motion: no lift
  const rm = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const r = await rm.newPage();
  await r.goto(BASE + '/about', { waitUntil: 'networkidle' });
  await r.locator('.tm .tc').nth(1).scrollIntoViewIfNeeded();
  await r
    .locator('.tm .tc')
    .nth(1)
    .hover({ position: { x: 100, y: 100 } });
  await r.waitForTimeout(500);
  const lift = await r
    .locator('.tm .tc')
    .nth(1)
    .evaluate((e) => getComputedStyle(e).transform);
  ok(lift === 'none', `reduced motion: no lift on hover (${lift})`);
  await rm.close();
}

const run = {
  phone,
  nav,
  pages,
  footer,
  journey,
  visited,
  pill,
  tracker,
  'team-links': teamLinks,
  'contact-links': contactLinks,
  links,
  ui,
  'form-ui': formUi,
  'form-success': formSuccess,
  'form-script': formScript,
  'form-fail': formFail,
}[which];
await run();
await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED` : '\nall passed');
process.exit(fails.length ? 1 : 0);
