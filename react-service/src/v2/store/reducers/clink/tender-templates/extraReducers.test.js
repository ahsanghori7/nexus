/**
 * @jest-environment jsdom
 */
import { produce } from 'immer';
import tenderTemplateReducer, {
  fetchTenderTemplates,
  createTenderTemplate,
  deleteTenderTemplate,
} from './index';

// Mock Relay service
jest.mock('v2/services/relay', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    post: jest.fn(),
  }));
});

describe('tender-templates extraReducers', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      tenderTemplates: [],
      status: 'idle',
      loading: false,
      error: null,
    };
  });

  describe('fetchTenderTemplates', () => {
    describe('pending', () => {
      it('should set loading state when fetch is pending', () => {
        const action = { type: fetchTenderTemplates.pending.type };
        const expectedState = produce(initialState, (draft) => {
          draft.status = 'loading';
          draft.loading = true;
          draft.error = null;
        });

        const result = tenderTemplateReducer(initialState, action);
        expect(result).toEqual(expectedState);
      });

      it('should clear previous error when fetching starts', () => {
        const stateWithError = {
          ...initialState,
          error: 'Previous error',
          status: 'error',
        };

        const action = { type: fetchTenderTemplates.pending.type };
        const result = tenderTemplateReducer(stateWithError, action);

        expect(result.error).toBeNull();
        expect(result.status).toBe('loading');
        expect(result.loading).toBe(true);
      });
    });

    describe('fulfilled', () => {
      it('should update state with templates from payload.data', () => {
        const mockTemplates = [
          { id: 1, name: 'Template 1', type: 'tender' },
          { id: 2, name: 'Template 2', type: 'contract' },
        ];

        const action = {
          type: fetchTenderTemplates.fulfilled.type,
          payload: { data: mockTemplates },
        };

        const expectedState = produce(initialState, (draft) => {
          draft.status = 'succeeded';
          draft.loading = false;
          draft.tenderTemplates = mockTemplates;
        });

        const result = tenderTemplateReducer(initialState, action);
        expect(result).toEqual(expectedState);
      });

      it('should update state with templates from payload directly if no data property', () => {
        const mockTemplates = [
          { id: 3, name: 'Template 3', type: 'tender' },
        ];

        const action = {
          type: fetchTenderTemplates.fulfilled.type,
          payload: mockTemplates,
        };

        const expectedState = produce(initialState, (draft) => {
          draft.status = 'succeeded';
          draft.loading = false;
          draft.tenderTemplates = mockTemplates;
        });

        const result = tenderTemplateReducer(initialState, action);
        expect(result).toEqual(expectedState);
      });

      it('should set empty array if payload is null or undefined', () => {
        const action = {
          type: fetchTenderTemplates.fulfilled.type,
          payload: null,
        };

        const result = tenderTemplateReducer(initialState, action);
        expect(result.tenderTemplates).toEqual([]);
        expect(result.status).toBe('succeeded');
        expect(result.loading).toBe(false);
      });

      it('should handle empty data array', () => {
        const action = {
          type: fetchTenderTemplates.fulfilled.type,
          payload: { data: [] },
        };

        const result = tenderTemplateReducer(initialState, action);
        expect(result.tenderTemplates).toEqual([]);
        expect(result.status).toBe('succeeded');
        expect(result.loading).toBe(false);
      });
    });

    describe('rejected', () => {
      it('should set error state when fetch is rejected with error message', () => {
        const errorMessage = 'Network error occurred';
        const action = {
          type: fetchTenderTemplates.rejected.type,
          error: { message: errorMessage },
        };

        const expectedState = produce(initialState, (draft) => {
          draft.status = 'error';
          draft.loading = false;
          draft.tenderTemplates = [];
          draft.error = errorMessage;
        });

        const result = tenderTemplateReducer(initialState, action);
        expect(result).toEqual(expectedState);
      });

      it('should use default error message when no error message provided', () => {
        const action = {
          type: fetchTenderTemplates.rejected.type,
          error: {},
        };

        const result = tenderTemplateReducer(initialState, action);
        expect(result.error).toBe('Failed to fetch templates');
        expect(result.status).toBe('error');
        expect(result.loading).toBe(false);
        expect(result.tenderTemplates).toEqual([]);
      });

      it('should clear existing templates when fetch fails', () => {
        const stateWithTemplates = {
          ...initialState,
          tenderTemplates: [{ id: 1, name: 'Existing Template' }],
        };

        const action = {
          type: fetchTenderTemplates.rejected.type,
          error: { message: 'Failed to fetch' },
        };

        const result = tenderTemplateReducer(stateWithTemplates, action);
        expect(result.tenderTemplates).toEqual([]);
      });
    });
  });

  describe('createTenderTemplate', () => {
    describe('pending', () => {
      it('should set creating status when create is pending', () => {
        const action = { type: createTenderTemplate.pending.type };
        const expectedState = produce(initialState, (draft) => {
          draft.status = 'creating';
          draft.error = null;
        });

        const result = tenderTemplateReducer(initialState, action);
        expect(result).toEqual(expectedState);
      });

      it('should clear previous errors when creating starts', () => {
        const stateWithError = {
          ...initialState,
          error: 'Previous creation error',
        };

        const action = { type: createTenderTemplate.pending.type };
        const result = tenderTemplateReducer(stateWithError, action);

        expect(result.error).toBeNull();
        expect(result.status).toBe('creating');
      });
    });

    describe('fulfilled', () => {
      it('should add new template when creation is successful', () => {
        const existingTemplates = [
          { id: 1, name: 'Existing Template' },
        ];
        const stateWithTemplates = {
          ...initialState,
          tenderTemplates: existingTemplates,
        };

        const newTemplate = { id: 2, name: 'New Template' };
        const action = {
          type: createTenderTemplate.fulfilled.type,
          payload: { success: true, data: newTemplate },
        };

        const expectedState = produce(stateWithTemplates, (draft) => {
          draft.status = 'succeeded';
          draft.tenderTemplates.push(newTemplate);
        });

        const result = tenderTemplateReducer(stateWithTemplates, action);
        expect(result).toEqual(expectedState);
      });

      it('should add template directly from payload if no data property', () => {
        const newTemplate = { id: 3, name: 'Direct Template' };
        const action = {
          type: createTenderTemplate.fulfilled.type,
          payload: { success: true, ...newTemplate },
        };

        const result = tenderTemplateReducer(initialState, action);
        expect(result.tenderTemplates).toHaveLength(1);
        expect(result.tenderTemplates[0]).toEqual({ success: true, ...newTemplate });
        expect(result.status).toBe('succeeded');
      });

      it('should not add template when payload.success is false', () => {
        const action = {
          type: createTenderTemplate.fulfilled.type,
          payload: { success: false, data: { id: 4, name: 'Failed Template' } },
        };

        const result = tenderTemplateReducer(initialState, action);
        expect(result.tenderTemplates).toEqual([]);
        expect(result.status).toBe('succeeded');
      });

      it('should handle payload without success property', () => {
        const action = {
          type: createTenderTemplate.fulfilled.type,
          payload: { data: { id: 5, name: 'No Success Flag' } },
        };

        const result = tenderTemplateReducer(initialState, action);
        expect(result.tenderTemplates).toEqual([]);
        expect(result.status).toBe('succeeded');
      });
    });

    describe('rejected', () => {
      it('should set error state when create is rejected', () => {
        const errorMessage = 'Creation failed';
        const action = {
          type: createTenderTemplate.rejected.type,
          error: { message: errorMessage },
        };

        const expectedState = produce(initialState, (draft) => {
          draft.status = 'error';
          draft.error = errorMessage;
        });

        const result = tenderTemplateReducer(initialState, action);
        expect(result).toEqual(expectedState);
      });

      it('should use default error message when no error message provided', () => {
        const action = {
          type: createTenderTemplate.rejected.type,
          error: {},
        };

        const result = tenderTemplateReducer(initialState, action);
        expect(result.error).toBe('Failed to create template');
        expect(result.status).toBe('error');
      });
    });
  });

  describe('deleteTenderTemplate', () => {
    describe('pending', () => {
      it('should set deleting status when delete is pending', () => {
        const action = { type: deleteTenderTemplate.pending.type };
        const expectedState = produce(initialState, (draft) => {
          draft.status = 'deleting';
          draft.error = null;
        });

        const result = tenderTemplateReducer(initialState, action);
        expect(result).toEqual(expectedState);
      });

      it('should clear previous errors when deleting starts', () => {
        const stateWithError = {
          ...initialState,
          error: 'Previous deletion error',
        };

        const action = { type: deleteTenderTemplate.pending.type };
        const result = tenderTemplateReducer(stateWithError, action);

        expect(result.error).toBeNull();
        expect(result.status).toBe('deleting');
      });
    });

    describe('fulfilled', () => {
      it('should remove template when deletion is successful', () => {
        const templates = [
          { id: 1, name: 'Template 1' },
          { id: 2, name: 'Template 2' },
          { id: 3, name: 'Template 3' },
        ];
        const stateWithTemplates = {
          ...initialState,
          tenderTemplates: templates,
        };

        const action = deleteTenderTemplate.fulfilled(
          { success: true, id: 2 },
          'delete-request-1',
          { did: 2 }
        );

        const expectedState = produce(stateWithTemplates, (draft) => {
          draft.status = 'succeeded';
          draft.tenderTemplates = draft.tenderTemplates.filter(
            (t) => String(t.id) !== String(2)
          );
        });

        const result = tenderTemplateReducer(stateWithTemplates, action);
        expect(result).toEqual(expectedState);
        expect(result.tenderTemplates).toHaveLength(2);
        expect(result.tenderTemplates.find(t => t.id === 2)).toBeUndefined();
      });

      it('should handle string and number id comparison correctly', () => {
        const templates = [
          { id: '1', name: 'Template 1' },
          { id: 2, name: 'Template 2' },
        ];
        const stateWithTemplates = {
          ...initialState,
          tenderTemplates: templates,
        };

        const action = deleteTenderTemplate.fulfilled(
          { success: true, id: '2' },
          'delete-request-2',
          { did: 2 }
        );

        const result = tenderTemplateReducer(stateWithTemplates, action);
        expect(result.tenderTemplates).toHaveLength(1);
        expect(result.tenderTemplates[0].id).toBe('1');
      });

      it('should not remove template when payload.success is false', () => {
        const templates = [
          { id: 1, name: 'Template 1' },
          { id: 2, name: 'Template 2' },
        ];
        const stateWithTemplates = {
          ...initialState,
          tenderTemplates: templates,
        };

        const action = deleteTenderTemplate.fulfilled(
          { success: false, id: 1 },
          'delete-request-3',
          { did: 1 }
        );

        const result = tenderTemplateReducer(stateWithTemplates, action);
        expect(result.tenderTemplates).toHaveLength(2);
        expect(result.status).toBe('succeeded');
      });

      it('should handle payload without success property', () => {
        const templates = [{ id: 1, name: 'Template 1' }];
        const stateWithTemplates = {
          ...initialState,
          tenderTemplates: templates,
        };

        const action = deleteTenderTemplate.fulfilled(
          { id: 1 },
          'delete-request-4',
          { did: 1 }
        );

        const result = tenderTemplateReducer(stateWithTemplates, action);
        expect(result.tenderTemplates).toHaveLength(1);
        expect(result.status).toBe('succeeded');
      });

      it('should handle deletion of non-existent template gracefully', () => {
        const templates = [{ id: 1, name: 'Template 1' }];
        const stateWithTemplates = {
          ...initialState,
          tenderTemplates: templates,
        };

        const action = deleteTenderTemplate.fulfilled(
          { success: true, id: 999 },
          'delete-request-5',
          { did: 999 }
        );

        const result = tenderTemplateReducer(stateWithTemplates, action);
        expect(result.tenderTemplates).toHaveLength(1);
        expect(result.status).toBe('succeeded');
      });
    });

    describe('rejected', () => {
      it('should set error state when delete is rejected', () => {
        const errorMessage = 'Deletion failed';
        const action = {
          type: deleteTenderTemplate.rejected.type,
          error: { message: errorMessage },
        };

        const expectedState = produce(initialState, (draft) => {
          draft.status = 'error';
          draft.error = errorMessage;
        });

        const result = tenderTemplateReducer(initialState, action);
        expect(result).toEqual(expectedState);
      });

      it('should use default error message when no error message provided', () => {
        const action = {
          type: deleteTenderTemplate.rejected.type,
          error: {},
        };

        const result = tenderTemplateReducer(initialState, action);
        expect(result.error).toBe('Failed to delete template');
        expect(result.status).toBe('error');
      });

      it('should preserve existing templates when deletion fails', () => {
        const templates = [{ id: 1, name: 'Template 1' }];
        const stateWithTemplates = {
          ...initialState,
          tenderTemplates: templates,
        };

        const action = {
          type: deleteTenderTemplate.rejected.type,
          error: { message: 'Deletion failed' },
        };

        const result = tenderTemplateReducer(stateWithTemplates, action);
        expect(result.tenderTemplates).toEqual(templates);
        expect(result.status).toBe('error');
      });
    });
  });

  describe('integration tests', () => {
    it('should handle complex workflow of create, fetch, and delete', () => {
      let state = initialState;

      // Start creating
      state = tenderTemplateReducer(state, {
        type: createTenderTemplate.pending.type,
      });
      expect(state.status).toBe('creating');

      // Create succeeds
      state = tenderTemplateReducer(state, {
        type: createTenderTemplate.fulfilled.type,
        payload: { success: true, data: { id: 1, name: 'Created Template' } },
      });
      expect(state.tenderTemplates).toHaveLength(1);
      expect(state.status).toBe('succeeded');

      // Fetch more templates
      state = tenderTemplateReducer(state, {
        type: fetchTenderTemplates.fulfilled.type,
        payload: {
          data: [
            { id: 1, name: 'Created Template' },
            { id: 2, name: 'Existing Template' },
          ],
        },
      });
      expect(state.tenderTemplates).toHaveLength(2);

      // Delete one template
      state = tenderTemplateReducer(
        state,
        deleteTenderTemplate.fulfilled(
          { success: true, id: 1 },
          'delete-request-6',
          { did: 1 }
        )
      );
      expect(state.tenderTemplates).toHaveLength(1);
      expect(state.tenderTemplates[0].id).toBe(2);
    });

    it('should handle error recovery scenarios', () => {
      let state = initialState;

      // Failed fetch
      state = tenderTemplateReducer(state, {
        type: fetchTenderTemplates.rejected.type,
        error: { message: 'Network error' },
      });
      expect(state.status).toBe('error');
      expect(state.error).toBe('Network error');

      // Successful retry
      state = tenderTemplateReducer(state, {
        type: fetchTenderTemplates.pending.type,
      });
      expect(state.error).toBeNull();
      expect(state.status).toBe('loading');

      state = tenderTemplateReducer(state, {
        type: fetchTenderTemplates.fulfilled.type,
        payload: { data: [{ id: 1, name: 'Template' }] },
      });
      expect(state.status).toBe('succeeded');
      expect(state.tenderTemplates).toHaveLength(1);
    });
  });
});
