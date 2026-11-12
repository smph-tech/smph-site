// End-to-end checks with Playwright. Usage: BASE=http://localhost:3100 node scripts/e2e.mjs [links|ui|pages|footer|journey|visited|pill|nav|form-ui|form-success|form-script|form-fail]
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
  ok((await page.locator('header .hdin > .brand').getAttribute('href')) === '/', 'logo links to /');
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

  // mobile menu + sticky bar
  const m = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await m.newPage();
  await mp.goto(BASE + '/services', { waitUntil: 'networkidle' });
  ok(await mp.locator('.burger').isVisible(), 'burger visible at 390px');
  ok(!(await mp.locator('.nav').isVisible()), 'desktop nav hidden at 390px');
  await mp.click('.burger');
  const dlg = mp.locator('dialog.mm');
  ok(await dlg.isVisible(), 'mobile menu opens');
  const box = await dlg.boundingBox();
  ok(
    box && box.width >= 389 && box.height >= 843,
    `mobile menu is full screen (${box?.width}x${box?.height})`,
  );
  const mitems = (await text(mp, 'dialog.mm .mm-nav a')).map((t) => t.trim());
  ok(
    JSON.stringify(mitems) === JSON.stringify(['Home', 'Services', 'How we work', 'About']),
    `menu items, Home first (${mitems})`,
  );
  ok(
    (await mp.locator('dialog.mm a[href="tel:+919566831192"]').count()) === 1,
    'menu has the phone number',
  );
  ok(
    (await mp.locator('dialog.mm .btn', { hasText: 'Book a free call' }).count()) === 1,
    'menu has Book a free call',
  );
  await mp.keyboard.press('Escape');
  ok(!(await dlg.isVisible()), 'Esc closes the mobile menu');
  await mp.click('.burger');
  await mp.click('dialog.mm a[href="/how-we-work"]');
  await mp.waitForURL('**/how-we-work');
  await mp.waitForTimeout(400);
  ok(!(await dlg.isVisible()), 'mobile menu closes after navigating');
  await mp.click('.burger');
  await mp.evaluate(() => document.querySelector('dialog.mm a[href="/about"]').click());
  await mp.waitForURL('**/about');
  await mp.waitForTimeout(400);
  ok(!(await dlg.isVisible()), 'mobile menu closes on route change');
  const bar = mp.locator('.sbar');
  ok(await bar.isVisible(), 'sticky bar visible on phones');
  ok(
    (await mp.locator('.sbar .sb-call').getAttribute('href')) === 'tel:+919566831192',
    'sticky Call is tel:+919566831192',
  );
  ok(
    (await mp.locator('.sbar .sb-book').innerText()).trim() === 'Book a free call' &&
      (await mp.locator('.sbar .sb-book').getAttribute('href')) === '/contact',
    'sticky Book a free call goes to /contact',
  );
  const pos = await bar.evaluate((e) => getComputedStyle(e).position);
  ok(pos === 'fixed', 'sticky bar is fixed at the bottom');
  // never covers content: scroll to the bottom, the last footer text must sit above the bar
  await mp.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await mp.waitForTimeout(300);
  const covered = await mp.evaluate(() => {
    const r = document.querySelector('.ftb').getBoundingClientRect();
    const b = document.querySelector('.sbar').getBoundingClientRect();
    return r.bottom > b.top + 1;
  });
  ok(!covered, 'sticky bar does not cover the footer bottom line');
  await mp.goto(BASE + '/contact', { waitUntil: 'networkidle' });
  ok((await mp.locator('.sbar').count()) === 0, 'sticky bar hidden on /contact');
  const overflow = await mp.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  ok(!overflow, 'no horizontal scroll at 390px');
  await m.close();
  const d = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dp = await d.newPage();
  await dp.goto(BASE + '/about');
  ok(!(await dp.locator('.sbar').isVisible()), 'sticky bar hidden on desktop');
  await d.close();
}

async function ui() {
  await nav();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  // Regression: class names built with template literals once lost their spaces ("bcw3", "btnsm").
  await page.goto(BASE + '/');
  const count = (sel) => page.locator(sel).count();
  ok((await count('.bc')) === 5 && (await count('.bc.w3')) === 2, 'home: 5 bento cards, 2 wide');
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
    (await hrefs(page, '.callrow a')).join() === 'tel:+919566831192,mailto:smph.tech@gmail.com',
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
        all.includes('mailto:smph.tech@gmail.com') &&
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
    (await hrefs(page, '.callrow a')).join() === 'tel:+919566831192,mailto:smph.tech@gmail.com',
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
      ns.map((n) => [n.classList.contains('dn'), n.classList.contains('cur')]),
    );
    ok(
      nodes[step - 1][1] === true && nodes.slice(0, step).every((n) => n[0]),
      `${route}: nodes up to step ${step} are filled, the current one is ringed`,
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
    (await page.locator('header .nav a[href="/"] .vd').count()) === 1,
    'a small orange dot appears under the visited Home item',
  );
  ok(
    (await page.locator('header .nav a[href="/how-we-work"] .vd').count()) === 0,
    'no dot under pages not yet visited',
  );
  const dot = await page
    .locator('header .nav .vd')
    .first()
    .evaluate((e) => getComputedStyle(e).backgroundColor);
  ok(dot === 'rgb(255, 122, 46)', `the dot is logo orange (${dot})`);
  // path nodes fill for visited pages too: visit About, then go to Home; About stays filled
  await page.goto(BASE + '/about', { waitUntil: 'networkidle' });
  await page.waitForFunction(() =>
    JSON.parse(localStorage.getItem('smph-visited') || '[]').includes('about'),
  );
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(300);
  const nodes = await page.$$eval('section.cream .pn', (ns) =>
    ns.map((n) => n.classList.contains('dn')),
  );
  ok(
    JSON.stringify(nodes) === JSON.stringify([true, true, false, true, false]),
    `visited pages fill their path nodes (${nodes})`,
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
  // sits above the mobile bar
  const c3 = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const p3 = await c3.newPage();
  await p3.goto(BASE + '/about', { waitUntil: 'networkidle' });
  await scrollTo(p3, 0.8);
  await p3.waitForTimeout(700);
  const geo = await p3.evaluate(() => ({
    pill: document.querySelector('.upnext').getBoundingClientRect().bottom,
    bar: document.querySelector('.sbar').getBoundingClientRect().top,
  }));
  ok(
    geo.pill <= geo.bar - 4,
    `pill sits above the mobile bar (${Math.round(geo.pill)} <= ${Math.round(geo.bar)})`,
  );
  await c3.close();
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
      (await page.locator('.fail a[href="mailto:smph.tech@gmail.com"]').count()) === 1,
    `failure state shows the email as a mailto link (${t})`,
  );
  ok(!(await page.locator('button[type=submit]').isDisabled()), 'submit re-enabled after failure');
  ok(
    !/at\s.+\(.+:\d+:\d+\)|APPS_SCRIPT|RESEND_/.test(await page.content()),
    'no stack traces or secrets in page',
  );
  await ctx.close();
}

const run = {
  nav,
  pages,
  footer,
  journey,
  visited,
  pill,
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
