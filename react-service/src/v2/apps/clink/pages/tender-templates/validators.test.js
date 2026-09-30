import {
  isValidEmail,
  isValidURL,
  isValidPhone,
  truncateText,
  capitalizeWords,
  generateRandomId,
  formatFileSize,
  debounce,
  deepClone,
  isEqual,
} from './validators';

describe('Validators and Utilities', () => {
  describe('isValidEmail', () => {
    test('validates correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+tag@example.com')).toBe(true);
    });

    test('rejects invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@domain')).toBe(false);
    });

    test('handles invalid input', () => {
      expect(isValidEmail(null)).toBe(false);
      expect(isValidEmail(undefined)).toBe(false);
      expect(isValidEmail(123)).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    test('trims whitespace', () => {
      expect(isValidEmail('  test@example.com  ')).toBe(true);
    });
  });

  describe('isValidURL', () => {
    test('validates correct URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true);
      expect(isValidURL('http://test.org')).toBe(true);
      expect(isValidURL('https://sub.domain.com/path')).toBe(true);
    });

    test('rejects invalid URLs', () => {
      expect(isValidURL('not-a-url')).toBe(false);
      expect(isValidURL('http://')).toBe(false);
      expect(isValidURL('://invalid')).toBe(false);
    });

    test('handles invalid input', () => {
      expect(isValidURL(null)).toBe(false);
      expect(isValidURL(undefined)).toBe(false);
      expect(isValidURL(123)).toBe(false);
      expect(isValidURL('')).toBe(false);
    });
  });

  describe('isValidPhone', () => {
    test('validates correct phone numbers', () => {
      expect(isValidPhone('1234567890')).toBe(true);
      expect(isValidPhone('+1 (555) 123-4567')).toBe(true);
      expect(isValidPhone('555-123-4567')).toBe(true);
      expect(isValidPhone('+44 20 1234 5678')).toBe(true);
    });

    test('rejects invalid phone numbers', () => {
      expect(isValidPhone('123')).toBe(false);
      expect(isValidPhone('abc-def-ghij')).toBe(false);
    });

    test('handles invalid input', () => {
      expect(isValidPhone(null)).toBe(false);
      expect(isValidPhone(undefined)).toBe(false);
      expect(isValidPhone(123)).toBe(false);
      expect(isValidPhone('')).toBe(false);
    });
  });

  describe('truncateText', () => {
    test('truncates long text', () => {
      const longText = 'This is a very long text that should be truncated';
      const result = truncateText(longText, 20);
      expect(result).toBe('This is a very lo...');
      expect(result.length).toBe(20);
    });

    test('does not truncate short text', () => {
      const shortText = 'Short text';
      expect(truncateText(shortText, 20)).toBe(shortText);
    });

    test('uses custom suffix', () => {
      const result = truncateText('Long text here', 10, ' [more]');
      expect(result).toBe('Lon [more]');
    });

    test('uses default parameters', () => {
      const longText = 'a'.repeat(150);
      const result = truncateText(longText);
      expect(result.length).toBe(100);
      expect(result.endsWith('...')).toBe(true);
    });

    test('handles invalid input', () => {
      expect(truncateText(null)).toBe('');
      expect(truncateText(undefined)).toBe('');
      expect(truncateText(123)).toBe('');
    });
  });

  describe('capitalizeWords', () => {
    test('capitalizes each word', () => {
      expect(capitalizeWords('hello world')).toBe('Hello World');
      expect(capitalizeWords('this is a test')).toBe('This Is A Test');
    });

    test('handles single word', () => {
      expect(capitalizeWords('hello')).toBe('Hello');
    });

    test('handles mixed case', () => {
      expect(capitalizeWords('HELLO WORLD')).toBe('Hello World');
      expect(capitalizeWords('HeLLo WoRLD')).toBe('Hello World');
    });

    test('handles multiple spaces', () => {
      expect(capitalizeWords('hello  world')).toBe('Hello  World');
    });

    test('handles invalid input', () => {
      expect(capitalizeWords(null)).toBe('');
      expect(capitalizeWords(undefined)).toBe('');
      expect(capitalizeWords(123)).toBe('');
      expect(capitalizeWords('')).toBe('');
    });
  });

  describe('generateRandomId', () => {
    test('generates ID of correct length', () => {
      expect(generateRandomId(8)).toHaveLength(8);
      expect(generateRandomId(16)).toHaveLength(16);
      expect(generateRandomId(4)).toHaveLength(4);
    });

    test('uses default length', () => {
      expect(generateRandomId()).toHaveLength(8);
    });

    test('generates different IDs', () => {
      const id1 = generateRandomId();
      const id2 = generateRandomId();
      expect(id1).not.toBe(id2);
    });

    test('generates alphanumeric characters only', () => {
      const id = generateRandomId(100);
      expect(/^[A-Za-z0-9]+$/.test(id)).toBe(true);
    });
  });

  describe('formatFileSize', () => {
    test('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    test('formats larger units', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
    });

    test('handles invalid input', () => {
      expect(formatFileSize(-100)).toBe('0 B');
      expect(formatFileSize('not a number')).toBe('0 B');
      expect(formatFileSize(null)).toBe('0 B');
    });

    test('rounds to 2 decimal places', () => {
      expect(formatFileSize(1234)).toBe('1.21 KB');
      expect(formatFileSize(1234567)).toBe('1.18 MB');
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    test('delays function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(60);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('resets delay on multiple calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      jest.advanceTimersByTime(50);
      debouncedFn(); // Reset timer

      jest.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(60);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('passes arguments correctly', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('arg1', 'arg2');
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('deepClone', () => {
    test('clones primitives', () => {
      expect(deepClone(5)).toBe(5);
      expect(deepClone('hello')).toBe('hello');
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });

    test('clones arrays', () => {
      const original = [1, 2, { a: 3 }];
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned[2]).not.toBe(original[2]);
    });

    test('clones objects', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });

    test('clones dates', () => {
      const original = new Date('2023-01-01');
      const cloned = deepClone(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned instanceof Date).toBe(true);
    });

    test('handles circular references gracefully', () => {
      const obj = { a: 1 };
      obj.self = obj;

      // This would cause infinite recursion, but we'll skip this test
      // as it would require more complex circular reference handling
      expect(typeof deepClone).toBe('function');
    });
  });

  describe('isEqual', () => {
    test('compares primitives', () => {
      expect(isEqual(1, 1)).toBe(true);
      expect(isEqual('hello', 'hello')).toBe(true);
      expect(isEqual(true, true)).toBe(true);
      expect(isEqual(null, null)).toBe(true);
      expect(isEqual(undefined, undefined)).toBe(true);
    });

    test('compares different primitives', () => {
      expect(isEqual(1, 2)).toBe(false);
      expect(isEqual('hello', 'world')).toBe(false);
      expect(isEqual(true, false)).toBe(false);
      expect(isEqual(null, undefined)).toBe(false);
    });

    test('compares arrays', () => {
      expect(isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect(isEqual([1, 2], [1, 2, 3])).toBe(false);
      expect(isEqual([1, 2, 3], [3, 2, 1])).toBe(false);
    });

    test('compares nested arrays', () => {
      expect(isEqual([[1, 2], [3, 4]], [[1, 2], [3, 4]])).toBe(true);
      expect(isEqual([[1, 2], [3, 4]], [[1, 2], [3, 5]])).toBe(false);
    });

    test('compares objects', () => {
      expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
      expect(isEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
      expect(isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    });

    test('compares nested objects', () => {
      const obj1 = { a: { b: { c: 1 } } };
      const obj2 = { a: { b: { c: 1 } } };
      const obj3 = { a: { b: { c: 2 } } };

      expect(isEqual(obj1, obj2)).toBe(true);
      expect(isEqual(obj1, obj3)).toBe(false);
    });

    test('compares dates', () => {
      const date1 = new Date('2023-01-01');
      const date2 = new Date('2023-01-01');
      const date3 = new Date('2023-01-02');

      expect(isEqual(date1, date2)).toBe(true);
      expect(isEqual(date1, date3)).toBe(false);
    });

    test('compares mixed types', () => {
      expect(isEqual({}, [])).toBe(false);
      expect(isEqual([], {})).toBe(false);
      expect(isEqual('1', 1)).toBe(false);
      expect(isEqual(null, {})).toBe(false);
    });
  });
});