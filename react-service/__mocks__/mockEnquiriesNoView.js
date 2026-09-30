// Mock setup for NoView component testing
export const mockSubcontractor = {
  id: 1,
  subscription_id: 1,
  country: {
    code: 'UK',
  },
};

export const mockSubcontractorNonUK = {
  id: 2,
  subscription_id: 2,
  country: {
    code: 'US',
  },
};

export const mockSubscriptionHelper = {
  isActivatedSupplyChain: jest.fn().mockReturnValue(false),
  isTokenUser: jest.fn().mockReturnValue(true),
  isExternal: jest.fn().mockReturnValue(false),
};

// Mock v2/helpers/url functions
export const mockGetUrl = jest.fn((app, path) => `https://example.com${path}`);
export const mockWistiaConfigUrl = jest.fn((id, suffix = '') => `https://wistia.example.com/${id}${suffix}`);

// Mock hooks/useScript
export const mockUseScript = jest.fn();

// Mock window.location for testing
export const mockWindowLocation = {
  pathname: '/test-path',
  href: 'https://example.com/test-path',
};
