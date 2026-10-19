import { describe, it, expect } from 'vitest';
import {
  isBotUserAgent,
  escapeHtml,
  renderCrawlerPageHtml,
} from '../../src/utils/seoBotHelper';

describe('Edge Middleware Bot Detection & HTML Escaping', () => {
  describe('isBotUserAgent', () => {
    it('detects all specified social crawlers and search engine bots', () => {
      const bots = [
        'WhatsApp/2.21.11.17 i',
        'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Twitterbot/1.0',
        'LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)',
        'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)',
        'TelegramBot (like TwitterBot)',
        'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
      ];

      for (const ua of bots) {
        expect(isBotUserAgent(ua)).toBe(true);
      }
    });

    it('returns false for standard human desktop and mobile browsers', () => {
      const humans = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
        'Mozilla/5.0 (Android 14; Mobile; rv:120.0) Gecko/120.0 Firefox/120.0',
      ];

      for (const ua of humans) {
        expect(isBotUserAgent(ua)).toBe(false);
      }
    });

    it('returns false for null, undefined, or empty user agents', () => {
      expect(isBotUserAgent(null)).toBe(false);
      expect(isBotUserAgent(undefined)).toBe(false);
      expect(isBotUserAgent('')).toBe(false);
    });
  });

  describe('escapeHtml', () => {
    it('properly escapes all dangerous HTML characters', () => {
      expect(escapeHtml('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;'
      );
      expect(escapeHtml("Silk & Cotton 'Bridal'")).toBe(
        'Silk &amp; Cotton &#39;Bridal&#39;'
      );
    });

    it('handles null, undefined, and numeric values safely', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml(1500)).toBe('1500');
    });
  });

  describe('renderCrawlerPageHtml', () => {
    it('generates well-formed crawler HTML with escaped tags', () => {
      const html = renderCrawlerPageHtml({
        title: 'Kanchipuram Saree & Silk "Exclusive"',
        description: 'Authentic 100% pure silk <special> weave',
        canonicalUrl: 'https://nirai.in/product/kanchipuram',
        imageUrl: 'https://nirai.in/image.jpg',
        type: 'product',
        jsonLd: { '@type': 'Product', name: 'Kanchipuram' },
      });

      expect(html).toContain('<!doctype html>');
      expect(html).toContain('&amp; Silk &quot;Exclusive&quot;');
      expect(html).toContain('&lt;special&gt;');
      expect(html).toContain('<script type="application/ld+json">{"@type":"Product","name":"Kanchipuram"}</script>');
    });
  });
});
