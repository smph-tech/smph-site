import { describe, expect, it } from 'vitest';
import { contactSchema, isEmail, isPhone, SERVICE_OPTIONS } from '@/lib/contact-schema';
import { content } from '@/content';

const base = {
  name: 'Asha Rao',
  contact: 'asha@example.com',
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
  it('trims values', () => {
    const r = contactSchema.parse({ ...base, name: '  Asha Rao  ' });
    expect(r.name).toBe('Asha Rao');
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
  it('requires a contact that is an email or a phone number', () => {
    expect(errs({ ...base, contact: '' }).contact).toBeDefined();
    expect(errs({ ...base, contact: 'not an email' }).contact).toBeDefined();
    expect(errs({ ...base, contact: '12345' }).contact).toBeDefined();
    expect(errs({ ...base, contact: '+91 98765 43210' }).contact).toBeUndefined();
    expect(errs({ ...base, contact: 'a@b.co' }).contact).toBeUndefined();
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
  });
});

describe('isPhone / isEmail', () => {
  it.each(['1234567', '+911234567890', '+91 98765 43210', '(044) 2345 6789', '123456789012345'])(
    'phone ok: %s',
    (v) => expect(isPhone(v)).toBe(true),
  );
  it.each(['123456', '1234567890123456', 'abc1234567', '++9112345678', '', '12-ab-3456789'])(
    'phone bad: %s',
    (v) => expect(isPhone(v)).toBe(false),
  );
  it.each(['a@b.co', 'first.last+tag@sub.example.com'])('email ok: %s', (v) =>
    expect(isEmail(v)).toBe(true),
  );
  it.each(['a@b', '@b.co', 'a b@c.co', 'plain'])('email bad: %s', (v) =>
    expect(isEmail(v)).toBe(false),
  );
});
