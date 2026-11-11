import { describe, expect, it } from 'vitest';
import {
  contactSchema,
  isEmail,
  isValidMobile,
  normalizeMobile,
  SERVICE_OPTIONS,
} from '@/lib/contact-schema';
import { content } from '@/content';

const base = {
  name: 'Asha Rao',
  mobile: '98765 43210',
  email: 'asha@example.com',
  message: 'Our bookings are all on WhatsApp and it is a mess.',
  startedAt: 1,
};
const errs = (input: unknown) => {
  const r = contactSchema.safeParse(input);
  return r.success
    ? {}
    : Object.fromEntries(r.error.issues.map((i) => [String(i.path[0]), i.message]));
};

describe('contactSchema', () => {
  it('accepts a valid enquiry', () => {
    expect(contactSchema.safeParse(base).success).toBe(true);
  });
  it('trims text and strips spaces and hyphens from the mobile number', () => {
    const r = contactSchema.parse({ ...base, name: '  Asha Rao  ', mobile: ' +91 98765-43210 ' });
    expect(r.name).toBe('Asha Rao');
    expect(r.mobile).toBe('+919876543210');
  });
  it('requires a name of 2 to 80 characters', () => {
    expect(errs({ ...base, name: 'A' }).name).toBeDefined();
    expect(errs({ ...base, name: 'A'.repeat(81) }).name).toBeDefined();
    expect(errs({ ...base, name: 'Al' }).name).toBeUndefined();
    expect(errs({ ...base, name: 'A'.repeat(80) }).name).toBeUndefined();
  });
  it('requires a message of 10 to 2000 characters', () => {
    expect(errs({ ...base, message: 'too short' }).message).toBeDefined();
    expect(errs({ ...base, message: 'x'.repeat(2001) }).message).toBeDefined();
    expect(errs({ ...base, message: 'x'.repeat(10) }).message).toBeUndefined();
    expect(errs({ ...base, message: 'x'.repeat(2000) }).message).toBeUndefined();
  });
  it('requires all of name, mobile, email and message', () => {
    const e = errs({ startedAt: 1, name: '', mobile: '', email: '', message: '' });
    expect(Object.keys(e).sort()).toEqual(['email', 'message', 'mobile', 'name']);
  });
  it('requires a valid email address', () => {
    expect(errs({ ...base, email: '' }).email).toBeDefined();
    expect(errs({ ...base, email: 'not an email' }).email).toBeDefined();
    expect(errs({ ...base, email: '9876543210' }).email).toBeDefined();
    expect(errs({ ...base, email: 'a@b.co' }).email).toBeUndefined();
  });
  it('rejects an invalid mobile number with a helpful message', () => {
    expect(errs({ ...base, mobile: '12345' }).mobile).toMatch(/valid mobile number/);
    expect(errs({ ...base, mobile: 'asha@example.com' }).mobile).toBeDefined();
  });
  it('accepts only known services (or none)', () => {
    expect(errs({ ...base, service: 'Web applications' }).service).toBeUndefined();
    expect(errs({ ...base, service: '' }).service).toBeUndefined();
    expect(errs({ ...base, service: undefined }).service).toBeUndefined();
    expect(errs({ ...base, service: 'Time travel' }).service).toBeDefined();
  });
  it('needs a numeric startedAt', () => {
    expect(errs({ ...base, startedAt: 'now' }).startedAt).toBeDefined();
  });
  it('keeps the form options in step with content.json service names', () => {
    expect(SERVICE_OPTIONS.slice(0, 5)).toEqual(content.services.map((s) => s.name));
    expect(SERVICE_OPTIONS.at(-1)).toBe('Not sure');
    expect(content.form.service.options).toEqual([...SERVICE_OPTIONS]);
    expect(content.form.service.placeholder).toBe('Select a service (optional)');
  });
});

describe('mobile numbers', () => {
  it('strips spaces and hyphens only', () => {
    expect(normalizeMobile(' +91 98765-43210 ')).toBe('+919876543210');
    expect(normalizeMobile('98765 - 43210')).toBe('9876543210');
  });

  it.each([
    // Indian: 10 digits starting 6 to 9
    '9876543210',
    '6000000000',
    '7999999999',
    '8123456789',
    // with +91, 91 or 0 in front
    '+919876543210',
    '919876543210',
    '09876543210',
    // spaces and hyphens while typing
    '98765 43210',
    '98765-43210',
    '+91 98765 43210',
    '+91-98765-43210',
    '0 98765 43210',
    // international: + then 8 to 15 digits
    '+14155552671',
    '+447911123456',
    '+12345678',
    '+123456789012345',
    '+971 50 123 4567',
    '+9198765432', // not Indian (only 8 digits after 91), but a valid international number
  ])('valid: %s', (v) => expect(isValidMobile(v)).toBe(true));

  it.each([
    ['5876543210', 'starts with 5'],
    ['0876543210', 'starts with 0 and is only 10 digits'],
    ['987654321', '9 digits'],
    ['98765432100', '11 digits, no prefix'],
    ['+1234567', 'international with 7 digits'],
    ['+1234567890123456', 'international with 16 digits'],
    ['14155552671', 'international digits without +'],
    ['++919876543210', 'double plus'],
    ['+91 98765 4321a', 'letter'],
    ['(98765) 43210', 'brackets are not allowed'],
    ['98765.43210', 'dots are not allowed'],
    ['', 'empty'],
    ['abc', 'text'],
    ['5 98765 43210', 'bad first digit once spaces are stripped'],
  ])('invalid: %s (%s)', (v) => expect(isValidMobile(v)).toBe(false));
});

describe('isEmail', () => {
  it.each(['a@b.co', 'first.last+tag@sub.example.com'])('ok: %s', (v) =>
    expect(isEmail(v)).toBe(true),
  );
  it.each(['a@b', '@b.co', 'a b@c.co', 'plain', ''])('bad: %s', (v) =>
    expect(isEmail(v)).toBe(false),
  );
});
