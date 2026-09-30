// Mock for v2/helpers/php-globals/index.js
console.log('PHPGloblals mock (index.js) being loaded');

function PHPGloblals() {
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
}

function PHPAppClinkGloblals() {
  return {
    config: {
      environment: 'test',
      debug: true,
    },
  };
}

// Default export as a function, not a jest.fn()
export default PHPGloblals;
export { PHPAppClinkGloblals };
