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

/** People type spaces and hyphens in phone numbers. Drop them before checking. */
export const normalizeMobile = (value: string): string => value.trim().replace(/[\s-]/g, '');

// India: 10 digits starting 6 to 9, optionally preceded by +91, 91 or 0.
const INDIAN_MOBILE = /^(?:\+91|91|0)?[6-9]\d{9}$/;
// Anywhere else: + followed by 8 to 15 digits.
const INTERNATIONAL_MOBILE = /^\+\d{8,15}$/;

/** Accepts the raw field value (spaces and hyphens allowed). */
export function isValidMobile(value: string): boolean {
  const v = normalizeMobile(value);
  return INDIAN_MOBILE.test(v) || INTERNATIONAL_MOBILE.test(v);
}

export const isEmail = (value: string): boolean => EMAIL.test(value.trim());

export const MOBILE_ERROR =
  'Enter a valid mobile number: 10 digits starting 6 to 9 (+91 is optional), or an international number starting with + and 8 to 15 digits.';

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Please enter your name (at least 2 characters).')
    .max(80, 'Please keep your name under 80 characters.'),
  /** Spaces and hyphens are removed, so the value that reaches the server is clean. */
  mobile: z
    .string()
    .trim()
    .min(1, 'Please enter your mobile number.')
    .transform(normalizeMobile)
    .refine(isValidMobile, { message: MOBILE_ERROR }),
  email: z
    .string()
    .trim()
    .min(1, 'Please enter your email address.')
    .max(120, 'That email address is too long.')
    .refine(isEmail, { message: 'Enter a valid email address, like name@example.com.' }),
  service: z.union([z.enum(SERVICE_OPTIONS), z.literal('')]).optional(),
  message: z
    .string()
    .trim()
    .min(10, 'Please write at least 10 characters so we understand the problem.')
    .max(2000, 'Please keep your message under 2000 characters.'),
  /** Honeypot. Real visitors never see or fill it. */
  company: z.string().max(200).optional(),
  /** Epoch ms when the form was shown. Used to reject instant bot posts. */
  startedAt: z.number().int().nonnegative(),
  /** Path of the page the form was on. */
  page: z.string().max(200).optional(),
});

/** What the form holds while the visitor types. */
export type ContactInput = z.input<typeof contactSchema>;
/** What the server receives after validation (mobile already cleaned). */
export type ContactData = z.output<typeof contactSchema>;

export const MIN_FILL_MS = 3000;
