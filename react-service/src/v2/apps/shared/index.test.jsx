// Mock CSS and SCSS imports
jest.mock('reset-css', () => ({}));
jest.mock('assets/styles/index.scss', () => ({}));

// Mock the session helper
jest.mock('v2/helpers/session', () => jest.fn());

// Mock the URL helper
jest.mock('v2/helpers/url', () => ({
  goTo: jest.fn(),
}));

// Mock i18n
jest.mock('v2/helpers/i18n', () => ({}));

// Mock MUI License
jest.mock('@mui/x-license', () => ({
  LicenseInfo: {
    setLicenseKey: jest.fn(),
  },
}));

describe('Shared Module Index', () => {
  beforeEach(() => {
    // Clear mocks and reset globals
    jest.clearAllMocks();
    // Set default globals to avoid ReferenceError
    global.ENV = undefined;
    global.LICENSES = undefined;
  });

  test('should import without errors with default globals', () => {
    // Test that the module imports successfully without throwing errors
    expect(() => {
      require('./index.jsx');
    }).not.toThrow();
  });

  test('should set MUI license when available', () => {
    const { LicenseInfo } = require('@mui/x-license');
    
    // Mock the global variables
    global.LICENSES = { MUI_PRO: 'test-license-key' };
    global.ENV = undefined; // Make sure ENV doesn't interfere
    
    // Re-import to trigger the license setting
    jest.isolateModules(() => {
      require('./index.jsx');
    });
    
    // Verify license was set
    expect(LicenseInfo.setLicenseKey).toHaveBeenCalledWith('test-license-key');
  });

  test('should handle production environment setup', () => {
    const listenCookieChange = require('v2/helpers/session');
    const { goTo } = require('v2/helpers/url');
    
    // Mock environment variables
    global.ENV = 'production';
    global.LICENSES = undefined; // Make sure LICENSES doesn't interfere
    
    // Re-import to trigger environment handling
    jest.isolateModules(() => {
      require('./index.jsx');
    });
    
    // Verify cookie listener was set up
    expect(listenCookieChange).toHaveBeenCalled();
    
    // Test the callback function
    const callback = listenCookieChange.mock.calls[0][0];
    callback();
    expect(goTo).toHaveBeenCalledWith('/login');
  });

  test('should not set up cookie listener in development environment', () => {
    const listenCookieChange = require('v2/helpers/session');
    
    // Mock environment variables
    global.ENV = 'development';
    global.LICENSES = undefined; // Make sure LICENSES doesn't interfere
    
    // Re-import to trigger environment handling
    jest.isolateModules(() => {
      require('./index.jsx');
    });
    
    // Verify cookie listener was not set up
    expect(listenCookieChange).not.toHaveBeenCalled();
  });

  test('should handle both license and environment setup together', () => {
    const { LicenseInfo } = require('@mui/x-license');
    const listenCookieChange = require('v2/helpers/session');
    
    // Mock both globals
    global.ENV = 'production';
    global.LICENSES = { MUI_PRO: 'test-license-key' };
    
    // Re-import to trigger both setups
    jest.isolateModules(() => {
      require('./index.jsx');
    });
    
    // Verify both were called
    expect(LicenseInfo.setLicenseKey).toHaveBeenCalledWith('test-license-key');
    expect(listenCookieChange).toHaveBeenCalled();
  });
});