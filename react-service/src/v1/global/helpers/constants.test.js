import { TA_SLUG, isTenderAddendumSlug } from './constants';

describe('isTenderAddendumSlug', () => {
  test('returns true for the exact standard slug', () => {
    expect(isTenderAddendumSlug(TA_SLUG)).toBe(true);
  });

  test('returns true for the McLaren slug (mclaren_tender_addendum)', () => {
    expect(isTenderAddendumSlug('mclaren_tender_addendum')).toBe(true);
  });

  test('returns false for a non-addendum slug', () => {
    expect(isTenderAddendumSlug('enquiry_letter')).toBe(false);
  });

  test('returns false for an empty string', () => {
    expect(isTenderAddendumSlug('')).toBe(false);
  });

  test('returns false for null', () => {
    expect(isTenderAddendumSlug(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isTenderAddendumSlug(undefined)).toBe(false);
  });
});
