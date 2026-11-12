'use client';
import { useEffect, useState } from 'react';

/**
 * Screen reader announcer for dynamic content updates.
 * Usage: import { announce } from '@/components/AccessibilityAnnouncer'
 * then call announce('Message') to notify screen readers.
 */
let announceFn: ((msg: string, priority?: 'polite' | 'assertive') => void) | null = null;

export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  if (announceFn) announceFn(message, priority);
}

export function AccessibilityAnnouncer() {
  const [politeMsg, setPoliteMsg] = useState('');
  const [assertiveMsg, setAssertiveMsg] = useState('');

  useEffect(() => {
    announceFn = (msg, priority = 'polite') => {
      if (priority === 'assertive') {
        setAssertiveMsg('');
        setTimeout(() => setAssertiveMsg(msg), 50);
      } else {
        setPoliteMsg('');
        setTimeout(() => setPoliteMsg(msg), 50);
      }
    };
    return () => { announceFn = null; };
  }, []);

  return (
    <>
      <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
        {politeMsg}
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only" role="alert">
        {assertiveMsg}
      </div>
    </>
  );
}
