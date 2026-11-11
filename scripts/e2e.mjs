// End-to-end checks with Playwright. Usage: BASE=http://localhost:3100 node scripts/e2e.mjs [links|ui|form-success|form-fail]
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

async function ui() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/about');
  const menu = page.locator('#services-menu');
  ok(!(await menu.isVisible()), 'dropdown closed by default');
  await page.hover('.dd > a');
  ok(await menu.isVisible(), 'dropdown opens on hover');
  await page.mouse.move(700, 600);
  ok(!(await menu.isVisible()), 'dropdown closes when mouse leaves');
  await page.goto(BASE + '/about', { waitUntil: 'networkidle' }); // wait for hydration
  await page.keyboard.press('Tab'); // skip link
  await page.keyboard.press('Tab'); // logo
  await page.keyboard.press('Tab'); // services trigger
  ok(
    await page.evaluate(() => document.activeElement?.textContent?.includes('Services')),
    'keyboard focus reaches Services',
  );
  ok(await menu.isVisible(), 'dropdown opens on keyboard focus');
  await page.keyboard.press('Tab');
  ok(
    await page.evaluate(() => document.activeElement?.closest('#services-menu') !== null),
    'Tab moves into the dropdown links',
  );
  await page.keyboard.press('Escape');
  ok(!(await menu.isVisible()), 'Escape closes dropdown');
  ok(
    await page.evaluate(() => document.activeElement?.textContent?.includes('Services')),
    'Escape returns focus to the trigger',
  );
  // click through each dropdown link
  for (const slug of [
    'web-applications',
    'mobile-apps',
    'management-systems',
    'digital-marketing',
    'tech-consulting-automation',
  ]) {
    await page.goto(BASE + '/about');
    await page.hover('.dd > a');
    await page.click(`#services-menu a[href="/services/${slug}"]`);
    await page.waitForURL(`**/services/${slug}`);
    ok(true, `dropdown link opens /services/${slug}`);
  }
  await ctx.close();

  const m = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await m.newPage();
  await mp.goto(BASE + '/');
  ok(await mp.locator('.burger').isVisible(), 'burger visible at 390px');
  ok(!(await mp.locator('.nav').isVisible()), 'desktop nav hidden at 390px');
  ok(!(await mp.locator('.chip').first().isVisible()), 'hero chips hidden at 390px');
  await mp.click('.burger');
  ok(await mp.locator('dialog.mm').isVisible(), 'mobile menu opens');
  await mp.keyboard.press('Escape');
  ok(!(await mp.locator('dialog.mm').isVisible()), 'Escape closes mobile menu');
  await mp.click('.burger');
  await mp.click('dialog.mm a[href="/how-we-work"]');
  await mp.waitForURL('**/how-we-work');
  await mp.waitForTimeout(500);
  ok(!(await mp.locator('dialog.mm').isVisible()), 'mobile menu closes after navigating');
  const overflow = await mp.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  ok(!overflow, 'no horizontal scroll at 390px');
  await m.close();
}

async function formSuccess() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/contact?service=mobile-apps');
  await page
    .waitForFunction(() => document.querySelector('select')?.value === 'Mobile apps', null, {
      timeout: 10000,
    })
    .catch(() => {});
  ok((await page.inputValue('select')) === 'Mobile apps', 'service preselected from ?service=');
  await page.click('button[type=submit]');
  ok(await page.locator('#err-name').isVisible(), 'empty name shows inline error');
  ok(await page.locator('#err-contact').isVisible(), 'empty contact shows inline error');
  ok(await page.locator('#err-message').isVisible(), 'empty message shows inline error');
  await page.fill('input[autocomplete=name]', 'Test Person');
  await page.fill('input[inputmode=email]', 'nope');
  await page.fill('textarea', 'short');
  await page.click('button[type=submit]');
  ok(
    (await page.locator('#err-contact').innerText()).includes('valid email'),
    'bad contact message',
  );
  ok(
    (await page.locator('#err-message').innerText()).includes('at least 10'),
    'short message error',
  );
  await page.fill('input[inputmode=email]', '+91 98765 43210');
  await page.fill('textarea', 'Bookings are on WhatsApp and we lose orders.');
  await page.click('button[type=submit]');
  ok(await page.locator('button[type=submit]').isDisabled(), 'submit disabled while sending');
  await page.waitForURL('**/thank-you', { timeout: 60000 });
  ok(true, 'success redirects to /thank-you');
  // honeypot + too fast, straight at the API
  const post = (body) => page.request.post(BASE + '/api/contact', { data: body });
  const good = {
    name: 'Bot',
    contact: 'bot@example.com',
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
  const invalid = await post({ ...good, contact: 'x' });
  ok(
    invalid.status() === 400 && (await invalid.json()).fields?.contact,
    'invalid post gets 400 with field errors',
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

async function formFail() {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/contact');
  await page.fill('input[autocomplete=name]', 'Test Person');
  await page.fill('input[inputmode=email]', 'test@example.com');
  await page.fill('textarea', 'Bookings are on WhatsApp and we lose orders.');
  await page.click('button[type=submit]');
  await page.waitForSelector('.fail', { timeout: 60000 });
  const t = await page.locator('.fail').innerText();
  ok(
    /did not go through/.test(t) && /\[EMAIL\]/.test(t),
    `failure state shows fallback email text (${t})`,
  );
  ok(!(await page.locator('button[type=submit]').isDisabled()), 'submit re-enabled after failure');
  ok(
    !/at\s.+\(.+:\d+:\d+\)|GOOGLE_|RESEND_/.test(await page.content()),
    'no stack traces or secrets in page',
  );
  await ctx.close();
}

const run = { links, ui, 'form-success': formSuccess, 'form-fail': formFail }[which];
await run();
await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED` : '\nall passed');
process.exit(fails.length ? 1 : 0);
