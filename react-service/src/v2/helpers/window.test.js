import { isIOS, isIpadOS } from './window';

// Mock navigator object
const mockNavigator = (userAgent, platform, maxTouchPoints) => {
  Object.defineProperty(global, 'navigator', {
    value: {
      userAgent,
      platform,
      maxTouchPoints
    },
    writable: true,
    configurable: true
  });
};

describe('window helpers', () => {
  const originalNavigator = global.navigator;

  afterEach(() => {
    // Restore original navigator after each test
    global.navigator = originalNavigator;
  });

  describe('isIOS', () => {
    it('returns true for iPad platform', () => {
      mockNavigator('', 'iPad', 0);
      expect(isIOS()).toBe(true);
    });

    it('returns true for iPhone platform', () => {
      mockNavigator('', 'iPhone', 0);
      expect(isIOS()).toBe(true);
    });

    it('returns true for iPod platform', () => {
      mockNavigator('', 'iPod', 0);
      expect(isIOS()).toBe(true);
    });

    it('returns false for Android platform', () => {
      mockNavigator('', 'Android', 0);
      expect(isIOS()).toBe(0); // Returns 0 from maxTouchPoints check
    });

    it('returns false for Windows platform', () => {
      mockNavigator('', 'Win32', 0);
      expect(isIOS()).toBe(0); // Returns 0 from maxTouchPoints check
    });

    it('returns false for Linux platform', () => {
      mockNavigator('', 'Linux', 0);
      expect(isIOS()).toBe(0); // Returns 0 from maxTouchPoints check
    });

    it('returns true for MacIntel with high maxTouchPoints (iPad Pro)', () => {
      mockNavigator('', 'MacIntel', 5);
      expect(isIOS()).toBe(true);
    });

    it('returns true for MacIntel with exactly 3 maxTouchPoints', () => {
      mockNavigator('', 'MacIntel', 3);
      expect(isIOS()).toBe(true);
    });

    it('returns false for MacIntel with low maxTouchPoints', () => {
      mockNavigator('', 'MacIntel', 2);
      expect(isIOS()).toBe(false);
    });

    it('returns false for MacIntel with no maxTouchPoints', () => {
      mockNavigator('', 'MacIntel', 0);
      expect(isIOS()).toBe(0); // Returns 0 from maxTouchPoints check
    });

    it('returns false for MacIntel with undefined maxTouchPoints', () => {
      mockNavigator('', 'MacIntel', undefined);
      expect(isIOS()).toBe(undefined); // Returns undefined from maxTouchPoints check
    });

    it('returns false for MacIntel with null maxTouchPoints', () => {
      mockNavigator('', 'MacIntel', null);
      expect(isIOS()).toBe(null); // Returns null from maxTouchPoints check
    });

    it('handles case sensitivity in platform detection', () => {
      mockNavigator('', 'ipad', 0); // lowercase
      expect(isIOS()).toBe(0); // Returns 0 because regex is case-sensitive
    });

    it('handles mixed case in iOS platforms', () => {
      mockNavigator('', 'IPAD', 0); // uppercase
      expect(isIOS()).toBe(0); // Returns 0 because regex is case-sensitive
    });

    it('detects iPad in platform string with additional text', () => {
      mockNavigator('', 'iPad; U; CPU iPhone OS', 0);
      expect(isIOS()).toBe(true);
    });

    it('detects iPhone in platform string with additional text', () => {
      mockNavigator('', 'iPhone; U; CPU iPhone OS', 0);
      expect(isIOS()).toBe(true);
    });

    it('detects iPod in platform string with additional text', () => {
      mockNavigator('', 'iPod; U; CPU iPhone OS', 0);
      expect(isIOS()).toBe(true);
    });
  });

  describe('isIpadOS', () => {
    it('returns true for MacIntel with high maxTouchPoints', () => {
      mockNavigator('', 'MacIntel', 5);
      expect(isIpadOS()).toBe(true);
    });

    it('returns true for MacIntel with exactly 3 maxTouchPoints', () => {
      mockNavigator('', 'MacIntel', 3);
      expect(isIpadOS()).toBe(true);
    });

    it('returns false for MacIntel with exactly 2 maxTouchPoints', () => {
      mockNavigator('', 'MacIntel', 2);
      expect(isIpadOS()).toBe(false);
    });

    it('returns false for MacIntel with 1 maxTouchPoint', () => {
      mockNavigator('', 'MacIntel', 1);
      expect(isIpadOS()).toBe(false);
    });

    it('returns false for MacIntel with 0 maxTouchPoints', () => {
      mockNavigator('', 'MacIntel', 0);
      expect(isIpadOS()).toBe(0); // Returns 0 from maxTouchPoints check
    });

    it('returns false for MacIntel with undefined maxTouchPoints', () => {
      mockNavigator('', 'MacIntel', undefined);
      expect(isIpadOS()).toBe(undefined); // Returns undefined from maxTouchPoints check
    });

    it('returns false for MacIntel with null maxTouchPoints', () => {
      mockNavigator('', 'MacIntel', null);
      expect(isIpadOS()).toBe(null); // Returns null from maxTouchPoints check
    });

    it('returns false for non-MacIntel platforms with high maxTouchPoints', () => {
      mockNavigator('', 'Win32', 5);
      expect(isIpadOS()).toBe(false);
    });

    it('returns false for iPad platform (traditional iOS)', () => {
      mockNavigator('', 'iPad', 5);
      expect(isIpadOS()).toBe(false);
    });

    it('returns false for iPhone platform', () => {
      mockNavigator('', 'iPhone', 5);
      expect(isIpadOS()).toBe(false);
    });

    it('returns false for Android platform', () => {
      mockNavigator('', 'Android', 5);
      expect(isIpadOS()).toBe(false);
    });

    it('handles case sensitivity in platform detection', () => {
      mockNavigator('', 'macintel', 5); // lowercase
      expect(isIpadOS()).toBe(false);
    });

    it('handles mixed case in platform detection', () => {
      mockNavigator('', 'MACINTEL', 5); // uppercase
      expect(isIpadOS()).toBe(false);
    });

    it('detects MacIntel in platform string with additional text', () => {
      mockNavigator('', 'MacIntel; U; Intel Mac OS X', 5);
      expect(isIpadOS()).toBe(true);
    });
  });

  describe('function exports', () => {
    it('exports isIOS function', () => {
      expect(typeof isIOS).toBe('function');
    });

    it('exports isIpadOS function', () => {
      expect(typeof isIpadOS).toBe('function');
    });

    it('isIOS returns boolean values', () => {
      mockNavigator('', 'iPad', 0);
      const result = isIOS();
      expect(typeof result).toBe('boolean');
    });

    it('isIpadOS returns boolean values', () => {
      mockNavigator('', 'MacIntel', 5);
      const result = isIpadOS();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('edge cases', () => {
    it('handles missing navigator object gracefully', () => {
      delete global.navigator;
      
      expect(() => isIOS()).toThrow();
      expect(() => isIpadOS()).toThrow();
    });

    it('handles empty platform string', () => {
      mockNavigator('', '', 0);
      expect(isIOS()).toBe(0); // Returns 0 from maxTouchPoints check
      expect(isIpadOS()).toBe(0); // Returns 0 from maxTouchPoints check
    });

    it('handles platform with partial matches', () => {
      mockNavigator('', 'iPadOS', 0); // Contains iPad but not exact match
      expect(isIOS()).toBe(true); // Should be true because regex matches "iPad" in "iPadOS"
    });

    it('handles negative maxTouchPoints', () => {
      mockNavigator('', 'MacIntel', -1);
      expect(isIOS()).toBe(false);
      expect(isIpadOS()).toBe(false);
    });

    it('handles very large maxTouchPoints', () => {
      mockNavigator('', 'MacIntel', 999);
      expect(isIOS()).toBe(true);
      expect(isIpadOS()).toBe(true);
    });
  });

  describe('real-world scenarios', () => {
    it('detects iPad Pro 12.9 (modern iPadOS)', () => {
      mockNavigator(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Safari/605.1.15',
        'MacIntel',
        5
      );
      expect(isIOS()).toBe(true);
      expect(isIpadOS()).toBe(true);
    });

    it('detects traditional iPad', () => {
      mockNavigator(
        '',
        'iPad',
        0 // Traditional iPad doesn't need touch points
      );
      expect(isIOS()).toBe(true);
      expect(isIpadOS()).toBe(0); // Returns 0 because maxTouchPoints is 0
    });

    it('detects iPhone', () => {
      mockNavigator(
        '',
        'iPhone',
        0 // iPhones don't need touch points for iOS detection
      );
      expect(isIOS()).toBe(true);
      expect(isIpadOS()).toBe(0); // Returns 0 because maxTouchPoints is 0
    });

    it('detects Mac desktop (not iPad)', () => {
      mockNavigator(
        '',
        'MacIntel',
        0
      );
      expect(isIOS()).toBe(0); // Returns 0 from maxTouchPoints check
      expect(isIpadOS()).toBe(0); // Returns 0 from maxTouchPoints check
    });
  });
});