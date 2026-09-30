import layoutReducer, {
  setBreadcrumbs,
  setSlug,
  setProjectName,
  setLoaded,
} from './index';

describe('common layout reducer', () => {
  const initialState = {
    breadcrumbs: [],
    slugHack: false,
    projectNameHack: false,
    projectLoaded: false,
  };

  it('should return the initial state', () => {
    expect(layoutReducer(undefined, {})).toEqual(initialState);
  });

  it('should handle undefined state', () => {
    expect(layoutReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setBreadcrumbs action', () => {
    it('should set breadcrumbs array', () => {
      const breadcrumbs = [
        { label: 'Home', path: '/' },
        { label: 'Projects', path: '/projects' },
      ];
      const action = setBreadcrumbs(breadcrumbs);
      const state = layoutReducer(initialState, action);

      expect(state.breadcrumbs).toEqual(breadcrumbs);
    });

    it('should replace existing breadcrumbs', () => {
      const oldBreadcrumbs = [{ label: 'Old', path: '/old' }];
      const newBreadcrumbs = [{ label: 'New', path: '/new' }];
      const currentState = { ...initialState, breadcrumbs: oldBreadcrumbs };

      const action = setBreadcrumbs(newBreadcrumbs);
      const state = layoutReducer(currentState, action);

      expect(state.breadcrumbs).toEqual(newBreadcrumbs);
    });

    it('should handle empty array', () => {
      const action = setBreadcrumbs([]);
      const state = layoutReducer(initialState, action);

      expect(state.breadcrumbs).toEqual([]);
    });
  });

  describe('setSlug action', () => {
    it('should set slugHack to true', () => {
      const action = setSlug(true);
      const state = layoutReducer(initialState, action);

      expect(state.slugHack).toBe(true);
    });

    it('should set slugHack to false', () => {
      const currentState = { ...initialState, slugHack: true };
      const action = setSlug(false);
      const state = layoutReducer(currentState, action);

      expect(state.slugHack).toBe(false);
    });

    it('should handle string values', () => {
      const action = setSlug('test-slug');
      const state = layoutReducer(initialState, action);

      expect(state.slugHack).toBe('test-slug');
    });
  });

  describe('setProjectName action', () => {
    it('should set projectNameHack to true', () => {
      const action = setProjectName(true);
      const state = layoutReducer(initialState, action);

      expect(state.projectNameHack).toBe(true);
    });

    it('should set projectNameHack to false', () => {
      const currentState = { ...initialState, projectNameHack: true };
      const action = setProjectName(false);
      const state = layoutReducer(currentState, action);

      expect(state.projectNameHack).toBe(false);
    });

    it('should handle string values', () => {
      const action = setProjectName('Test Project');
      const state = layoutReducer(initialState, action);

      expect(state.projectNameHack).toBe('Test Project');
    });
  });

  describe('setLoaded action', () => {
    it('should set projectLoaded value using key-value pair', () => {
      const action = setLoaded({ key: 'projectLoaded', value: true });
      const state = layoutReducer(initialState, action);

      expect(state.projectLoaded).toBe(true);
    });

    it('should set any key-value pair', () => {
      const action = setLoaded({ key: 'slugHack', value: 'dynamic-slug' });
      const state = layoutReducer(initialState, action);

      expect(state.slugHack).toBe('dynamic-slug');
    });

    it('should add new properties to state', () => {
      const action = setLoaded({ key: 'newProperty', value: 'new value' });
      const state = layoutReducer(initialState, action);

      expect(state.newProperty).toBe('new value');
    });

    it('should handle complex values', () => {
      const complexValue = { nested: { data: 'test' } };
      const action = setLoaded({ key: 'complexData', value: complexValue });
      const state = layoutReducer(initialState, action);

      expect(state.complexData).toEqual(complexValue);
    });
  });

  describe('edge cases', () => {
    it('should handle unknown action type', () => {
      const action = { type: 'unknown/action' };
      const state = layoutReducer(initialState, action);

      expect(state).toEqual(initialState);
    });

    it('should preserve existing state for unknown actions', () => {
      const currentState = {
        ...initialState,
        breadcrumbs: [{ label: 'Existing', path: '/existing' }],
        slugHack: true,
      };
      const action = { type: 'unknown/action' };
      const state = layoutReducer(currentState, action);

      expect(state).toEqual(currentState);
    });

    it('should handle setLoaded with missing key', () => {
      const action = setLoaded({ value: 'test' });
      const state = layoutReducer(initialState, action);

      expect(state[undefined]).toBe('test');
    });

    it('should handle setLoaded with missing value', () => {
      const action = setLoaded({ key: 'testKey' });
      const state = layoutReducer(initialState, action);

      expect(state.testKey).toBeUndefined();
    });
  });
});
