// Mock for async helper testing
const mockAsyncHelpers = {
  // Mock response for Relay getJson calls
  createMockRelayResponse: (exists = false, found = false, companies = []) => ({
    exists,
    found,
    companies,
    status: 200,
    statusCode: 200
  }),

  // Mock company search results
  mockCompanySearchResults: {
    found: true,
    companies: [
      { id: 1, name: 'Test Company 1', email: 'test1@example.com' },
      { id: 2, name: 'Test Company 2', email: 'test2@example.com' }
    ]
  },

  // Mock email validation responses
  mockEmailValidationResponses: {
    exists: { exists: true },
    notExists: { exists: false },
    serverError: { status: 500, statusCode: 500 },
    validationFailed: null
  }
};

export default mockAsyncHelpers;
