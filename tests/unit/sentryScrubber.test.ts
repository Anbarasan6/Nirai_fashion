import { describe, it, expect } from 'vitest';
import { scrubSentryEvent } from '../../src/services/sentry';

describe('Sentry beforeSend Privacy Scrubber', () => {
  it('strips sensitive user PII (email, phone, ip_address) while preserving user role', () => {
    const rawEvent = {
      event_id: 'evt_12345',
      release: 'nirai-ecommerce@1.0.0',
      user: {
        id: 'usr_abc999',
        email: 'customer@gmail.com',
        phone: '9876543210',
        ip_address: '49.207.180.12',
        role: 'customer',
      },
    };

    const scrubbed = scrubSentryEvent(rawEvent);

    expect(scrubbed.user.role).toBe('customer');
    expect(scrubbed.user.email).toBeUndefined();
    expect(scrubbed.user.phone).toBeUndefined();
    expect(scrubbed.user.ip_address).toBeUndefined();
    expect(scrubbed.event_id).toBe('evt_12345');
    expect(scrubbed.release).toBe('nirai-ecommerce@1.0.0');
  });

  it('completely strips request payload, headers, and cookies on sensitive payment/checkout routes', () => {
    const paymentEvent = {
      request: {
        url: 'https://nirai.in/pay/ORD-20261019-9999',
        headers: { authorization: 'Bearer secret_token', cookie: 'sb-auth-token=xyz' },
        data: { utr: '428901234567', amount: 4500 },
        cookies: { session: 'active' },
      },
    };

    const scrubbed = scrubSentryEvent(paymentEvent);

    expect(scrubbed.request.url).toBe('https://nirai.in/pay/:orderNumber');
    expect(scrubbed.request.data).toBeUndefined();
    expect(scrubbed.request.headers).toBeUndefined();
    expect(scrubbed.request.cookies).toBeUndefined();
  });

  it('scrubs email addresses and phone numbers appearing in error messages', () => {
    const errorEvent = {
      message: 'Failed to notify customer test.user@example.com at +919876543210 about payment',
    };

    const scrubbed = scrubSentryEvent(errorEvent);

    expect(scrubbed.message).not.toContain('test.user@example.com');
    expect(scrubbed.message).toContain('[REDACTED_EMAIL]');
    expect(scrubbed.message).toContain('[REDACTED_PHONE]');
  });

  it('scrubs exception message strings without damaging stack traces', () => {
    const exceptionEvent = {
      exception: {
        values: [
          {
            type: 'OrderError',
            value: 'Customer 9876543210 verification failed with token secret1234567890123456',
            stacktrace: {
              frames: [
                {
                  filename: 'OrderManager.tsx',
                  function: 'handleVerify',
                  lineno: 142,
                },
              ],
            },
          },
        ],
      },
    };

    const scrubbed = scrubSentryEvent(exceptionEvent);
    const value = scrubbed.exception.values[0].value;

    expect(value).not.toContain('test@domain.com');
    // Stack frame metadata must remain completely intact for debugging
    expect(scrubbed.exception.values[0].stacktrace.frames[0].function).toBe('handleVerify');
    expect(scrubbed.exception.values[0].stacktrace.frames[0].lineno).toBe(142);
  });
});
