import { describe, it, expect } from 'vitest';
import { cldUrl, getSrcSet } from '../../src/utils/cloudinary';

describe('cldUrl Cloudinary Transformation Helper', () => {
  const sampleCldUrl = 'https://res.cloudinary.com/nirai/image/upload/v1234567890/products/kanchipuram_red.jpg';

  it('injects f_auto and q_auto by default into Cloudinary URLs', () => {
    const transformed = cldUrl(sampleCldUrl);
    expect(transformed).toBe(
      'https://res.cloudinary.com/nirai/image/upload/f_auto,q_auto/v1234567890/products/kanchipuram_red.jpg'
    );
  });

  it('adds width, height, and cropping parameters correctly', () => {
    const transformed = cldUrl(sampleCldUrl, { w: 600, h: 800, crop: 'fill' });
    expect(transformed).toContain('w_600');
    expect(transformed).toContain('h_800');
    expect(transformed).toContain('c_fill');
  });

  it('defaults to c_fill when both width and height are provided without crop', () => {
    const transformed = cldUrl(sampleCldUrl, { w: 400, h: 400 });
    expect(transformed).toContain('c_fill');
  });

  it('adds gravity when specified', () => {
    const transformed = cldUrl(sampleCldUrl, { w: 300, gravity: 'face' });
    expect(transformed).toContain('g_face');
  });

  it('handles null, undefined, or empty inputs gracefully', () => {
    expect(cldUrl(null)).toBe('');
    expect(cldUrl(undefined)).toBe('');
    expect(cldUrl('')).toBe('');
  });

  it('leaves non-Cloudinary, non-Unsplash URLs untouched', () => {
    const localUrl = '/assets/banner.jpg';
    expect(cldUrl(localUrl)).toBe('/assets/banner.jpg');
    const externalUrl = 'https://example.com/image.png';
    expect(cldUrl(externalUrl)).toBe('https://example.com/image.png');
  });

  it('correctly adapts Unsplash URLs with query parameters', () => {
    const unsplashUrl = 'https://images.unsplash.com/photo-12345?w=500';
    const transformed = cldUrl(unsplashUrl, { w: 800, h: 600, crop: 'fill' });
    expect(transformed).toContain('https://images.unsplash.com/photo-12345?');
    expect(transformed).toContain('w=800');
    expect(transformed).toContain('h=600');
  });

  it('generates responsive srcSet entries', () => {
    const srcSet = getSrcSet(sampleCldUrl, [360, 720]);
    expect(srcSet).toContain('360w');
    expect(srcSet).toContain('720w');
  });
});
