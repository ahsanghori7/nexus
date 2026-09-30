// Mock for PromoTokens context and components
const mockCheckToken = jest.fn(() => ({ type: 'CHECK_TOKEN' }));

export const mockPromoTokensContext = {
  actions: {
    checkToken: mockCheckToken,
    claimToken: jest.fn(() => ({ type: 'CLAIM_TOKEN' })),
  }
};

// Mock for react-redux connect
export const mockConnect = jest.fn(() => (component) => component);

// Mock state for redux
export const mockTokenState = {
  token: {
    tokenAward: 100,
    loading: false,
    success: true,
  }
};

export default mockPromoTokensContext;
