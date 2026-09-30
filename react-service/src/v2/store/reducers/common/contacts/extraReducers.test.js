import extraReducers, {
  mockPostContactsFailure,
  mockPostContactsSuccess,
} from './extraReducers';

describe('contacts extraReducers', () => {
  describe('async thunks', () => {
    it('should create mockPostContactsFailure with correct type', () => {
      expect(mockPostContactsFailure.typePrefix).toBe('contacts/mockPostContactsFailure');
    });

    it('should create mockPostContactsSuccess with correct type', () => {
      expect(mockPostContactsSuccess.typePrefix).toBe('contacts/mockPostContactsSuccess');
    });

    it('should make mockPostContactsFailure return rejected action', async () => {
      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await mockPostContactsFailure()(dispatch, getState, undefined);
      expect(result.type).toBe('contacts/mockPostContactsFailure/rejected');
      expect(result.error.message).toBe('Mocked error');
    });

    it('should make mockPostContactsSuccess return fulfilled action', async () => {
      const dispatch = jest.fn();
      const getState = jest.fn();

      const result = await mockPostContactsSuccess()(dispatch, getState, undefined);
      expect(result.type).toBe('contacts/mockPostContactsSuccess/fulfilled');
      expect(result.payload).toEqual({ success: true });
    });
  });

  describe('extraReducers handlers', () => {
    const initialState = {
      open: false,
      templates: [],
      selectedTemplate: 0,
      loading: false,
    };

    describe('mockPostContactsFailure handlers', () => {
      it('should handle pending state', () => {
        const state = { ...initialState };
        const pendingHandler = extraReducers[mockPostContactsFailure.pending];
        pendingHandler(state);
        expect(state.loading).toBe(true);
      });

      it('should handle fulfilled state', () => {
        const state = { ...initialState, loading: true };
        const fulfilledHandler = extraReducers[mockPostContactsFailure.fulfilled];
        fulfilledHandler(state);
        expect(state.loading).toBe(false);
      });

      it('should handle rejected state', () => {
        const state = { ...initialState, loading: true };
        const rejectedHandler = extraReducers[mockPostContactsFailure.rejected];
        rejectedHandler(state);
        expect(state.loading).toBe(false);
      });
    });

    describe('mockPostContactsSuccess handlers', () => {
      it('should handle pending state', () => {
        const state = { ...initialState };
        const pendingHandler = extraReducers[mockPostContactsSuccess.pending];
        pendingHandler(state);
        expect(state.loading).toBe(true);
      });

      it('should handle fulfilled state', () => {
        const state = { ...initialState, loading: true };
        const fulfilledHandler = extraReducers[mockPostContactsSuccess.fulfilled];
        fulfilledHandler(state);
        expect(state.loading).toBe(false);
      });

      it('should handle rejected state', () => {
        const state = { ...initialState, loading: true };
        const rejectedHandler = extraReducers[mockPostContactsSuccess.rejected];
        rejectedHandler(state);
        expect(state.loading).toBe(false);
      });
    });

    describe('state mutations', () => {
      it('should not affect other state properties when setting loading', () => {
        const state = {
          open: true,
          templates: [{ id: 1, name: 'Test' }],
          selectedTemplate: 5,
          loading: false,
        };

        const pendingHandler = extraReducers[mockPostContactsSuccess.pending];
        pendingHandler(state);

        expect(state).toEqual({
          open: true,
          templates: [{ id: 1, name: 'Test' }],
          selectedTemplate: 5,
          loading: true,
        });
      });

      it('should preserve state when transitioning from loading to not loading', () => {
        const state = {
          open: true,
          templates: [{ id: 1, name: 'Test' }, { id: 2, name: 'Test2' }],
          selectedTemplate: 3,
          loading: true,
        };

        const fulfilledHandler = extraReducers[mockPostContactsFailure.fulfilled];
        fulfilledHandler(state);

        expect(state).toEqual({
          open: true,
          templates: [{ id: 1, name: 'Test' }, { id: 2, name: 'Test2' }],
          selectedTemplate: 3,
          loading: false,
        });
      });
    });
  });
});