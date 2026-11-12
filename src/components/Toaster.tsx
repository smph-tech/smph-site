'use client';

import { useEffect, useRef, useState } from 'react';
import { TOAST_EVENT } from '@/lib/toast';

/** One page-wide toast, announced politely to screen readers. Shows for 2 seconds. */
export function Toaster() {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const onToast = (e: Event) => {
      setMessage((e as CustomEvent<string>).detail);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(''), 2000);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className={message ? 'toast on' : 'toast'} role="status" aria-live="polite">
      {message}
    </div>
  );
}
