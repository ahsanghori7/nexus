import contractorsActions from './contractors';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => {
    const translations = {
      'view-or-edit-app': 'View or Edit App',
    };
    return translations[key] || key;
  },
}));

describe('admin contractors actions configuration', () => {
  it('should export an array of action configurations', () => {
    expect(contractorsActions).toBeDefined();
    expect(Array.isArray(contractorsActions)).toBe(true);
    expect(contractorsActions.length).toBe(1);
  });

  it('should have view-or-edit-app action configuration', () => {
    const action = contractorsActions[0];
    expect(action.id).toBe(2);
    expect(action.text).toBe('View or Edit App');
  });

  it('should have all actions with required properties', () => {
    contractorsActions.forEach(action => {
      expect(action).toHaveProperty('id');
      expect(action).toHaveProperty('text');
      expect(typeof action.id).toBe('number');
      expect(typeof action.text).toBe('string');
    });
  });

  it('should have unique action ids', () => {
    const ids = contractorsActions.map(action => action.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids.length).toBe(uniqueIds.length);
  });

  it('should use internationalization for text', () => {
    const action = contractorsActions[0];
    expect(action.text).toBe('View or Edit App');
  });
});