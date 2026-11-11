import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import type { MailConfig } from './env';

export type Mail = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

/** Sends one message through the configured transport. Throws on failure. */
export async function sendMail(cfg: MailConfig, mail: Mail): Promise<void> {
  if (cfg.transport === 'smtp' && cfg.smtp) {
    const transporter = nodemailer.createTransport({
      host: cfg.smtp.host,
      port: cfg.smtp.port,
      secure: cfg.smtp.port === 465,
      auth: { user: cfg.smtp.user, pass: cfg.smtp.pass },
    });
    await transporter.sendMail({ from: cfg.from, ...mail });
    return;
  }
  const resend = new Resend(cfg.resendKey);
  const { error } = await resend.emails.send({
    from: cfg.from,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
    replyTo: mail.replyTo,
  });
  if (error) throw new Error(`Resend: ${error.name}: ${error.message}`);
}
