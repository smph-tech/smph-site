/**
 * smph.tech enquiries: Google Apps Script web app.
 *
 * Paste this whole file into the Apps Script editor of the Google Sheet (Extensions > Apps Script),
 * set the Script Property SECRET, then Deploy > New deployment > Web app
 * (Execute as: Me, Who has access: Anyone). See README.md for the step-by-step guide.
 *
 * The website POSTs JSON as text/plain:
 *   { secret, name, mobile, email, service, message, source, id }
 * and this script answers JSON: { ok: true } or { ok: false, error: "..." }.
 */

var TAB = 'Enquiries';
var HEADERS = [
  'Received (IST)',
  'Name',
  'Mobile',
  'Email',
  'Service',
  'Message',
  'Source page',
  'Status',
  'ID',
];

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    var secret = PropertiesService.getScriptProperties().getProperty('SECRET');
    if (!secret || body.secret !== secret) return reply_({ ok: false, error: 'unauthorized' });

    var name = clean_(body.name),
      mobile = String(body.mobile || '').trim();
    var email = clean_(body.email),
      message = clean_(body.message);
    if (!name || !mobile || !email || !message)
      return reply_({ ok: false, error: 'missing fields' });

    // Two people submitting at the same moment must not write to the same row.
    lock.waitLock(20000);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(TAB) || ss.insertSheet(TAB);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    var received = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd HH:mm');
    var row = [
      received,
      name,
      mobile,
      email,
      clean_(body.service) || 'Not specified',
      message,
      clean_(body.source),
      'New',
      clean_(body.id),
    ];

    // Plain-text format first: a cell that is text can never be evaluated as a formula,
    // and a number like +919876543210 keeps its + and is not turned into a number.
    var target = sheet.getRange(sheet.getLastRow() + 1, 1, 1, row.length);
    target.setNumberFormat('@');
    target.setValues([row]);

    return reply_({ ok: true });
  } catch (err) {
    return reply_({
      ok: false,
      error: String(err && err.message ? err.message : err).slice(0, 200),
    });
  } finally {
    try {
      lock.releaseLock();
    } catch (ignore) {}
  }
}

// Opening the /exec URL in a browser shows this, which is a quick way to check the deployment.
function doGet() {
  return reply_({ ok: true, service: 'smph-enquiries' });
}

/** Second line of defence against formula injection. The site already prefixes with a quote. */
function clean_(v) {
  var s = String(v === undefined || v === null ? '' : v).trim();
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
