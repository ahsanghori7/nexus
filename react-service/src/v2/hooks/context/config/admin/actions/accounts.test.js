import accountsActions from './accounts';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => `mocked-${key}`)
}));

describe('accountsActions', () => {
  test('should export an array', () => {
    expect(Array.isArray(accountsActions)).toBe(true);
  });

  test('should have at least one action', () => {
    expect(accountsActions.length).toBeGreaterThan(0);
  });

  test('should have properly structured actions', () => {
    accountsActions.forEach(action => {
      expect(action).toHaveProperty('id');
      expect(action).toHaveProperty('align');
      expect(action).toHaveProperty('text');
      expect(typeof action.id).toBe('number');
      expect(typeof action.align).toBe('string');
      expect(typeof action.text).toBe('string');
    });
  });

  test('should have change-subscription action', () => {
    const changeSubscriptionAction = accountsActions.find(action => action.text.includes('change-subscription'));
    expect(changeSubscriptionAction).toBeDefined();
    expect(changeSubscriptionAction.id).toBe(1);
    expect(changeSubscriptionAction.align).toBe('left');
  });

  test('should have children array for subscription action', () => {
    const changeSubscriptionAction = accountsActions.find(action => action.text.includes('change-subscription'));
    expect(changeSubscriptionAction.children).toBeDefined();
    expect(Array.isArray(changeSubscriptionAction.children)).toBe(true);
    expect(changeSubscriptionAction.children.length).toBeGreaterThan(0);
  });

  test('should have properly structured children', () => {
    const changeSubscriptionAction = accountsActions.find(action => action.text.includes('change-subscription'));
    changeSubscriptionAction.children.forEach(child => {
      expect(child).toHaveProperty('id');
      expect(child).toHaveProperty('name');
      expect(typeof child.id).toBe('number');
      expect(typeof child.name).toBe('string');
    });
  });

  test('should include essential subscription option', () => {
    const changeSubscriptionAction = accountsActions.find(action => action.text.includes('change-subscription'));
    const essentialOption = changeSubscriptionAction.children.find(child => child.name.includes('essential'));
    expect(essentialOption).toBeDefined();
    expect(essentialOption.id).toBe(4);
  });

  test('should include network subscription option', () => {
    const changeSubscriptionAction = accountsActions.find(action => action.text.includes('change-subscription'));
    const networkOption = changeSubscriptionAction.children.find(child => child.name.includes('network'));
    expect(networkOption).toBeDefined();
    expect(networkOption.id).toBe(2);
  });

  test('should have left alignment for all actions', () => {
    accountsActions.forEach(action => {
      expect(action.align).toBe('left');
    });
  });

  test('should use i18next for text translations', () => {
    accountsActions.forEach(action => {
      expect(action.text).toContain('mocked-');
      if (action.children) {
        action.children.forEach(child => {
          expect(child.name).toContain('mocked-');
        });
      }
    });
  });
});