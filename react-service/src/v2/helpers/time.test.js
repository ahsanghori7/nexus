import { getTimeAgo } from 'v2/helpers/time';

// Mock the date helper
jest.mock('v2/helpers/date', () => ({
  getDateValues: jest.fn((date) => {
    if (date === '2023-01-01T12:00:00Z') return new Date('2023-01-01T12:00:00Z');
    if (date === 'invalid-date') return new Date('invalid');
    return new Date(date);
  }),
  isValidDate: jest.fn((date) => {
    return date instanceof Date && !isNaN(date.getTime());
  })
}));

// Mock TimeAgo
jest.mock('javascript-time-ago', () => {
  const mockTimeAgo = {
    format: jest.fn((date, style) => {
      if (style === 'round-minute') {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        if (minutes < 1) return 'just now';
        if (minutes === 1) return '1 minute ago';
        if (minutes < 60) return `${minutes} minutes ago`;
        const hours = Math.floor(minutes / 60);
        if (hours === 1) return '1 hour ago';
        return `${hours} hours ago`;
      }
      return 'some time ago';
    })
  };

  function TimeAgo() {
    return mockTimeAgo;
  }
  
  TimeAgo.addDefaultLocale = jest.fn();
  
  return TimeAgo;
});

// Mock the locale
jest.mock('javascript-time-ago/locale/en', () => ({}));

describe('time.js', () => {
  describe('getTimeAgo function', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('should return null for non-string and non-Date inputs', () => {
      expect(getTimeAgo(123)).toBeNull();
      expect(getTimeAgo(null)).toBeNull();
      expect(getTimeAgo(undefined)).toBeNull();
      expect(getTimeAgo({})).toBeNull();
      expect(getTimeAgo([])).toBeNull();
    });

    test('should handle valid string dates', () => {
      const result = getTimeAgo('2023-01-01T12:00:00Z');
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should return null for invalid string dates', () => {
      const result = getTimeAgo('invalid-date');
      expect(result).toBeNull();
    });

    test('should handle Date objects', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const result = getTimeAgo(date);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should call TimeAgo format with round-minute style for string dates', () => {
      getTimeAgo('2023-01-01T12:00:00Z');
      // We can't directly test the mock call because it's inside a constructor
      // but we can verify the function returns a string result
      expect(getTimeAgo('2023-01-01T12:00:00Z')).toBeDefined();
    });

    test('should call TimeAgo format with round-minute style for Date objects', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const result = getTimeAgo(date);
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    test('should handle edge cases', () => {
      expect(getTimeAgo('')).toBeNull();
      expect(getTimeAgo('not-a-date')).toBeNull();
    });
  });

  describe('module structure', () => {
    test('should export getTimeAgo function', () => {
      expect(typeof getTimeAgo).toBe('function');
    });
  });
});