/**
 * Privacy-Centric Sentry Observability Configuration
 *
 * Rules:
 * 1. Optional: Inactive if VITE_SENTRY_DSN is not provided.
 * 2. Zero PII: sendDefaultPii is false. beforeSend strictly scrubs emails, phone numbers,
 *    order identifiers, UTR transaction codes, and sensitive URLs.
 * 3. Never touch stack frames, function names, filenames, release, or event_id.
 * 4. Lazy loaded: Dynamic import ensures Sentry does not delay initial page rendering.
 * 5. Ad-blocker safe: Completely silent failover if blocked by client content blockers.
 */

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /\b(?:\+?91[\s-]?)?[6-9]\d{9}\b/g;
const UPI_12DIGIT_REGEX = /\b\d{12}\b/g;
const UTR_KEYWORD_REGEX = /\b(utr|ref|reference|txn(?:_id)?)([\s:=_-]+)([A-Za-z0-9]{6,32})\b/gi;
const ORDER_ID_REGEX = /\b(?:NIRAI|ORD)-[A-Za-z0-9-]+\b/gi;

export function sanitizeUrl(urlStr: string): string {
  if (!urlStr || typeof urlStr !== 'string') return urlStr;
  return urlStr
    .replace(/\/pay\/[A-Za-z0-9_-]+/g, '/pay/:orderNumber')
    .replace(/\/tracking\/[A-Za-z0-9_-]+/g, '/tracking/:orderNumber')
    .replace(/\/product\/[A-Za-z0-9_-]+/g, '/product/:slug')
    .replace(/([?&](?:phone|mobile|email|utr|ref|reference|txn|token|order|orderNumber)=)[^&\s#]+/gi, '$1[REDACTED]');
}

export function sanitizeString(str: string): string {
  if (!str || typeof str !== 'string') return str;
  return str
    .replace(EMAIL_REGEX, '[REDACTED_EMAIL]')
    .replace(PHONE_REGEX, '[REDACTED_PHONE]')
    .replace(UPI_12DIGIT_REGEX, '[REDACTED_UTR]')
    .replace(UTR_KEYWORD_REGEX, '$1$2[REDACTED_REF]')
    .replace(ORDER_ID_REGEX, '[REDACTED_ORDER]');
}

function deepScrub(val: any, visited = new WeakSet()): any {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') {
    return sanitizeString(sanitizeUrl(val));
  }
  if (typeof val !== 'object') return val;
  if (visited.has(val)) return val;
  visited.add(val);

  if (Array.isArray(val)) {
    return val.map(item => deepScrub(item, visited));
  }

  const copy: Record<string, any> = {};
  for (const [k, v] of Object.entries(val)) {
    // NEVER touch stack traces, frame structures, filenames, or function names
    if (['stacktrace', 'frames', 'filename', 'function', 'release', 'event_id'].includes(k)) {
      copy[k] = v;
    } else {
      copy[k] = deepScrub(v, visited);
    }
  }
  return copy;
}

export function scrubSentryEvent(event: any): any {
  if (!event || typeof event !== 'object') return event;

  // Parameterize transaction name
  if (typeof event.transaction === 'string') {
    event.transaction = sanitizeUrl(event.transaction);
  }

  // Scrub Request URL and sensitive headers/body on sensitive routes
  if (event.request) {
    if (typeof event.request.url === 'string') {
      event.request.url = sanitizeUrl(event.request.url);
    }
    const url = event.request.url || '';
    if (
      url.includes('/pay') ||
      url.includes('/checkout') ||
      url.includes('/account') ||
      url.includes('/admin')
    ) {
      delete event.request.data;
      delete event.request.cookies;
      delete event.request.headers;
    }
  }

  // Apply PII patterns ONLY to event.message
  if (typeof event.message === 'string') {
    event.message = sanitizeString(sanitizeUrl(event.message));
  }

  // Scrub exception values (message text ONLY - NEVER stack frames or functions)
  if (event.exception?.values && Array.isArray(event.exception.values)) {
    event.exception.values.forEach((v: any) => {
      if (typeof v.value === 'string') {
        v.value = sanitizeString(sanitizeUrl(v.value));
      }
      // Stacktrace frames, frame.function, and frame.filename are preserved intact
    });
  }

  // Scrub breadcrumbs
  if (Array.isArray(event.breadcrumbs)) {
    event.breadcrumbs = event.breadcrumbs.map((b: any) => {
      if (typeof b.message === 'string') {
        b.message = sanitizeString(sanitizeUrl(b.message));
      }
      if (b.data && typeof b.data === 'object') {
        b.data = deepScrub(b.data);
      }
      return b;
    });
  }

  // Scrub extra and contexts
  if (event.extra && typeof event.extra === 'object') {
    event.extra = deepScrub(event.extra);
  }
  if (event.contexts && typeof event.contexts === 'object') {
    event.contexts = deepScrub(event.contexts);
  }

  // Strip user identifier except role
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
    delete event.user.phone;
  }

  // release and event_id remain untouched
  return event;
}

export async function initSentry(): Promise<void> {
  const dsn =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SENTRY_DSN) ||
    (typeof process !== 'undefined' && process.env && process.env.VITE_SENTRY_DSN);

  if (!dsn || typeof dsn !== 'string' || !dsn.trim()) {
    // Sentry disabled: DSN not configured
    return;
  }

  try {
    const Sentry = await import('@sentry/react');

    (Sentry.init as any)({
      dsn,
      environment:
        (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.MODE) ||
        (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) ||
        'production',
      release: 'nirai-ecommerce@1.0.0',
      sendDefaultPii: false,
      tracesSampleRate: 0.1,
      beforeSend: scrubSentryEvent,
    });
  } catch {
    // Ad-blocker or network error - fail silently without polluting console
  }
}

export async function setSentryUserRole(role?: string): Promise<void> {
  const dsn =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SENTRY_DSN) ||
    (typeof process !== 'undefined' && process.env && process.env.VITE_SENTRY_DSN);
  if (!dsn) return;

  try {
    const Sentry = await import('@sentry/react');
    Sentry.setTag('user_role', role || 'guest');
  } catch {
    // Ignore if Sentry is not loaded
  }
}
