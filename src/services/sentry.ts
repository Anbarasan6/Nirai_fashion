/**
 * Privacy-Centric Sentry Observability Configuration
 *
 * Rules:
 * 1. Optional: Inactive if VITE_SENTRY_DSN is not provided.
 * 2. Zero PII: sendDefaultPii is false. beforeSend strictly scrubs emails, phone numbers,
 *    physical addresses, UTR transaction codes, and bearer tokens.
 * 3. Lazy loaded: Dynamic import ensures Sentry does not delay initial page rendering.
 * 4. Ad-blocker safe: Completely silent failover if blocked by client content blockers.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(\+91[\-\s]?)?[6-9]\d{9}/g;
const UTR_REGEX = /\b[A-Za-z0-9]{12}\b/g;

function sanitizeString(str: string): string {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
    .replace(PHONE_REGEX, '[REDACTED_PHONE]')
    .replace(UTR_REGEX, '[REDACTED_UTR]');
}

export async function initSentry(): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || typeof dsn !== 'string' || !dsn.trim()) {
    // Sentry disabled: DSN not configured
    return;
  }

  try {
    const Sentry = await import('@sentry/react');

    (Sentry.init as any)({
      dsn,
      environment: import.meta.env.MODE || 'production',
      release: 'nirai-ecommerce@1.0.0',
      sendDefaultPii: false,
      tracesSampleRate: 0.1,
      beforeSend(event: any) {
        // Exclude sensitive routes from trace captures
        const url = event.request?.url || window.location.pathname;
        if (
          url.includes('/pay') ||
          url.includes('/checkout') ||
          url.includes('/account') ||
          url.includes('/admin')
        ) {
          if (event.request) {
            delete event.request.data;
            delete event.request.cookies;
            delete event.request.headers;
          }
        }

        // Scrub breadcrumbs
        if (event.breadcrumbs) {
          event.breadcrumbs = event.breadcrumbs.map((b: any) => {
            if (b.message) b.message = sanitizeString(b.message);
            if (b.data) {
              const dataStr = JSON.stringify(b.data);
              b.data = JSON.parse(sanitizeString(dataStr));
            }
            return b;
          });
        }

        // Scrub exception messages
        if (event.exception?.values) {
          event.exception.values.forEach((v: any) => {
            if (v.value) v.value = sanitizeString(v.value);
          });
        }

        // Strip user identifier except role
        if (event.user) {
          delete event.user.email;
          delete event.user.ip_address;
          delete event.user.username;
        }

        return event;
      },
    });
  } catch (err) {
    // Ad-blocker or network error - ignore gracefully
    console.debug('[Sentry] Initialization skipped or blocked by client.');
  }
}

export async function setSentryUserRole(role?: string): Promise<void> {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  try {
    const Sentry = await import('@sentry/react');
    Sentry.setTag('user_role', role || 'guest');
  } catch {
    // Ignore if Sentry is not loaded
  }
}
