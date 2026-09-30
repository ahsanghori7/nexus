// Mock for js-cookie
export default {
  get: jest.fn(() => 'mock-token'),
  set: jest.fn(),
  remove: jest.fn(),
};

// For CommonJS compatibility
module.exports = {
  get: jest.fn(() => 'mock-token'),
  set: jest.fn(),
  remove: jest.fn(),
};
