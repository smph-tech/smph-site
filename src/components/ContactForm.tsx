'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowIcon } from './icons';
import {
  contactSchema,
  MIN_FILL_MS,
  SERVICE_OPTIONS,
  type ContactData,
  type ContactInput,
} from '@/lib/contact-schema';
import { content } from '@/content';
import { SERVICES } from '@/content/services';
import { SITE, isPlaceholder } from '@/content/site';

const F = content.form;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Status = 'idle' | 'sending' | 'failed';
type FieldName = 'name' | 'mobile' | 'email' | 'service' | 'message';
const FIELDS: readonly FieldName[] = ['name', 'mobile', 'email', 'service', 'message'];

/** Label with a red asterisk when required, "(optional)" when not, the control, and its inline error. */
function Field({
  id,
  label,
  required,
  optional,
  error,
  children,
}: {
  id: FieldName;
  label: string;
  required?: boolean;
  optional?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={`f-${id}`}>
      <span className="lbl">
        {label}
        {required ? (
          <b className="rq" aria-hidden="true">
            {' '}
            *
          </b>
        ) : null}
        {optional ? <b className="opt"> {optional}</b> : null}
      </span>
      {children}
      {error ? (
        <span className="err" id={`err-${id}`} role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function ContactForm() {
  const router = useRouter();
  const pathname = usePathname();
  const startedAt = useRef(Date.now());
  const [status, setStatus] = useState<Status>('idle');

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<ContactInput, unknown, ContactData>({
    resolver: zodResolver(contactSchema),
    mode: 'onTouched',
    // startedAt and page are filled in at submit time; they only need to satisfy the shared schema here.
    defaultValues: {
      name: '',
      mobile: '',
      email: '',
      message: '',
      service: '',
      company: '',
      startedAt: 0,
    },
  });

  // Preselect the service when the form is opened from a service page (?service=slug).
  useEffect(() => {
    startedAt.current = Date.now();
    const slug = new URLSearchParams(window.location.search).get('service');
    const match = SERVICES.find((s) => s.slug === slug);
    if (match) setValue('service', match.name as (typeof SERVICE_OPTIONS)[number]);
  }, [setValue]);

  const onSubmit = handleSubmit(async (values) => {
    setStatus('sending');
    // The server drops posts made within 3 seconds of the page opening.
    // A real visitor with autofill could be that quick, so wait it out.
    await sleep(Math.max(0, MIN_FILL_MS + 250 - (Date.now() - startedAt.current)));
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, startedAt: startedAt.current, page: pathname }),
      });
      if (res.ok) {
        router.push('/thank-you');
        return;
      }
      if (res.status === 400) {
        const data = (await res.json().catch(() => ({}))) as { fields?: Record<string, string> };
        let shown = false;
        for (const [name, message] of Object.entries(data.fields ?? {})) {
          if ((FIELDS as readonly string[]).includes(name)) {
            setError(name as FieldName, { message });
            shown = true;
          }
        }
        if (shown) {
          setStatus('idle');
          return;
        }
      }
      setStatus('failed');
    } catch {
      setStatus('failed');
    }
  });

  const sending = status === 'sending';
  const hasEmail = !isPlaceholder(SITE.email);
  const err = (n: FieldName) => errors[n]?.message as string | undefined;
  const a11y = (n: FieldName) => ({
    'aria-invalid': errors[n] ? (true as const) : undefined,
    'aria-describedby': errors[n] ? `err-${n}` : undefined,
  });

  return (
    <form className="fcard" onSubmit={onSubmit} noValidate aria-busy={sending}>
      {status === 'failed' ? (
        <p className="fail" role="alert">
          {F.failure}{' '}
          {hasEmail ? (
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          ) : (
            <span data-placeholder="">{SITE.email}</span>
          )}
          .
        </p>
      ) : null}

      <Field id="name" label={F.name.label} required error={err('name')}>
        <input
          id="f-name"
          type="text"
          autoComplete="name"
          placeholder={F.name.placeholder}
          aria-required="true"
          {...a11y('name')}
          {...register('name')}
        />
      </Field>

      <Field id="mobile" label={F.mobile.label} required error={err('mobile')}>
        <input
          id="f-mobile"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={F.mobile.placeholder}
          aria-required="true"
          {...a11y('mobile')}
          {...register('mobile')}
        />
      </Field>

      <Field id="email" label={F.email.label} required error={err('email')}>
        <input
          id="f-email"
          type="email"
          autoComplete="email"
          placeholder={F.email.placeholder}
          aria-required="true"
          {...a11y('email')}
          {...register('email')}
        />
      </Field>

      <Field
        id="service"
        label={F.service.label}
        optional={F.service.optional}
        error={err('service')}
      >
        <select id="f-service" {...a11y('service')} {...register('service')}>
          <option value="">{F.service.placeholder}</option>
          {SERVICE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </Field>

      <Field id="message" label={F.message.label} required error={err('message')}>
        <textarea
          id="f-message"
          placeholder={F.message.placeholder}
          aria-required="true"
          {...a11y('message')}
          {...register('message')}
        />
      </Field>

      {/* Honeypot: hidden from people and from assistive tech. */}
      <div className="hp" aria-hidden="true">
        <label>
          Company
          <input type="text" tabIndex={-1} autoComplete="off" {...register('company')} />
        </label>
      </div>

      <button className="btn" type="submit" style={{ width: '100%' }} disabled={sending}>
        {sending ? (
          <>
            <span className="spin" aria-hidden="true" /> {F.sending}
          </>
        ) : (
          <>
            {F.submit} <ArrowIcon />
          </>
        )}
      </button>
    </form>
  );
}
