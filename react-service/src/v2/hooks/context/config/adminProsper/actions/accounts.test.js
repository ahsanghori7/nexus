import contractorsActions from './accounts';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => `mocked-${key}`)
}));

describe('adminProsper contractorsActions', () => {
  test('should export an array', () => {
    expect(Array.isArray(contractorsActions)).toBe(true);
  });

  test('should have at least one action', () => {
    expect(contractorsActions.length).toBeGreaterThan(0);
  });

  test('should have properly structured actions', () => {
    contractorsActions.forEach(action => {
      expect(action).toHaveProperty('id');
      expect(action).toHaveProperty('text');
      expect(typeof action.id).toBe('number');
      expect(typeof action.text).toBe('string');
      if (action.align) {
        expect(typeof action.align).toBe('string');
      }
    });
  });

  test('should have change-subscription action', () => {
    const changeSubscriptionAction = contractorsActions.find(action => action.text.includes('change-subscription'));
    expect(changeSubscriptionAction).toBeDefined();
    expect(changeSubscriptionAction.id).toBe(1);
    expect(changeSubscriptionAction.align).toBe('right');
  });

  test('should have children array for subscription action', () => {
    const changeSubscriptionAction = contractorsActions.find(action => action.text.includes('change-subscription'));
    expect(changeSubscriptionAction.children).toBeDefined();
    expect(Array.isArray(changeSubscriptionAction.children)).toBe(true);
    expect(changeSubscriptionAction.children.length).toBeGreaterThan(0);
  });

  test('should have Flexi subscription option', () => {
    const changeSubscriptionAction = contractorsActions.find(action => action.text.includes('change-subscription'));
    const flexiOption = changeSubscriptionAction.children.find(child => child.name === 'Flexi');
    expect(flexiOption).toBeDefined();
    expect(flexiOption.id).toBe(11);
  });

  test('should have National subscription option', () => {
    const changeSubscriptionAction = contractorsActions.find(action => action.text.includes('change-subscription'));
    const nationalOption = changeSubscriptionAction.children.find(child => child.name === 'National');
    expect(nationalOption).toBeDefined();
    expect(nationalOption.id).toBe(13);
  });

  test('should use i18next for text translations', () => {
    contractorsActions.forEach(action => {
      expect(action.text).toContain('mocked-');
    });
  });

  test('should have properly structured children', () => {
    contractorsActions.forEach(action => {
      if (action.children) {
        action.children.forEach(child => {
          expect(child).toHaveProperty('id');
          expect(child).toHaveProperty('name');
          expect(typeof child.id).toBe('number');
          expect(typeof child.name).toBe('string');
        });
      }
    });
  });

  test('should have view-or-edit action', () => {
    const viewOrEditAction = contractorsActions.find(action => action.text.includes('view-or-edit'));
    expect(viewOrEditAction).toBeDefined();
    expect(viewOrEditAction.id).toBe(2);
  });

  test('should have right alignment for subscription action', () => {
    const changeSubscriptionAction = contractorsActions.find(action => action.text.includes('change-subscription'));
    expect(changeSubscriptionAction.align).toBe('right');
  });
});