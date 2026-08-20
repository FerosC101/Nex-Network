import { useEffect, useId, useRef } from 'react';
import { env } from '@/config/env';

/**
 * Cloudflare Turnstile.
 *
 * Chosen over reCAPTCHA because it is free at any volume, needs no Google
 * account, and is usually invisible — most students will never see a puzzle,
 * which matters when the alternative is taxing every honest person to stop
 * spam that may never arrive.
 *
 * The token this produces is worthless on its own. It is verified server-side
 * by the `register` Edge Function; the widget only obtains it.
 */
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
      reset: (id: string) => void;
    };
    onTurnstileLoad?: () => void;
  }
}

const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

interface CaptchaProps {
  onToken: (token: string | null) => void;
}

export function Captcha({ onToken }: CaptchaProps) {
  const host = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const instanceId = useId();

  useEffect(() => {
    if (!env.isCaptchaEnabled) return;
    let cancelled = false;

    function render() {
      if (cancelled || !host.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(host.current, {
        sitekey: env.turnstileSiteKey,
        theme: 'dark',
        // An expired token would fail verification server-side and look like a
        // mysterious error, so clear it and let the widget re-issue.
        callback: (token: string) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      });
    }

    if (window.turnstile) {
      render();
    } else if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = render;
      document.head.appendChild(script);
    } else {
      document.getElementById(SCRIPT_ID)?.addEventListener('load', render);
    }

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          // Widget already gone; nothing to clean up.
        }
        widgetId.current = null;
      }
    };
  }, [onToken, instanceId]);

  if (!env.isCaptchaEnabled) return null;

  return (
    <div className="flex flex-col gap-2">
      <div ref={host} />
      <p className="text-xs text-ink-4">
        Protected by Cloudflare Turnstile — no puzzle in most cases.
      </p>
    </div>
  );
}
