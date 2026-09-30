import { subdomain, hasCookie } from './config';

// Note: COOKIE is already defined globally, so we'll use the existing value

describe('opportunity-viewer config', () => {
  describe('subdomain', () => {
    it('exports subdomain object with domain property', () => {
      expect(subdomain).toBeDefined();
      expect(typeof subdomain).toBe('object');
      expect(subdomain).toHaveProperty('domain');
    });

    it('uses COOKIE.OPP_WIDGET_DOMAIN for domain property', () => {
      expect(subdomain.domain).toBe(COOKIE.OPP_WIDGET_DOMAIN);
    });

    it('creates new object with domain property', () => {
      const expectedStructure = { domain: COOKIE.OPP_WIDGET_DOMAIN };
      expect(subdomain).toEqual(expectedStructure);
    });
  });

  describe('hasCookie', () => {
    it('exports hasCookie as string', () => {
      expect(hasCookie).toBeDefined();
      expect(typeof hasCookie).toBe('string');
    });

    it('has correct cookie name value', () => {
      expect(hasCookie).toBe('opportunity_preferences');
    });
  });

  describe('exports', () => {
    it('exports both subdomain and hasCookie', () => {
      expect(subdomain).toBeDefined();
      expect(hasCookie).toBeDefined();
    });

    it('exports correct types', () => {
      expect(typeof subdomain).toBe('object');
      expect(typeof hasCookie).toBe('string');
    });
  });

  describe('COOKIE dependency', () => {
    it('relies on global COOKIE object', () => {
      expect(global.COOKIE).toBeDefined();
      expect(global.COOKIE.OPP_WIDGET_DOMAIN).toBeDefined();
    });

    it('uses COOKIE.OPP_WIDGET_DOMAIN correctly', () => {
      const originalValue = global.COOKIE.OPP_WIDGET_DOMAIN;
      expect(subdomain.domain).toBe(originalValue);
    });
  });

  describe('object structure', () => {
    it('subdomain has only domain property', () => {
      const keys = Object.keys(subdomain);
      expect(keys).toHaveLength(1);
      expect(keys[0]).toBe('domain');
    });

    it('subdomain domain property is not null or undefined', () => {
      expect(subdomain.domain).not.toBeNull();
      expect(subdomain.domain).not.toBeUndefined();
    });
  });

  describe('immutability', () => {
    it('subdomain object should be a new object instance', () => {
      const anotherSubdomain = { domain: COOKIE.OPP_WIDGET_DOMAIN };
      expect(subdomain).toEqual(anotherSubdomain);
      expect(subdomain).not.toBe(anotherSubdomain); // Different instances
    });

    it('hasCookie should be a primitive string', () => {
      expect(typeof hasCookie).toBe('string');
      expect(hasCookie).toBe('opportunity_preferences');
    });
  });
});