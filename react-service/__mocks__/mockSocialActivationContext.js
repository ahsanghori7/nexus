// Mock for social activation context
const mockSocialActivationContext = {
  actions: {
    activateTeamAccount: jest.fn(() => ({
      unwrap: jest.fn(() => Promise.resolve({
        data: {
          success: true,
          message: 'Account activated successfully'
        }
      }))
    }))
  }
};

export default mockSocialActivationContext;
