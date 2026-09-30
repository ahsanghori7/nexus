// Mock Subscription helper class
class Subscription {
  constructor() {
    this.mockUsers = ['user1', 'user2'];
  }

  getNonTokenUsers() {
    return this.mockUsers;
  }

  isNonTokenUser(subscriptionId) {
    // Return false by default for testing
    return subscriptionId === 'non-token-user';
  }

  getActivatedSupplyChain() {
    return 'activated-supply-chain';
  }

  getType() {
    return {
      FLEXI: 1,
      STANDARD: 2,
      PREMIUM: 3
    };
  }
}

export default Subscription;
