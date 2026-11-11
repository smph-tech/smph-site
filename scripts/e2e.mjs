// End-to-end checks with Playwright. Usage: BASE=http://localhost:3100 node scripts/e2e.mjs [links|ui|form-ui|form-success|form-script|form-fail]
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
  // Regression: class names built with template literals once lost their spaces ("bcw3", "btnsm").
  await page.goto(BASE + '/');
  const count = (sel) => page.locator(sel).count();
  ok((await count('.bc')) === 5 && (await count('.bc.w3')) === 2, 'home: 5 bento cards, 2 wide');
  ok((await count('.nav .btn.sm')) === 1, 'header Book button is the small variant');
  ok((await count('.btn.ghost')) >= 2, 'ghost buttons render');
  await page.goto(BASE + '/about');
  ok((await count('.btn.dk')) === 1, 'about: dark social button renders');
  ok((await count('.btn:not(.dk)')) >= 2, 'about: primary buttons render');
  ok(
    !(await page.evaluate(() =>
      /\b(bcw3|btnsm|btndk|fcw|btnghost)\b/.test(document.body.innerHTML),
    )),
    'no merged class names in about HTML',
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
    (await page.locator('select option').first().innerText()) === 'Select a service (optional)',
    'service placeholder text',
  );
  ok(
    (await page.locator('select option').allInnerTexts()).join('|') ===
      'Select a service (optional)|Web applications|Mobile apps|Management systems|Digital marketing|Tech consulting and automation|Not sure',
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
      !!l.querySelector('.req'),
    ]),
  );
  const starMap = Object.fromEntries(stars.filter(([t]) => t));
  ok(
    starMap['Name *'] &&
      starMap['Mobile number *'] &&
      starMap['Email *'] &&
      starMap['What is the problem? *'] &&
      starMap['Service'] === false,
    `required labels have an asterisk, Service does not (${JSON.stringify(starMap)})`,
  );
  ok(
    (await page.$eval('.fcard .req', (e) => getComputedStyle(e).color)) === 'rgb(200, 32, 60)',
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
    /did not go through/.test(t) && /\[EMAIL\]/.test(t),
    `failure state shows fallback email text (${t})`,
  );
  ok(!(await page.locator('button[type=submit]').isDisabled()), 'submit re-enabled after failure');
  ok(
    !/at\s.+\(.+:\d+:\d+\)|APPS_SCRIPT|RESEND_/.test(await page.content()),
    'no stack traces or secrets in page',
  );
  await ctx.close();
}

const run = {
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
