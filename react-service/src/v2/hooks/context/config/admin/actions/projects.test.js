import projectsActions from './projects';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => `mocked-${key}`)
}));

describe('projectsActions', () => {
  test('should export an array', () => {
    expect(Array.isArray(projectsActions)).toBe(true);
  });

  test('should have at least one action', () => {
    expect(projectsActions.length).toBeGreaterThan(0);
  });

  test('should have properly structured actions', () => {
    projectsActions.forEach(action => {
      expect(action).toHaveProperty('id');
      expect(action).toHaveProperty('align');
      expect(action).toHaveProperty('text');
      expect(typeof action.id).toBe('number');
      expect(typeof action.align).toBe('string');
      expect(typeof action.text).toBe('string');
    });
  });

  test('should have change-status action', () => {
    const changeStatusAction = projectsActions.find(action => action.text.includes('change-status'));
    expect(changeStatusAction).toBeDefined();
    expect(changeStatusAction.id).toBe(2);
    expect(changeStatusAction.align).toBe('right');
  });

  test('should have children array for change-status action', () => {
    const changeStatusAction = projectsActions.find(action => action.text.includes('change-status'));
    expect(changeStatusAction.children).toBeDefined();
    expect(Array.isArray(changeStatusAction.children)).toBe(true);
    expect(changeStatusAction.children.length).toBeGreaterThan(0);
  });

  test('should have properly structured children', () => {
    const changeStatusAction = projectsActions.find(action => action.text.includes('change-status'));
    changeStatusAction.children.forEach(child => {
      expect(child).toHaveProperty('id');
      expect(child).toHaveProperty('name');
      expect(typeof child.id).toBe('number');
      expect(typeof child.name).toBe('string');
    });
  });

  test('should include publish status option', () => {
    const changeStatusAction = projectsActions.find(action => action.text.includes('change-status'));
    const publishOption = changeStatusAction.children.find(child => child.name.includes('publish'));
    expect(publishOption).toBeDefined();
    expect(publishOption.id).toBe(4);
  });

  test('should include pending status option', () => {
    const changeStatusAction = projectsActions.find(action => action.text.includes('change-status'));
    const pendingOption = changeStatusAction.children.find(child => child.name.includes('pending'));
    expect(pendingOption).toBeDefined();
    expect(pendingOption.id).toBe(2);
  });

  test('should include private status option', () => {
    const changeStatusAction = projectsActions.find(action => action.text.includes('change-status'));
    const privateOption = changeStatusAction.children.find(child => child.name.includes('private'));
    expect(privateOption).toBeDefined();
    expect(privateOption.id).toBe(7);
  });

  test('should include archived status option', () => {
    const changeStatusAction = projectsActions.find(action => action.text.includes('change-status'));
    const archivedOption = changeStatusAction.children.find(child => child.name.includes('archived'));
    expect(archivedOption).toBeDefined();
    expect(archivedOption.id).toBe(14);
  });

  test('should use i18next for text translations', () => {
    projectsActions.forEach(action => {
      expect(action.text).toContain('mocked-');
      if (action.children) {
        action.children.forEach(child => {
          expect(child.name).toContain('mocked-');
        });
      }
    });
  });
});