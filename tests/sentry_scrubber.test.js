// Sentry beforeSend PII Scrubbing and Stacktrace Preservation Test
import test from 'node:test';
import assert from 'node:assert/strict';
import { scrubSentryEvent, sanitizeString, sanitizeUrl } from '../src/services/sentry.ts';

test('1. Sentry scrubber preserves long function names and stacktrace frames', () => {
  const rawEvent = {
    event_id: 'a1b2c3d4e5f67890123456789abcdef0',
    release: 'nirai-ecommerce@1.0.0',
    transaction: '/pay/NIRAI-2026-00982?phone=9876543210',
    request: {
      url: 'https://nirai.in/pay/NIRAI-2026-00982?token=secret123',
      data: { amount: 4500 },
      cookies: 'session=xyz',
      headers: { authorization: 'Bearer 123' },
    },
    message: 'Order submission failed for customer anbarasan@example.com with phone 9876543210 and UTR 429182736451',
    exception: {
      values: [
        {
          type: 'PaymentVerificationError',
          value: 'Customer priya.s@gmail.com failed with ref: HDFC99887766 on route /pay/NIRAI-2026-00431',
          stacktrace: {
            frames: [
              {
                filename: 'src/components/storefront/PaymentPage.tsx',
                function: 'processKanchipuramPureZariSilkOrder',
                lineno: 142,
                colno: 12,
              },
              {
                filename: 'src/services/orderAuditService.ts',
                function: 'dispatchAuditLogEntryWithValidation',
                lineno: 88,
                colno: 5,
              },
            ],
          },
        },
      ],
    },
    breadcrumbs: [
      {
        category: 'xhr',
        message: 'POST to /functions/v1/verify-payment with txn_id: AXIS12345678 and mobile +91 9123456789',
        data: {
          customerEmail: 'kavitha@chennai.in',
          orderId: 'NIRAI-2026-00777',
        },
      },
    ],
    extra: {
      userNote: 'Customer phone is 8765432109, bank ref: ICIC00012345',
      helperMethod: 'calculateSilkMarginForCheckout',
    },
    user: {
      id: 'usr_abc123',
      email: 'sensitive-user@domain.com',
      phone: '9876543210',
      username: 'anbarasan',
      ip_address: '192.168.1.1',
      role: 'customer',
    },
  };

  const scrubbed = scrubSentryEvent(rawEvent);

  // 1. PROVE: Stack frames and function names survive completely intact
  const frame0 = scrubbed.exception.values[0].stacktrace.frames[0];
  const frame1 = scrubbed.exception.values[0].stacktrace.frames[1];
  assert.equal(frame0.function, 'processKanchipuramPureZariSilkOrder');
  assert.equal(frame0.filename, 'src/components/storefront/PaymentPage.tsx');
  assert.equal(frame1.function, 'dispatchAuditLogEntryWithValidation');
  assert.equal(frame1.filename, 'src/services/orderAuditService.ts');
  assert.equal(scrubbed.extra.helperMethod, 'calculateSilkMarginForCheckout');

  // 2. PROVE: Release and event_id survive
  assert.equal(scrubbed.event_id, 'a1b2c3d4e5f67890123456789abcdef0');
  assert.equal(scrubbed.release, 'nirai-ecommerce@1.0.0');

  // 3. PROVE: Email addresses are redacted
  assert.ok(!scrubbed.message.includes('anbarasan@example.com'));
  assert.ok(scrubbed.message.includes('[REDACTED_EMAIL]'));
  assert.ok(!scrubbed.exception.values[0].value.includes('priya.s@gmail.com'));
  assert.ok(scrubbed.exception.values[0].value.includes('[REDACTED_EMAIL]'));
  assert.ok(!scrubbed.breadcrumbs[0].data.customerEmail.includes('kavitha@chennai.in'));
  assert.ok(scrubbed.breadcrumbs[0].data.customerEmail.includes('[REDACTED_EMAIL]'));
  assert.equal(scrubbed.user.email, undefined);

  // 4. PROVE: Phone numbers are redacted
  assert.ok(!scrubbed.message.includes('9876543210'));
  assert.ok(scrubbed.message.includes('[REDACTED_PHONE]'));
  assert.ok(!scrubbed.breadcrumbs[0].message.includes('9123456789'));
  assert.ok(scrubbed.breadcrumbs[0].message.includes('[REDACTED_PHONE]'));
  assert.ok(!scrubbed.extra.userNote.includes('8765432109'));
  assert.ok(scrubbed.extra.userNote.includes('[REDACTED_PHONE]'));
  assert.equal(scrubbed.user.phone, undefined);

  // 5. PROVE: 12-digit UPI references and keyword-prefixed references are redacted
  assert.ok(!scrubbed.message.includes('429182736451'));
  assert.ok(scrubbed.message.includes('[REDACTED_UTR]'));
  assert.ok(!scrubbed.exception.values[0].value.includes('HDFC99887766'));
  assert.ok(scrubbed.exception.values[0].value.includes('[REDACTED_REF]'));
  assert.ok(!scrubbed.breadcrumbs[0].message.includes('AXIS12345678'));
  assert.ok(scrubbed.breadcrumbs[0].message.includes('[REDACTED_REF]'));
  assert.ok(!scrubbed.extra.userNote.includes('ICIC00012345'));
  assert.ok(scrubbed.extra.userNote.includes('[REDACTED_REF]'));

  // 6. PROVE: URLs and transactions are parameterized and query strings scrubbed
  assert.equal(scrubbed.transaction, '/pay/:orderNumber?phone=[REDACTED]');
  assert.equal(scrubbed.request.url, 'https://nirai.in/pay/:orderNumber?token=[REDACTED]');
  assert.equal(scrubbed.request.data, undefined);
  assert.equal(scrubbed.request.cookies, undefined);
  assert.equal(scrubbed.request.headers, undefined);

  // 7. PROVE: User identifier fields are stripped
  assert.equal(scrubbed.user.username, undefined);
  assert.equal(scrubbed.user.ip_address, undefined);
  assert.equal(scrubbed.user.role, 'customer');
});

test('2. Narrow UTR pattern does NOT touch regular 12-letter English words or identifiers', () => {
  const normalText = 'We need to authenticate and processOrder for checkoutPage';
  const result = sanitizeString(normalText);
  // 'authenticate' is 12 letters, 'processOrder' is 12 letters, 'checkoutPage' is 12 letters
  assert.equal(result, normalText);
});
