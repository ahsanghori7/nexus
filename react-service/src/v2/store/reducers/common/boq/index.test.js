import reducer, {
  setSelectedEntries,
  setEditingMode,
  setEditingQuoteMode,
  setEntitySaved,
  setPackageNote,
  setSubmitQuoteVars,
  setLocalLoadQuotes,
  clearAiGenerationResult,
  clearAiGenerationForPackage,
} from './index';
import {
  fetchBoQList,
  fetchProjectStatuses,
  fetchGenerateBoqStatus,
  generateBoqWithAI,
  updateEntity,
} from './asyncThunk';
import statusConstants from 'store/reducers/common/constants';

describe('common boq reducer', () => {
  const initialState = {
    units: [],
    entity: null,
    entities: [],
    uiLoading: {
      boqList: false,
      updateEntityById: {},
      newBoqResetById: {},
      publishById: {},
      aiPollById: {},
    },
    aiGenerationById: {},
    aiPollGenerationById: {},
    aiRehydrationSkippedById: {},
    aiGetPollStickyById: {},
    editing: false,
    published: false,
    loadedQuotes: false,
    quotes: [],
    projectStatuses: null,
    note: {},
    error: null,
    orderTemplates: [],
    loading: {
      severity: '',
      message: 'Loading',
      type: statusConstants.IDLE_STATUS,
    },
    editingQuote: false,
    nextEntries: [],
    readyAfterTemplate: false,
    quoteHistory: [],
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual(initialState);
  });

  describe('setSelectedEntries', () => {
    it('should update nextEntries for a specific entity when id is provided', () => {
      const stateWithEntities = {
        ...initialState,
        entities: [{ id: 1, nextEntries: [] }, { id: 2, nextEntries: [] }],
      };
      const newRows = [{ item: 'A' }];
      const action = setSelectedEntries({ id: 1, rows: newRows });
      const newState = reducer(stateWithEntities, action);
      expect(newState.entities[0].nextEntries).toEqual(newRows);
      expect(newState.entities[1].nextEntries).toEqual([]);
    });

    it('should update nextEntries for the main entity when no id is provided', () => {
      const stateWithEntity = {
        ...initialState,
        entity: { id: 100, nextEntries: [] },
      };
      const newRows = [{ item: 'B' }];
      const action = setSelectedEntries({ rows: newRows });
      const newState = reducer(stateWithEntity, action);
      expect(newState.entity.nextEntries).toEqual(newRows);
    });

    it('should handle empty rows array', () => {
      const stateWithEntity = {
        ...initialState,
        entity: { id: 100, nextEntries: [{ item: 'old' }] },
      };
      const newRows = [];
      const action = setSelectedEntries({ rows: newRows });
      const newState = reducer(stateWithEntity, action);
      expect(newState.entity.nextEntries).toEqual(newRows);
    });
  });

  describe('setEditingMode', () => {
    it('should set editing mode for a specific entity and update readyAfterTemplate', () => {
      const stateWithEntities = {
        ...initialState,
        entities: [{ id: 1, editing: false }, { id: 2, editing: false }],
        readyAfterTemplate: false,
      };
      const action = setEditingMode({ id: 1, value: true, excel: true });
      const newState = reducer(stateWithEntities, action);
      expect(newState.entities[0].editing).toBe(true);
      expect(newState.entities[1].editing).toBe(false);
      expect(newState.readyAfterTemplate).toBe(true);
    });

    it('should set editing mode to false', () => {
      const stateWithEntities = {
        ...initialState,
        entities: [{ id: 1, editing: true }],
        readyAfterTemplate: true,
      };
      const action = setEditingMode({ id: 1, value: false, excel: false });
      const newState = reducer(stateWithEntities, action);
      expect(newState.entities[0].editing).toBe(false);
      expect(newState.readyAfterTemplate).toBe(false);
    });
  });

  describe('setEditingQuoteMode', () => {
    it('should set editingQuote to true', () => {
      const action = setEditingQuoteMode({ value: true });
      const newState = reducer(initialState, action);
      expect(newState.editingQuote).toBe(true);
    });

    it('should set editingQuote to false', () => {
      const stateWithEditingQuote = { ...initialState, editingQuote: true };
      const action = setEditingQuoteMode({ value: false });
      const newState = reducer(stateWithEditingQuote, action);
      expect(newState.editingQuote).toBe(false);
    });
  });

  describe('setEntitySaved', () => {
    it('should set the saved status for a specific entity', () => {
      const stateWithEntities = {
        ...initialState,
        entities: [{ id: 1, saved: false }, { id: 2, saved: false }],
      };
      const action = setEntitySaved({ eid: 1, value: true });
      const newState = reducer(stateWithEntities, action);
      expect(newState.entities[0].saved).toBe(true);
      expect(newState.entities[1].saved).toBe(false);
    });

    it('should not modify other entities', () => {
      const stateWithEntities = {
        ...initialState,
        entities: [{ id: 1, saved: false }, { id: 2, saved: false }],
      };
      const action = setEntitySaved({ eid: 3, value: true }); // Non-existent ID
      const newState = reducer(stateWithEntities, action);
      expect(newState.entities[0].saved).toBe(false);
      expect(newState.entities[1].saved).toBe(false);
    });
  });

  describe('setPackageNote', () => {
    it('should set the nextNote for a specific entity', () => {
      const stateWithEntities = {
        ...initialState,
        entities: [{ id: 1, nextNote: 'old note' }, { id: 2, nextNote: 'another note' }],
      };
      const newNote = 'updated note';
      const action = setPackageNote({ eid: 1, newNote });
      const newState = reducer(stateWithEntities, action);
      expect(newState.entities[0].nextNote).toBe(newNote);
      expect(newState.entities[1].nextNote).toBe('another note');
    });

    it('should not modify other entities when eid does not match', () => {
      const stateWithEntities = {
        ...initialState,
        entities: [{ id: 1, nextNote: 'old note' }],
      };
      const newNote = 'updated note';
      const action = setPackageNote({ eid: 99, newNote });
      const newState = reducer(stateWithEntities, action);
      expect(newState.entities[0].nextNote).toBe('old note');
    });
  });

  describe('setSubmitQuoteVars', () => {
    it('should update a property in the main entity if it exists', () => {
      const stateWithEntity = {
        ...initialState,
        entity: { id: 100, someKey: 'oldValue' },
      };
      const action = setSubmitQuoteVars({ key: 'someKey', value: 'newValue' });
      const newState = reducer(stateWithEntity, action);
      expect(newState.entity.someKey).toBe('newValue');
    });

    it('should not update a property if the key does not exist in the main entity', () => {
      const stateWithEntity = {
        ...initialState,
        entity: { id: 100, someKey: 'oldValue' },
      };
      const action = setSubmitQuoteVars({ key: 'nonExistentKey', value: 'newValue' });
      const newState = reducer(stateWithEntity, action);
      expect(newState.entity.someKey).toBe('oldValue');
      expect(newState.entity.nonExistentKey).toBeUndefined();
    });

    it('should not update if entity is null', () => {
      const action = setSubmitQuoteVars({ key: 'someKey', value: 'newValue' });
      const newState = reducer(initialState, action);
      expect(newState.entity).toBeNull();
    });
  });

  describe('setLocalLoadQuotes', () => {
    it('should set loadedQuotes to true', () => {
      const action = setLocalLoadQuotes(true);
      const newState = reducer(initialState, action);
      expect(newState.loadedQuotes).toBe(true);
    });

    it('should set loadedQuotes to false', () => {
      const stateWithLoadedQuotes = { ...initialState, loadedQuotes: true };
      const action = setLocalLoadQuotes(false);
      const newState = reducer(stateWithLoadedQuotes, action);
      expect(newState.loadedQuotes).toBe(false);
    });

    it('should handle undefined payload by setting to false', () => {
      const action = setLocalLoadQuotes(undefined);
      const newState = reducer(initialState, action);
      expect(newState.loadedQuotes).toBe(false);
    });
  });

  describe('fetchGenerateBoqStatus', () => {
    it('rejected with HTTP 404 sets NOT_FOUND and does not set error', () => {
      const action = {
        type: fetchGenerateBoqStatus.rejected.type,
        meta: { arg: { packageId: 3 } },
        error: { message: 'Rejected' },
        payload: { message: 'Not Found', status: 404 },
      };
      const newState = reducer(initialState, action);
      expect(newState.aiGenerationById[3].status).toBe('NOT_FOUND');
      expect(newState.aiGenerationById[3].error).toBeUndefined();
    });

    it('rejected with HTTP 500 sets sticky even if body mentions NOT_FOUND (status code is authoritative)', () => {
      const action = {
        type: fetchGenerateBoqStatus.rejected.type,
        meta: { arg: { packageId: 3 } },
        error: { message: 'Rejected' },
        payload: {
          message: 'error',
          status: 500,
          details: { error: { code: 'NOT_FOUND', message: 'No BoQ job' } },
        },
      };
      const newState = reducer(initialState, action);
      expect(newState.aiGenerationById[3]).toBeUndefined();
      expect(newState.aiGetPollStickyById[3]).toBe(true);
    });

    it('rejected with string status "404" coerces to NOT_FOUND', () => {
      const action = {
        type: fetchGenerateBoqStatus.rejected.type,
        meta: { arg: { packageId: 3 } },
        error: { message: 'Rejected' },
        payload: { message: 'x', status: '404' },
      };
      const newState = reducer(initialState, action);
      expect(newState.aiGenerationById[3].status).toBe('NOT_FOUND');
      expect(newState.aiGetPollStickyById[3]).toBeUndefined();
    });

    it('rejected with HTTP 503 (QSAI unreachable) clears AI state and sets sticky snackbar flag', () => {
      const action = {
        type: fetchGenerateBoqStatus.rejected.type,
        meta: { arg: { packageId: 9 } },
        error: { message: 'Rejected' },
        payload: { message: 'Service Unavailable', status: 503 },
      };
      const newState = reducer(initialState, action);
      expect(newState.aiGenerationById[9]).toBeUndefined();
      expect(newState.aiRehydrationSkippedById[9]).toBe(true);
      expect(newState.aiGetPollStickyById[9]).toBe(true);
    });

    it('rejected with HTTP 500 clears AI state and sets sticky snackbar flag', () => {
      const action = {
        type: fetchGenerateBoqStatus.rejected.type,
        meta: { arg: { packageId: 7 } },
        error: { message: 'Rejected' },
        payload: { message: 'Server Error', status: 500 },
      };
      const newState = reducer(initialState, action);
      expect(newState.aiGenerationById[7]).toBeUndefined();
      expect(newState.aiRehydrationSkippedById[7]).toBe(true);
      expect(newState.aiGetPollStickyById[7]).toBe(true);
    });

    it('rejected with HTTP 403 clears AI state without sticky snackbar flag', () => {
      const action = {
        type: fetchGenerateBoqStatus.rejected.type,
        meta: { arg: { packageId: 7 } },
        error: { message: 'Rejected' },
        payload: { message: 'Forbidden', status: 403 },
      };
      const newState = reducer(initialState, action);
      expect(newState.aiGenerationById[7]).toBeUndefined();
      expect(newState.aiRehydrationSkippedById[7]).toBe(true);
      expect(newState.aiGetPollStickyById[7]).toBeUndefined();
    });

    it('fulfilled with JSON payload clears sticky flag for package', () => {
      const state = {
        ...initialState,
        aiGetPollStickyById: { 9: true },
        aiGenerationById: { 9: { status: 'PENDING' } },
      };
      const action = {
        type: fetchGenerateBoqStatus.fulfilled.type,
        meta: { arg: { packageId: 9 } },
        payload: { data: { status: 'PENDING', current_step: 1, total_steps: 3 } },
      };
      const newState = reducer(state, action);
      expect(newState.aiGetPollStickyById[9]).toBeUndefined();
    });

    it('fulfilled does not overwrite POST Smart Builder ERROR (late GET NOT_FOUND)', () => {
      const state = {
        ...initialState,
        uiLoading: { ...initialState.uiLoading, aiPollById: { 17: true } },
        aiGenerationById: {
          17: {
            status: 'ERROR',
            error: 'Internal Server Error',
            errorSource: 'POST',
          },
        },
      };
      const action = {
        type: fetchGenerateBoqStatus.fulfilled.type,
        meta: { arg: { packageId: 17 } },
        payload: { data: { status: 'NOT_FOUND' } },
      };
      const newState = reducer(state, action);
      expect(newState.aiGenerationById[17].status).toBe('ERROR');
      expect(newState.aiGenerationById[17].error).toBe('Internal Server Error');
      expect(newState.aiGenerationById[17].errorSource).toBe('POST');
      expect(newState.uiLoading.aiPollById[17]).toBeUndefined();
    });

    it('rejected does not overwrite POST Smart Builder ERROR (late GET 404)', () => {
      const state = {
        ...initialState,
        uiLoading: { ...initialState.uiLoading, aiPollById: { 17: true } },
        aiGenerationById: {
          17: {
            status: 'ERROR',
            error: 'Internal Server Error',
            errorSource: 'POST',
          },
        },
      };
      const action = {
        type: fetchGenerateBoqStatus.rejected.type,
        meta: { arg: { packageId: 17 } },
        error: { message: 'Rejected' },
        payload: { message: 'Not Found', status: 404 },
      };
      const newState = reducer(state, action);
      expect(newState.aiGenerationById[17].status).toBe('ERROR');
      expect(newState.aiGenerationById[17].error).toBe('Internal Server Error');
      expect(newState.uiLoading.aiPollById[17]).toBeUndefined();
    });

    it('rejected with stale pollGeneration does not overwrite current AI state', () => {
      const state = {
        ...initialState,
        aiPollGenerationById: { 3: 2 },
        aiGenerationById: { 3: { status: 'PENDING' } },
      };
      const action = {
        type: fetchGenerateBoqStatus.rejected.type,
        meta: { arg: { packageId: 3, pollGeneration: 1 } },
        error: { message: 'Rejected' },
        payload: { message: 'Not Found', status: 404 },
      };
      const newState = reducer(state, action);
      expect(newState.aiGenerationById[3].status).toBe('PENDING');
    });

    it('fulfilled with stale pollGeneration is ignored', () => {
      const state = {
        ...initialState,
        aiPollGenerationById: { 9: 2 },
        aiGenerationById: { 9: { status: 'PENDING' } },
      };
      const action = {
        type: fetchGenerateBoqStatus.fulfilled.type,
        meta: { arg: { packageId: 9, pollGeneration: 1 } },
        payload: { data: { status: 'NOT_FOUND' } },
      };
      const newState = reducer(state, action);
      expect(newState.aiGenerationById[9].status).toBe('PENDING');
    });
  });

  describe('fetchBoQList', () => {
    it('fulfilled restores AI SUCCESS draft when project list has no entries', () => {
      const state = {
        ...initialState,
        units: [{ symbol: 'm2', value: 10 }],
        aiGenerationById: {
          2: {
            status: 'SUCCESS',
            result: {
              entries: [
                {
                  type: 'item',
                  item_no: '1',
                  description: 'AI line',
                  quantity: 1,
                  budget_rate: 10,
                  budget_total: 10,
                  unit: 'm2',
                },
              ],
              notes: { text: 'AI note' },
            },
          },
        },
      };
      const action = {
        type: fetchBoQList.fulfilled.type,
        payload: {
          data: [
            {
              id: 2,
              entries: [],
              note: { id: 1, text: 'server note' },
              has_published_version: false,
              tender: { id: 5, label: 'Pkg' },
            },
          ],
        },
      };
      const newState = reducer(state, action);
      expect(newState.entities[0].entries).toEqual([]);
      expect(newState.entities[0].nextEntries).toHaveLength(1);
      expect(newState.entities[0].nextEntries[0].description).toBe('AI line');
      expect(newState.entities[0].nextNote.text).toBe('AI note');
      expect(newState.entities[0].editing).toBe(true);
    });

    it('fulfilled keeps editing true when published package has draft-only rows', () => {
      const state = {
        ...initialState,
        projectStatuses: { published: { id: 99 } },
      };
      const action = {
        type: fetchBoQList.fulfilled.type,
        payload: {
          data: [
            {
              id: 2,
              entries: [
                {
                  type: 'item',
                  position: 1,
                  item_version: { status: 2, version: 1 },
                  budget_rate: 0,
                  budget_total: 0,
                  quantity: 0,
                },
              ],
              note: { id: 1, text: '' },
              has_published_version: true,
              tender: { id: 5, label: 'Pkg' },
            },
          ],
        },
      };
      const newState = reducer(state, action);
      expect(newState.entities[0].editing).toBe(true);
    });

    it('fulfilled clears busy flags only for releaseBusyForPackageId', () => {
      const state = {
        ...initialState,
        uiLoading: {
          ...initialState.uiLoading,
          updateEntityById: { 1: true, 2: true },
          newBoqResetById: { 1: true },
        },
      };
      const action = {
        type: fetchBoQList.fulfilled.type,
        meta: { arg: { slug: 'proj', releaseBusyForPackageId: 1 } },
        payload: { data: [] },
      };
      const newState = reducer(state, action);
      expect(newState.uiLoading.updateEntityById).toEqual({ 2: true });
      expect(newState.uiLoading.newBoqResetById).toEqual({});
    });

    it('fulfilled keeps published packages read-only when project statuses are not loaded yet', () => {
      const action = {
        type: fetchBoQList.fulfilled.type,
        payload: {
          data: [
            {
              id: 2,
              entries: [
                {
                  type: 'item',
                  position: 1,
                  item_version: { status: 99, version: 1 },
                  budget_rate: 10,
                  budget_total: 10,
                  quantity: 1,
                },
              ],
              note: { id: 1, text: '' },
              has_published_version: true,
              tender: { id: 5, label: 'Pkg' },
            },
          ],
        },
      };
      const newState = reducer(initialState, action);
      expect(newState.entities[0].editing).toBe(false);
    });
  });

  describe('fetchProjectStatuses', () => {
    it('fulfilled re-resolves entity editing after statuses load', () => {
      const state = {
        ...initialState,
        entities: [
          {
            id: 2,
            entries: [
              {
                type: 'item',
                item_version: { status: 2, version: 1 },
              },
            ],
            nextEntries: [
              {
                type: 'item',
                item_version: { status: 2, version: 1 },
              },
            ],
            has_published_version: true,
            editing: false,
          },
        ],
      };
      const action = {
        type: fetchProjectStatuses.fulfilled.type,
        payload: {
          data: [
            { label: 'published', id: 99 },
            { label: 'draft', id: 2 },
          ],
        },
      };
      const newState = reducer(state, action);
      expect(newState.entities[0].editing).toBe(true);
    });
  });

  describe('updateEntity', () => {
    it('fulfilled with string (v1 httpHelper HTTP error) clears AI GET sticky and does not apply entity patch', () => {
      const state = {
        ...initialState,
        entities: [{ id: 2, entries: [{ id: 'a' }], note: {} }],
        aiGetPollStickyById: { 2: true },
      };
      const action = {
        type: updateEntity.fulfilled.type,
        meta: {
          arg: {
            id: 2,
            data: { entries: [{ id: 'b' }], notes: { text: 'n' } },
          },
        },
        payload: 'Not Found',
      };
      const newState = reducer(state, action);
      expect(newState.aiGetPollStickyById[2]).toBeUndefined();
      expect(newState.loading.type).toBe(statusConstants.FAILURE_STATUS);
      expect(newState.entities[0].entries).toEqual([{ id: 'a' }]);
    });

    it('rejected clears AI GET sticky for entity id', () => {
      const state = {
        ...initialState,
        aiGetPollStickyById: { 2: true },
      };
      const action = {
        type: updateEntity.rejected.type,
        meta: { arg: { id: 2, data: {} } },
        error: { message: 'fail' },
      };
      const newState = reducer(state, action);
      expect(newState.aiGetPollStickyById[2]).toBeUndefined();
    });
  });

  describe('generateBoqWithAI', () => {
    it('fulfilled with string payload sets ERROR (v1 httpHelper non-2xx)', () => {
      const action = {
        type: generateBoqWithAI.fulfilled.type,
        meta: { arg: { packageId: 9 } },
        payload: 'Internal Server Error',
      };
      const newState = reducer(initialState, action);
      expect(newState.aiGenerationById[9].status).toBe('ERROR');
      expect(newState.aiGenerationById[9].error).toBe('Internal Server Error');
    });

    it('pending clears aiRehydrationSkippedById for package', () => {
      const state = {
        ...initialState,
        aiRehydrationSkippedById: { 9: true },
      };
      const action = {
        type: generateBoqWithAI.pending.type,
        meta: { arg: { packageId: 9 } },
      };
      const newState = reducer(state, action);
      expect(newState.aiRehydrationSkippedById[9]).toBeUndefined();
      expect(newState.aiGenerationById[9].status).toBe('PENDING');
      expect(newState.aiGenerationById[9].error).toBeNull();
      expect(newState.aiGenerationById[9].errorSource).toBeNull();
      expect(newState.aiPollGenerationById[9]).toBe(1);
    });

    it('pending clears GET-poll sticky flag for package', () => {
      const state = {
        ...initialState,
        aiGetPollStickyById: { 9: true },
      };
      const action = {
        type: generateBoqWithAI.pending.type,
        meta: { arg: { packageId: 9 } },
      };
      const newState = reducer(state, action);
      expect(newState.aiGetPollStickyById[9]).toBeUndefined();
    });

    it('rejected sets ERROR on aiGenerationById', () => {
      const action = {
        type: generateBoqWithAI.rejected.type,
        meta: { arg: { packageId: 9 } },
        error: { message: 'Network' },
        payload: { message: 'Server error', status: 500 },
      };
      const newState = reducer(initialState, action);
      expect(newState.aiGenerationById[9].status).toBe('ERROR');
      expect(newState.aiGenerationById[9].error).toBe('Server error');
    });
  });

  describe('clearAiGenerationForPackage', () => {
    it('removes AI state and sets skip rehydration flag', () => {
      const state = {
        ...initialState,
        aiGenerationById: { 9: { status: 'ERROR', error: 'x' } },
      };
      const newState = reducer(
        state,
        clearAiGenerationForPackage({ packageId: 9 })
      );
      expect(newState.aiGenerationById[9]).toBeUndefined();
      expect(newState.aiRehydrationSkippedById[9]).toBe(true);
      expect(newState.aiPollGenerationById[9]).toBe(1);
    });

    it('clears GET-poll sticky flag for package', () => {
      const state = {
        ...initialState,
        aiGetPollStickyById: { 9: true },
      };
      const newState = reducer(
        state,
        clearAiGenerationForPackage({ packageId: 9 })
      );
      expect(newState.aiGetPollStickyById[9]).toBeUndefined();
    });
  });

  describe('clearAiGenerationResult', () => {
    it('clears stored AI result but preserves status', () => {
      const state = {
        ...initialState,
        aiGenerationById: {
          17: { status: 'SUCCESS', result: { entries: [{ type: 'item' }] } },
        },
      };
      const newState = reducer(state, clearAiGenerationResult({ packageId: 17 }));
      expect(newState.aiGenerationById[17].status).toBe('SUCCESS');
      expect(newState.aiGenerationById[17].result).toBeNull();
    });

    it('is a no-op for unknown packageId', () => {
      const state = {
        ...initialState,
        aiGenerationById: {
          1: { status: 'SUCCESS', result: { entries: [] } },
        },
      };
      const newState = reducer(state, clearAiGenerationResult({ packageId: 999 }));
      expect(newState).toEqual(state);
    });
  });
});
