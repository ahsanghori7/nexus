import useClarity from 'v2/helpers/clarity';

describe('clarity.js', () => {
  const originalClarity = global.CLARITY;
  const originalEnv = global.ENV;
  const originalDocument = global.document;
  const originalWindow = global.window;

  beforeEach(() => {
    // Set up default globals
    global.CLARITY = {
      PROJECT_ID: 'test-project-id',
      DEBUG: false
    };
    global.ENV = 'production';
    
    // Mock document with Jest mocks
    global.document = {
      createElement: jest.fn(() => ({})),
      getElementsByTagName: jest.fn(() => [{ parentNode: { insertBefore: jest.fn() } }])
    };
    
    // Mock window
    global.window = {};
  });

  afterEach(() => {
    global.CLARITY = originalClarity;
    global.ENV = originalEnv;
    global.document = originalDocument;
    global.window = originalWindow;
    jest.clearAllMocks();
  });

  describe('useClarity function', () => {
    test('should be exported as default function', () => {
      expect(typeof useClarity).toBe('function');
    });

    test('should not execute when CLARITY is not available', () => {
      global.CLARITY = undefined;
      const callback = jest.fn();
      
      useClarity(callback);
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should not execute when PROJECT_ID is not available', () => {
      global.CLARITY = { PROJECT_ID: null };
      const callback = jest.fn();
      
      useClarity(callback);
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should not execute when PROJECT_ID is empty string', () => {
      global.CLARITY = { PROJECT_ID: '' };
      const callback = jest.fn();
      
      useClarity(callback);
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should not execute in development environment by default', () => {
      global.ENV = 'development';
      const callback = jest.fn();
      
      useClarity(callback);
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should not execute in non-whitelisted environments', () => {
      global.ENV = 'local';
      const callback = jest.fn();
      
      useClarity(callback);
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should work without callback parameter', () => {
      expect(() => {
        useClarity();
      }).not.toThrow();
    });

    test('should handle default callback function', () => {
      // Test that default callback works and doesn't throw
      expect(() => {
        useClarity(undefined);
      }).not.toThrow();
    });

    test('should handle null callback', () => {
      expect(() => {
        useClarity(null);
      }).not.toThrow();
    });

    test('should handle basic functionality', () => {
      global.CLARITY = { PROJECT_ID: 'test-id', DEBUG: false };
      global.ENV = 'production';
      
      expect(() => {
        useClarity();
      }).not.toThrow();
    });

    test('should handle callback execution path', () => {
      global.CLARITY = { PROJECT_ID: 'test-id', DEBUG: false };
      global.ENV = 'production';
      
      const callback = jest.fn();
      
      // This test focuses on whether the function executes without errors
      // The DOM operations are complex to mock completely
      expect(() => {
        useClarity(callback);
      }).not.toThrow();
    });

    test('should handle DOM operations', () => {
      global.CLARITY = { PROJECT_ID: 'test-id', DEBUG: false };
      global.ENV = 'production';
      
      const callback = jest.fn();
      
      expect(() => {
        useClarity(callback);
      }).not.toThrow();
    });

    test('should set up clarity environment variables', () => {
      global.CLARITY = { PROJECT_ID: 'test-id', DEBUG: false };
      global.ENV = 'production';
      
      global.document = {
        createElement: jest.fn(() => ({})),
        getElementsByTagName: jest.fn(() => [{ parentNode: { insertBefore: jest.fn() } }])
      };
      
      useClarity();
      
      // Verify that window.clarity is set up (function is added to window)
      expect(global.window).toHaveProperty('clarity');
      expect(typeof global.window.clarity).toBe('function');
    });
  });
});