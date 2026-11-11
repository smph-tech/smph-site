import { z } from 'zod';

/** Same labels as the service names in content.json (a test keeps them in step). */
export const SERVICE_OPTIONS = [
  'Web applications',
  'Mobile apps',
  'Management systems',
  'Digital marketing',
  'Tech consulting and automation',
  'Not sure',
] as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** 7 to 15 digits, optional leading +, spaces and common separators allowed. */
export function isPhone(value: string): boolean {
  const v = value.trim();
  if (!/^\+?[\d\s().-]+$/.test(v)) return false;
  const digits = v.replace(/\D/g, '').length;
  return digits >= 7 && digits <= 15;
}

export const isEmail = (value: string): boolean => EMAIL.test(value.trim());

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Please enter your name (at least 2 characters).')
    .max(80, 'Please keep your name under 80 characters.'),
  contact: z
    .string()
    .trim()
    .min(1, 'Please tell us how to reach you.')
    .max(120, 'That is too long for an email or phone number.')
    .refine((v) => isEmail(v) || isPhone(v), {
      message: 'Enter a valid email address or phone number.',
    }),
  message: z
    .string()
    .trim()
    .min(10, 'Please write at least 10 characters so we understand the problem.')
    .max(2000, 'Please keep your message under 2000 characters.'),
  service: z.union([z.enum(SERVICE_OPTIONS), z.literal('')]).optional(),
  /** Honeypot. Real visitors never see or fill it. */
  company: z.string().max(200).optional(),
  /** Epoch ms when the form was shown. Used to reject instant bot posts. */
  startedAt: z.number().int().nonnegative(),
  /** Path of the page the form was on. */
  page: z.string().max(200).optional(),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactData = z.output<typeof contactSchema>;

export const MIN_FILL_MS = 3000;
