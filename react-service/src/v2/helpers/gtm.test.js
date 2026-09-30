import tagManagerArgs from 'v2/helpers/gtm';
import tagManager from 'react-gtm-module';

// Mock react-gtm-module
jest.mock('react-gtm-module', () => ({
  initialize: jest.fn(),
}));

// Mock the flags helper
jest.mock('v2/helpers/flags', () =>
  jest.fn((flag) => {
    if (flag === 'GMT_ID') return 'GTM-TEST123';
    return null;
  }),
);

describe('gtm.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('tagManagerArgs function', () => {
    test('should initialize TagManager with default configuration', () => {
      tagManagerArgs();

      expect(tagManager.initialize).toHaveBeenCalledWith({
        gtmId: 'GTM-TEST123',
        dataLayer: {
          userId: '001',
          userProject: 'project'
        },
      });
    });

    test('should initialize TagManager with custom dataLayer', () => {
      const customDataLayer = {
        userId: '123',
        userProject: 'custom-project',
        customField: 'custom-value'
      };

      tagManagerArgs(customDataLayer);

      expect(tagManager.initialize).toHaveBeenCalledWith({
        gtmId: 'GTM-TEST123',
        dataLayer: customDataLayer,
      });
    });

    test('should handle empty dataLayer object', () => {
      const emptyDataLayer = {};

      tagManagerArgs(emptyDataLayer);

      expect(tagManager.initialize).toHaveBeenCalledWith({
        gtmId: 'GTM-TEST123',
        dataLayer: emptyDataLayer,
      });
    });

    test('should handle undefined dataLayer parameter', () => {
      tagManagerArgs(undefined);

      expect(tagManager.initialize).toHaveBeenCalledWith({
        gtmId: 'GTM-TEST123',
        dataLayer: {
          userId: '001',
          userProject: 'project'
        },
      });
    });
  });

  describe('module behavior', () => {
    test('should export tagManagerArgs as default export', () => {
      expect(typeof tagManagerArgs).toBe('function');
    });

    test('should not throw errors when called multiple times', () => {
      expect(() => {
        tagManagerArgs();
        tagManagerArgs();
        tagManagerArgs();
      }).not.toThrow();

      expect(tagManager.initialize).toHaveBeenCalledTimes(3);
    });
  });
});
