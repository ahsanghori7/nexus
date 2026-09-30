// Mock for v2/helpers/php-globals
export const PHPAppClinkGloblals = jest.fn(() => ({
  isCostPlaningTool: false,
}));

// Default mock for PHPGlobals (note the typo in the original source code)
// Mock for v2/helpers/php-globals.js
console.log('PHPGloblals mock being loaded');

const PHPGloblals = jest.fn(() => {
  console.log('PHPGloblals mock function called');
  return {
    data: {
      token: 'test-token-123',
      user: {
        user_id: 12345,
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
      },
      company: {
        company_id: 67890,
        company_name: 'Test Company Inc',
        company_type: 'corporation',
      },
      site: {
        base_url: 'http://localhost:3000',
        domain: 'localhost',
      },
      config: {
        environment: 'test',
        debug: true,
      },
    },
  };
});

module.exports = { default: PHPGloblals, PHPGloblals };

// Export as both named and default - matching the typo in source code
module.exports = PHPGloblals;
module.exports.default = PHPGloblals;
module.exports.PHPAppClinkGloblals = PHPAppClinkGloblals;
