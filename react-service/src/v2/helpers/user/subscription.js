class Subscription {
  constructor() {
    this.TYPES = {
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
    };
  }

  getType() {
    return this.TYPES;
  }

  getActivatedSupplyChain() {
    return this.TYPES.ACTIVATED_SUPPLY_CHAIN;
  }

  getTokenUsers() {
    return [this.TYPES.FREE_TRIAL_PROSPER, this.TYPES.FLEXI];
  }

  getExternalMin() {
    return [this.TYPES.EXTERNAL];
  }

  getExternal() {
    return [this.TYPES.EXTERNAL, this.TYPES.ACTIVATED_SUPPLY_CHAIN];
  }

  getLite() {
    return [this.TYPES.ACTIVATED_SUPPLY_CHAIN];
  }

  getNonTokenUsers() {
    return [
      this.TYPES.COMMISSION,
      this.TYPES.REGIONAL,
      this.TYPES.NATIONAL,
      this.TYPES.EXTERNAL,
      this.TYPES.ACTIVATED_SUPPLY_CHAIN,
    ];
  }

  isActivatedSupplyChain(id) {
    return this.TYPES.ACTIVATED_SUPPLY_CHAIN === Number(id);
  }

  isRegional(id) {
    return this.TYPES.REGIONAL === Number(id);
  }

  isExternal(id) {
    return this.getExternal().includes(Number(id));
  }

  isExternalMin(id) {
    return this.getExternalMin().includes(Number(id));
  }

  isLite(id) {
    return this.getLite().includes(Number(id));
  }

  isTokenUser(id) {
    return this.getTokenUsers().includes(Number(id));
  }

  isNonTokenUser(id) {
    return this.getNonTokenUsers().includes(Number(id));
  }
}

export default Subscription;
