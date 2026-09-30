import featuresActions from './features';

// Mock i18n
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => `mocked-${key}`)
}));

describe('featuresActions', () => {
  test('should export an array', () => {
    expect(Array.isArray(featuresActions)).toBe(true);
  });

  test('should have exactly two actions', () => {
    expect(featuresActions).toHaveLength(2);
  });

  test('should have properly structured actions', () => {
    featuresActions.forEach(action => {
      expect(action).toHaveProperty('id');
      expect(action).toHaveProperty('text');
      expect(typeof action.id).toBe('number');
      expect(typeof action.text).toBe('string');
    });
  });

  test('should have update-features action', () => {
    const updateFeaturesAction = featuresActions.find(action => action.id === 1);
    expect(updateFeaturesAction).toBeDefined();
    expect(updateFeaturesAction.text).toContain('update-features');
  });

  test('should have settings action', () => {
    const settingsAction = featuresActions.find(action => action.id === 2);
    expect(settingsAction).toBeDefined();
    expect(settingsAction.text).toContain('settings');
  });

  test('should have unique ids', () => {
    const ids = featuresActions.map(action => action.id);
    const uniqueIds = [...new Set(ids)];
    expect(ids).toHaveLength(uniqueIds.length);
  });

  test('should use i18n for text translations', () => {
    featuresActions.forEach(action => {
      expect(action.text).toContain('mocked-');
    });
  });

  test('should not have children property', () => {
    featuresActions.forEach(action => {
      expect(action.children).toBeUndefined();
    });
  });

  test('should not have align property', () => {
    featuresActions.forEach(action => {
      expect(action.align).toBeUndefined();
    });
  });
});