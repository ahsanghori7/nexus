import Subscription from './subscription';

describe('Subscription', () => {
  let subscription;

  beforeEach(() => {
    subscription = new Subscription();
  });

  describe('getType', () => {
    it('should return all subscription types', () => {
      const types = subscription.getType();
      expect(types).toEqual({
        FREE_TRIAL: 1,
        NETWORK_QUARTERLY: 2,
        NETWORK_YEARLY: 3,
        ESSENTIAL_QUARTERLY: 4,
        ESSENTIAL_YEARLY: 5,
        COMPREHENSIVE_QUARTERLY: 6,
        COMPREHENSIVE_YEARLY: 7,
        COMMISSION: 8,
        ADMINISTRATOR: 9,
        FREE_TRIAL_PROSPER: 10,
        FLEXI: 11,
        REGIONAL: 12,
        NATIONAL: 13,
        NETWORK_DISCOUNT: 14,
        EXTERNAL: 15,
        ACTIVATED_SUPPLY_CHAIN: 16,
      });
    });
  });

  describe('getActivatedSupplyChain', () => {
    it('should return the activated supply chain type', () => {
      expect(subscription.getActivatedSupplyChain()).toBe(16);
    });
  });

  describe('getTokenUsers', () => {
    it('should return array with FREE_TRIAL_PROSPER and FLEXI types', () => {
      expect(subscription.getTokenUsers()).toEqual([10, 11]);
    });
  });

  describe('getExternalMin', () => {
    it('should return array with EXTERNAL type', () => {
      expect(subscription.getExternalMin()).toEqual([15]);
    });
  });

  describe('getExternal', () => {
    it('should return array with EXTERNAL and ACTIVATED_SUPPLY_CHAIN types', () => {
      expect(subscription.getExternal()).toEqual([15, 16]);
    });
  });

  describe('getLite', () => {
    it('should return array with ACTIVATED_SUPPLY_CHAIN type', () => {
      expect(subscription.getLite()).toEqual([16]);
    });
  });

  describe('getNonTokenUsers', () => {
    it('should return array with correct non-token user types', () => {
      expect(subscription.getNonTokenUsers()).toEqual([8, 12, 13, 15, 16]);
    });
  });

  describe('isActivatedSupplyChain', () => {
    it('should return true for activated supply chain id', () => {
      expect(subscription.isActivatedSupplyChain(16)).toBe(true);
      expect(subscription.isActivatedSupplyChain('16')).toBe(true);
    });

    it('should return false for non-activated supply chain id', () => {
      expect(subscription.isActivatedSupplyChain(1)).toBe(false);
      expect(subscription.isActivatedSupplyChain('1')).toBe(false);
    });
  });

  describe('isRegional', () => {
    it('should return true for regional id', () => {
      expect(subscription.isRegional(12)).toBe(true);
      expect(subscription.isRegional('12')).toBe(true);
    });

    it('should return false for non-regional id', () => {
      expect(subscription.isRegional(1)).toBe(false);
      expect(subscription.isRegional('1')).toBe(false);
    });
  });

  describe('isExternal', () => {
    it('should return true for external ids', () => {
      expect(subscription.isExternal(15)).toBe(true);
      expect(subscription.isExternal(16)).toBe(true);
      expect(subscription.isExternal('15')).toBe(true);
      expect(subscription.isExternal('16')).toBe(true);
    });

    it('should return false for non-external ids', () => {
      expect(subscription.isExternal(1)).toBe(false);
      expect(subscription.isExternal('1')).toBe(false);
    });
  });

  describe('isExternalMin', () => {
    it('should return true for external min id', () => {
      expect(subscription.isExternalMin(15)).toBe(true);
      expect(subscription.isExternalMin('15')).toBe(true);
    });

    it('should return false for non-external min id', () => {
      expect(subscription.isExternalMin(1)).toBe(false);
      expect(subscription.isExternalMin('1')).toBe(false);
    });
  });

  describe('isLite', () => {
    it('should return true for lite id', () => {
      expect(subscription.isLite(16)).toBe(true);
      expect(subscription.isLite('16')).toBe(true);
    });

    it('should return false for non-lite id', () => {
      expect(subscription.isLite(1)).toBe(false);
      expect(subscription.isLite('1')).toBe(false);
    });
  });

  describe('isTokenUser', () => {
    it('should return true for token user ids', () => {
      expect(subscription.isTokenUser(10)).toBe(true);
      expect(subscription.isTokenUser(11)).toBe(true);
      expect(subscription.isTokenUser('10')).toBe(true);
      expect(subscription.isTokenUser('11')).toBe(true);
    });

    it('should return false for non-token user ids', () => {
      expect(subscription.isTokenUser(1)).toBe(false);
      expect(subscription.isTokenUser('1')).toBe(false);
    });
  });

  describe('isNonTokenUser', () => {
    it('should return true for non-token user ids', () => {
      expect(subscription.isNonTokenUser(8)).toBe(true);
      expect(subscription.isNonTokenUser(12)).toBe(true);
      expect(subscription.isNonTokenUser(13)).toBe(true);
      expect(subscription.isNonTokenUser(15)).toBe(true);
      expect(subscription.isNonTokenUser(16)).toBe(true);
      expect(subscription.isNonTokenUser('8')).toBe(true);
    });

    it('should return false for token user ids', () => {
      expect(subscription.isNonTokenUser(10)).toBe(false);
      expect(subscription.isNonTokenUser('10')).toBe(false);
    });
  });
});
