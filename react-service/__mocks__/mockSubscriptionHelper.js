// Mock for user subscription helper used in prosper resources pages
class MockSubscription {
  isTokenUser(subscriptionId) {
    // Return true for testing token-related functionality
    return subscriptionId && subscriptionId > 0;
  }
}

export default MockSubscription;
