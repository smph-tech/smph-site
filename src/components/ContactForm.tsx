'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowIcon } from './icons';
import {
  contactSchema,
  MIN_FILL_MS,
  SERVICE_OPTIONS,
  type ContactInput,
} from '@/lib/contact-schema';
import { content } from '@/content';
import { SERVICES } from '@/content/services';
import { SITE, isPlaceholder } from '@/content/site';

const F = content.form;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Status = 'idle' | 'sending' | 'failed';

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
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    mode: 'onTouched',
    // startedAt and page are filled in at submit time; they only need to satisfy the shared schema here.
    defaultValues: { name: '', contact: '', message: '', service: '', company: '', startedAt: 0 },
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
        body: JSON.stringify({
          ...values,
          startedAt: startedAt.current,
          page: pathname,
        }),
      });
      if (res.ok) {
        router.push('/thank-you');
        return;
      }
      if (res.status === 400) {
        const data = (await res.json().catch(() => ({}))) as { fields?: Record<string, string> };
        let shown = false;
        for (const [name, message] of Object.entries(data.fields ?? {})) {
          if (['name', 'contact', 'message', 'service'].includes(name)) {
            setError(name as 'name' | 'contact' | 'message' | 'service', { message });
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

      <label>
        <span className="lbl">{F.name.label}</span>
        <input
          type="text"
          autoComplete="name"
          placeholder={F.name.placeholder}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? 'err-name' : undefined}
          {...register('name')}
        />
        {errors.name ? (
          <span className="err" id="err-name" role="alert">
            {errors.name.message}
          </span>
        ) : null}
      </label>

      <label>
        <span className="lbl">{F.contact.label}</span>
        <input
          type="text"
          autoComplete="email"
          inputMode="email"
          placeholder={F.contact.placeholder}
          aria-invalid={errors.contact ? true : undefined}
          aria-describedby={errors.contact ? 'err-contact' : undefined}
          {...register('contact')}
        />
        {errors.contact ? (
          <span className="err" id="err-contact" role="alert">
            {errors.contact.message}
          </span>
        ) : null}
      </label>

      <label>
        <span className="lbl">{F.service.label}</span>
        <select {...register('service')}>
          <option value="">{F.service.placeholder}</option>
          {SERVICE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="lbl">{F.message.label}</span>
        <textarea
          placeholder={F.message.placeholder}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={errors.message ? 'err-message' : undefined}
          {...register('message')}
        />
        {errors.message ? (
          <span className="err" id="err-message" role="alert">
            {errors.message.message}
          </span>
        ) : null}
      </label>

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
