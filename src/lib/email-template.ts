import { formatIST } from './sheet-row';

export const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Header values must not contain line breaks (header injection). */
export const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();

export type OwnerEmailInput = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  service?: string;
  message: string;
  page?: string;
  receivedAt: Date;
  sheetUrl?: string;
};

export function ownerEmail(i: OwnerEmailInput) {
  const service = i.service || 'General';
  const when = `${formatIST(i.receivedAt)} IST`;
  const subject = `New enquiry: ${oneLine(i.name)} (${service})`;

  const text = [
    `New enquiry from the SMPH.Tech website`,
    ``,
    `Name: ${i.name}`,
    `Mobile: ${i.mobile}`,
    `Email: ${i.email}`,
    `Service: ${service}`,
    `Source page: ${i.page || '-'}`,
    `Received: ${when}`,
    `ID: ${i.id}`,
    ``,
    `Message:`,
    i.message,
    ...(i.sheetUrl ? [``, `Open the sheet: ${i.sheetUrl}`] : []),
  ].join('\n');

  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#56628C;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:6px 0;color:#0B1230">${v}</td></tr>`;
  const html = `<!doctype html><html><body style="margin:0;background:#EDF1FF;font-family:Arial,Helvetica,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px">
<div style="background:#fff;border-radius:16px;padding:28px;border:1px solid #D6DDF5">
<h1 style="margin:0 0 4px;font-size:20px;color:#0B1230">New enquiry</h1>
<p style="margin:0 0 20px;color:#56628C;font-size:14px">From the SMPH.Tech website</p>
<table style="border-collapse:collapse;font-size:15px">
${row('Name', escapeHtml(i.name))}
${row('Mobile', escapeHtml(i.mobile))}
${row('Email', escapeHtml(i.email))}
${row('Service', escapeHtml(service))}
${row('Source page', escapeHtml(i.page || '-'))}
${row('Received', escapeHtml(when))}
${row('ID', escapeHtml(i.id))}
</table>
<p style="margin:22px 0 6px;color:#56628C;font-size:14px">Message</p>
<div style="background:#F6F8FF;border-radius:12px;padding:16px;color:#0B1230;font-size:15px;line-height:1.55;white-space:pre-wrap">${escapeHtml(i.message)}</div>
${i.sheetUrl ? `<p style="margin:24px 0 0"><a href="${escapeHtml(i.sheetUrl)}" style="display:inline-block;background:#4F7BFF;color:#fff;text-decoration:none;font-weight:700;padding:12px 20px;border-radius:12px">Open the Google Sheet</a></p>` : ''}
</div></div></body></html>`;

  return { subject, text, html };
}

export function autoReplyEmail(name: string, replyTime: string | null) {
  const first = oneLine(name).split(' ')[0] || 'there';
  const when = replyTime ? `within ${replyTime}` : 'as soon as we can';
  const subject = 'We have your message';
  const text = `Hi ${first},\n\nThanks for getting in touch. We have your message and will reply ${when}.\n\nSMPH.Tech`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#0B1230;line-height:1.55"><p>Hi ${escapeHtml(first)},</p><p>Thanks for getting in touch. We have your message and will reply ${escapeHtml(when)}.</p><p>SMPH.Tech</p></div>`;
  return { subject, text, html };
}
