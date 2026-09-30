import reducer, {
  setOpenContactsModal,
  setSelectedTemplate,
  setTenderTemplates,
  mockPostContactsFailure,
  mockPostContactsSuccess,
} from './index';

describe('contacts reducer', () => {
  const initialState = {
    open: false,
    templates: [],
    selectedTemplate: 0,
    loading: false,
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('regular reducers', () => {
    it('should handle setOpenContactsModal', () => {
      const action = setOpenContactsModal(true);
      const state = reducer(initialState, action);
      expect(state.open).toBe(true);

      const action2 = setOpenContactsModal(false);
      const state2 = reducer(state, action2);
      expect(state2.open).toBe(false);
    });

    it('should handle setTenderTemplates', () => {
      const templates = [
        { id: 1, name: 'Template 1' },
        { id: 2, name: 'Template 2' },
      ];
      const action = setTenderTemplates(templates);
      const state = reducer(initialState, action);
      expect(state.templates).toEqual(templates);
    });

    it('should handle setSelectedTemplate', () => {
      const action = setSelectedTemplate(5);
      const state = reducer(initialState, action);
      expect(state.selectedTemplate).toBe(5);

      const action2 = setSelectedTemplate(0);
      const state2 = reducer(state, action2);
      expect(state2.selectedTemplate).toBe(0);
    });
  });

  describe('async thunk reducers', () => {
    describe('mockPostContactsFailure', () => {
      it('should handle pending state', () => {
        const action = { type: mockPostContactsFailure.pending.type };
        const state = reducer(initialState, action);
        expect(state.loading).toBe(true);
      });

      it('should handle fulfilled state', () => {
        const currentState = { ...initialState, loading: true };
        const action = { type: mockPostContactsFailure.fulfilled.type };
        const state = reducer(currentState, action);
        expect(state.loading).toBe(false);
      });

      it('should handle rejected state', () => {
        const currentState = { ...initialState, loading: true };
        const action = { type: mockPostContactsFailure.rejected.type };
        const state = reducer(currentState, action);
        expect(state.loading).toBe(false);
      });
    });

    describe('mockPostContactsSuccess', () => {
      it('should handle pending state', () => {
        const action = { type: mockPostContactsSuccess.pending.type };
        const state = reducer(initialState, action);
        expect(state.loading).toBe(true);
      });

      it('should handle fulfilled state', () => {
        const currentState = { ...initialState, loading: true };
        const action = { type: mockPostContactsSuccess.fulfilled.type };
        const state = reducer(currentState, action);
        expect(state.loading).toBe(false);
      });

      it('should handle rejected state', () => {
        const currentState = { ...initialState, loading: true };
        const action = { type: mockPostContactsSuccess.rejected.type };
        const state = reducer(currentState, action);
        expect(state.loading).toBe(false);
      });
    });
  });

  describe('state transitions', () => {
    it('should maintain other state properties when updating open', () => {
      const currentState = {
        ...initialState,
        templates: [{ id: 1, name: 'Test' }],
        selectedTemplate: 3,
        loading: true,
      };

      const action = setOpenContactsModal(true);
      const state = reducer(currentState, action);

      expect(state).toEqual({
        open: true,
        templates: [{ id: 1, name: 'Test' }],
        selectedTemplate: 3,
        loading: true,
      });
    });

    it('should maintain other state properties when updating templates', () => {
      const currentState = {
        ...initialState,
        open: true,
        selectedTemplate: 2,
        loading: true,
      };

      const newTemplates = [{ id: 5, name: 'New Template' }];
      const action = setTenderTemplates(newTemplates);
      const state = reducer(currentState, action);

      expect(state).toEqual({
        open: true,
        templates: [{ id: 5, name: 'New Template' }],
        selectedTemplate: 2,
        loading: true,
      });
    });

    it('should maintain other state properties when updating selectedTemplate', () => {
      const currentState = {
        ...initialState,
        open: true,
        templates: [{ id: 1, name: 'Test' }],
        loading: true,
      };

      const action = setSelectedTemplate(10);
      const state = reducer(currentState, action);

      expect(state).toEqual({
        open: true,
        templates: [{ id: 1, name: 'Test' }],
        selectedTemplate: 10,
        loading: true,
      });
    });
  });
});