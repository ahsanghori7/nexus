import listenCookieChange, {
  handleUnauthorized,
  SESSION_EXPIRED_KEY,
  SESSION_EXPIRED_EVENT,
} from 'v2/helpers/session';
import Cookies from 'js-cookie';
import * as urlHelpers from 'v2/helpers/url';

// Mock dependencies
jest.mock('js-cookie', () => ({
  get: jest.fn(),
}));

jest.mock('v2/helpers/flags', () =>
  jest.fn((flag) => {
    if (flag === 'SESSION_TIME') return 2000;
    return null;
  }),
);

jest.mock('v2/helpers/url', () => ({
  getUrlWithoutParamers: jest.fn(),
  goTo: jest.fn(),
}));

describe('session.js', () => {
  let mockCookies;
  let mockGetUrlWithoutParamers;
  
  beforeEach(() => {
    mockCookies = Cookies;
    mockGetUrlWithoutParamers = urlHelpers.getUrlWithoutParamers;
    
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Default mock implementations
    mockCookies.get.mockReturnValue('test-token');
    mockGetUrlWithoutParamers.mockReturnValue('/dashboard');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllTimers();
  });

  describe('handleUnauthorized', () => {
    let dispatchEventSpy;

    beforeEach(() => {
      dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');
      sessionStorage.clear();
    });

    afterEach(() => {
      dispatchEventSpy.mockRestore();
    });

    test('stores the default message in sessionStorage and dispatches session:expired event', () => {
      mockGetUrlWithoutParamers.mockReturnValue('/dashboard');

      handleUnauthorized();

      expect(sessionStorage.getItem(SESSION_EXPIRED_KEY)).toBe(
        'Your session has expired. Please log in again.',
      );
      expect(dispatchEventSpy).toHaveBeenCalledTimes(1);
      const firedEvent = dispatchEventSpy.mock.calls[0][0];
      expect(firedEvent.type).toBe(SESSION_EXPIRED_EVENT);
      expect(firedEvent.detail.message).toBe(
        'Your session has expired. Please log in again.',
      );
    });

    test('stores a custom message and includes it in the dispatched event', () => {
      mockGetUrlWithoutParamers.mockReturnValue('/projects');
      const customMessage = 'Custom expiry message';

      handleUnauthorized(customMessage);

      expect(sessionStorage.getItem(SESSION_EXPIRED_KEY)).toBe(customMessage);
      const firedEvent = dispatchEventSpy.mock.calls[0][0];
      expect(firedEvent.detail.message).toBe(customMessage);
    });

    test('does NOT store or dispatch when already on the login page', () => {
      mockGetUrlWithoutParamers.mockReturnValue('/login');

      handleUnauthorized();

      expect(sessionStorage.getItem(SESSION_EXPIRED_KEY)).toBeNull();
      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });

    test('does NOT store or dispatch when already on the sign-up page', () => {
      mockGetUrlWithoutParamers.mockReturnValue('/sign-up');

      handleUnauthorized();

      expect(sessionStorage.getItem(SESSION_EXPIRED_KEY)).toBeNull();
      expect(dispatchEventSpy).not.toHaveBeenCalled();
    });

    test('does NOT call goTo directly (redirect is handled by SessionExpiredModal)', () => {
      mockGetUrlWithoutParamers.mockReturnValue('/dashboard');
      const mockGoTo = urlHelpers.goTo;

      handleUnauthorized();

      expect(mockGoTo).not.toHaveBeenCalled();
    });
  });

  describe('listenCookieChange function', () => {
    test('should be exported as default function', () => {
      expect(typeof listenCookieChange).toBe('function');
    });

    test('should not execute callback on sign-up page', () => {
      mockGetUrlWithoutParamers.mockReturnValue('/sign-up');
      const callback = jest.fn();
      
      listenCookieChange(callback);
      jest.advanceTimersByTime(2000);
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should not execute callback on login page', () => {
      mockGetUrlWithoutParamers.mockReturnValue('/login');
      const callback = jest.fn();
      
      listenCookieChange(callback);
      jest.advanceTimersByTime(2000);
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should not execute callback when cookie remains the same', () => {
      const callback = jest.fn();
      mockCookies.get.mockReturnValue('same-token');
      
      listenCookieChange(callback);
      
      jest.advanceTimersByTime(2000);
      jest.advanceTimersByTime(2000);
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should handle null callback gracefully', () => {
      expect(() => {
        listenCookieChange(null);
        jest.advanceTimersByTime(2000);
      }).not.toThrow();
    });

    test('should handle undefined callback gracefully', () => {
      expect(() => {
        listenCookieChange();
        jest.advanceTimersByTime(2000);
      }).not.toThrow();
    });

    test('should handle different URL patterns', () => {
      mockGetUrlWithoutParamers.mockReturnValue('/some-random-page');
      const callback = jest.fn();
      
      expect(() => {
        listenCookieChange(callback);
        jest.advanceTimersByTime(2000);
      }).not.toThrow();
    });

    test('should work with custom interval', () => {
      const callback = jest.fn();
      const customInterval = 5000;
      
      expect(() => {
        listenCookieChange(callback, customInterval);
        jest.advanceTimersByTime(customInterval);
      }).not.toThrow();
    });

    test('should handle cookie retrieval gracefully', () => {
      // Test basic functionality without trying to cause errors
      const callback = jest.fn();
      mockCookies.get.mockReturnValue(undefined);
      
      expect(() => {
        listenCookieChange(callback);
        jest.advanceTimersByTime(2000);
      }).not.toThrow();
    });

    test('should handle URL function gracefully', () => {
      // Test basic functionality
      const callback = jest.fn();
      mockGetUrlWithoutParamers.mockReturnValue('');
      
      expect(() => {
        listenCookieChange(callback);
        jest.advanceTimersByTime(2000);
      }).not.toThrow();
    });
  });
});
