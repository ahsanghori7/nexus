import extraReducers, {
  fetchBoQList,
  fetchBoQQuotes,
  fetchUnits,
  fetchProjectStatuses,
  createEntity,
  updateEntity,
  fetchOrderTemplates,
  fetchQuoteHistory,
} from './extraReducers';
import statusConstants from 'store/reducers/common/constants';

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}));

describe('common boq extraReducers', () => {
  let mockState;

  beforeEach(() => {
    mockState = {
      units: [],
      entity: null,
      entities: [],
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
  });

  describe('fetchBoQList actions', () => {
    it('should handle pending state', () => {
      extraReducers[fetchBoQList.pending](mockState);
      
      expect(mockState.loading).toEqual({
        severity: 'info',
        message: 'Loading BoQ list',
        type: statusConstants.LOADING_STATUS,
      });
    });

    it('should handle fulfilled state with valid data', () => {
      const payload = {
        data: [
          {
            id: 1,
            note: 'Test note',
            has_published_version: false,
            tender: {
              id: 101,
              label: 'Test Tender'
            },
            entries: [
              {
                position: 2,
                budget_rate: '10.50',
                budget_total: '100.00',
                quantity: '5'
              },
              {
                position: 1,
                budget_rate: '',
                budget_total: '',
                quantity: ''
              }
            ]
          }
        ]
      };
      const action = { payload };
      
      extraReducers[fetchBoQList.fulfilled](mockState, action);
      
      expect(mockState.entities).toHaveLength(1);
      expect(mockState.entities[0]).toMatchObject({
        id: 1,
        tid: 101,
        label: 'Test Tender',
        editing: true,
        saved: false,
        nextNote: 'Test note'
      });
      
      // Check entries are sorted by position
      expect(mockState.entities[0].entries[0].position).toBe(1);
      expect(mockState.entities[0].entries[1].position).toBe(2);
      
      // Check numeric fields are processed correctly
      expect(mockState.entities[0].entries[1].budget_rate).toBe('10.50');
      expect(mockState.entities[0].entries[0].budget_rate).toBe('');
      
      expect(mockState.loading).toEqual({
        severity: false,
        message: '',
        type: statusConstants.IDLE_STATUS,
      });
    });

    it('should handle fulfilled state with null payload', () => {
      const action = { payload: null };
      
      extraReducers[fetchBoQList.fulfilled](mockState, action);
      
      expect(mockState.loading).toEqual({
        severity: false,
        message: '',
        type: statusConstants.IDLE_STATUS,
      });
    });

    it('should handle rejected state', () => {
      extraReducers[fetchBoQList.rejected](mockState);
      
      expect(mockState.loading).toEqual({
        severity: 'error',
        message: 'Loading BoQ list failed',
        type: statusConstants.FAILURE_STATUS,
      });
    });

    it('fulfilled clears updateEntityById only for releaseBusyForPackageId', () => {
      mockState.uiLoading = {
        boqList: true,
        updateEntityById: { 1: true, 2: true },
        newBoqResetById: { 1: true, 2: true },
      };
      extraReducers[fetchBoQList.fulfilled](mockState, {
        payload: null,
        meta: { arg: { slug: 'proj', releaseBusyForPackageId: 1 } },
      });
      expect(mockState.uiLoading.updateEntityById).toEqual({ 2: true });
      expect(mockState.uiLoading.newBoqResetById).toEqual({ 2: true });
    });

    it('fulfilled does not clear updateEntityById without releaseBusyForPackageId', () => {
      mockState.uiLoading = {
        boqList: true,
        updateEntityById: { 1: true, 2: true },
        newBoqResetById: { 1: true },
      };
      extraReducers[fetchBoQList.fulfilled](mockState, {
        payload: null,
        meta: { arg: 'proj' },
      });
      expect(mockState.uiLoading.updateEntityById).toEqual({ 1: true, 2: true });
      expect(mockState.uiLoading.newBoqResetById).toEqual({ 1: true });
    });
  });

  describe('fetchBoQQuotes actions', () => {
    beforeEach(() => {
      mockState.entity = {
        id: 1,
        entries: [
          { id: 1, name: 'Entry 1' },
          { id: 2, name: 'Entry 2' }
        ]
      };
    });

    it('should handle pending state', () => {
      extraReducers[fetchBoQQuotes.pending](mockState);
      
      expect(mockState.loading).toEqual({
        severity: 'info',
        message: 'Loading BoQ Quotes',
        type: statusConstants.LOADING_STATUS,
      });
    });

    it('should handle fulfilled state with valid data', () => {
      const payload = {
        data: [
          {
            note: 'Quote exclusion note',
            quote: [
              {
                id: 1,
                entry_id: 1,
                rate: 15.00,
                quantity: 10,
                total: 150.00,
                note: 'Quote note 1'
              },
              {
                id: 2,
                entry_id: 2,
                rate: 25.00,
                quantity: 5,
                total: 125.00,
                note: 'Quote note 2'
              }
            ]
          }
        ]
      };
      const action = { payload };
      
      extraReducers[fetchBoQQuotes.fulfilled](mockState, action);
      
      expect(mockState.loadedQuotes).toBe(true);
      expect(mockState.quotes).toEqual(payload.data);
      expect(mockState.entity.quote_exclusion).toBe('Quote exclusion note');
      
      // Check that entries are updated - the actual behavior sets rate to empty string
      expect(mockState.entity.entries[0].rate).toBe('');
      expect(mockState.entity.entries[1].rate).toBe('');
    });

    it('should handle fulfilled state with empty quotes', () => {
      const payload = {
        data: []
      };
      const action = { payload };
      
      extraReducers[fetchBoQQuotes.fulfilled](mockState, action);
      
      expect(mockState.loadedQuotes).toBe(true);
      expect(mockState.quotes).toEqual([]);
      expect(mockState.entity.quote_exclusion).toBe('');
    });

    it('should handle fulfilled state with null payload', () => {
      const action = { payload: null };
      
      extraReducers[fetchBoQQuotes.fulfilled](mockState, action);
      
      expect(mockState.loadedQuotes).toBe(false);
    });
  });

  describe('fetchUnits actions', () => {
    it('should handle fulfilled state', () => {
      const payload = {
        data: [
          { id: 1, name: 'kg', symbol: 'kg' },
          { id: 2, name: 'meter', symbol: 'm' }
        ]
      };
      const action = { payload };
      
      extraReducers[fetchUnits.fulfilled](mockState, action);
      
      expect(mockState.units).toEqual([
        { id: 1, name: 'kg', symbol: 'kg', value: 1, label: 'kg' },
        { id: 2, name: 'meter', symbol: 'm', value: 2, label: 'm' }
      ]);
    });

    it('should handle fulfilled state with null payload', () => {
      const action = { payload: null };
      
      extraReducers[fetchUnits.fulfilled](mockState, action);
      
      expect(mockState.units).toEqual([]);
    });
  });

  describe('fetchProjectStatuses actions', () => {
    it('should handle fulfilled state', () => {
      const payload = {
        data: [
          { label: 'active', name: 'Active' },
          { label: 'completed', name: 'Completed' },
          { label: 'pending', name: 'Pending' }
        ]
      };
      const action = { payload };
      
      extraReducers[fetchProjectStatuses.fulfilled](mockState, action);
      
      expect(mockState.projectStatuses).toEqual({
        active: { label: 'active', name: 'Active' },
        completed: { label: 'completed', name: 'Completed' },
        pending: { label: 'pending', name: 'Pending' }
      });
    });
  });

  describe('createEntity actions', () => {
    it('should handle pending state (no-op)', () => {
      const originalLoading = { ...mockState.loading };
      extraReducers[createEntity.pending](mockState);
      
      // This action is a no-op, so state should remain unchanged
      expect(mockState.loading).toEqual(originalLoading);
    });

    it('should handle fulfilled state (no-op)', () => {
      const originalEntity = mockState.entity;
      const payload = {
        data: {
          id: 1,
          name: 'New BoQ',
          entries: []
        }
      };
      const action = { payload };
      
      extraReducers[createEntity.fulfilled](mockState, action);
      
      // This action is a no-op, so entity should remain unchanged
      expect(mockState.entity).toBe(originalEntity);
    });

    it('should handle rejected state (no-op)', () => {
      const originalLoading = { ...mockState.loading };
      extraReducers[createEntity.rejected](mockState);
      
      // This action is a no-op, so state should remain unchanged
      expect(mockState.loading).toEqual(originalLoading);
    });
  });

  describe('fetchOrderTemplates actions', () => {
    it('should handle pending state (no-op)', () => {
      const originalLoading = { ...mockState.loading };
      extraReducers[fetchOrderTemplates.pending](mockState);
      
      // This action is a no-op, so state should remain unchanged
      expect(mockState.loading).toEqual(originalLoading);
    });

    it('should handle fulfilled state', () => {
      const payload = [
        { id: 1, name: 'Template 1' },
        { id: 2, name: 'Template 2' }
      ];
      const action = { payload };
      
      extraReducers[fetchOrderTemplates.fulfilled](mockState, action);
      
      expect(mockState.orderTemplates).toEqual([
        { id: 1, name: 'Template 1' },
        { id: 2, name: 'Template 2' }
      ]);
    });

    it('should handle rejected state (no-op)', () => {
      const originalLoading = { ...mockState.loading };
      extraReducers[fetchOrderTemplates.rejected](mockState);
      
      // This action is a no-op, so state should remain unchanged
      expect(mockState.loading).toEqual(originalLoading);
    });
  });

  describe('fetchQuoteHistory actions', () => {
    it('should handle fulfilled state', () => {
      const payload = {
        data: [
          { id: 1, date: '2023-01-01', note: 'History 1' },
          { id: 2, date: '2023-01-02', note: 'History 2' }
        ]
      };
      const action = { payload };
      
      extraReducers[fetchQuoteHistory.fulfilled](mockState, action);
      
      expect(mockState.quoteHistory).toEqual([
        { id: 1, date: '2023-01-01', note: 'History 1' },
        { id: 2, date: '2023-01-02', note: 'History 2' }
      ]);
    });
  });

  describe('updateEntity actions', () => {
    it('should handle pending state', () => {
      extraReducers[updateEntity.pending](mockState);

      expect(mockState.loading).toEqual({
        severity: 'info',
        message: 'Updating BoQ Entity',
        type: statusConstants.LOADING_STATUS,
      });
    });

    it('should handle fulfilled state and mark entries edited + ensure ids', () => {
      mockState.entities = [
        {
          id: 1,
          note: { id: 10, text: 'old' },
          entries: [],
        },
      ];
      const action = {
        meta: {
          arg: {
            id: 1,
            data: {
              notes: { text: 'new note' },
              entries: [{ id: null, description: 'A' }],
            },
          },
        },
      };

      extraReducers[updateEntity.fulfilled](mockState, action);

      expect(mockState.entities[0].entries).toHaveLength(1);
      expect(mockState.entities[0].entries[0]).toMatchObject({
        description: 'A',
        edited: true,
        id: 'mock-uuid',
      });
      expect(mockState.entities[0].note.text).toBe('new note');
      expect(mockState.loading.type).toBe(statusConstants.IDLE_STATUS);
    });

    it('should handle rejected state', () => {
      extraReducers[updateEntity.rejected](mockState);
      expect(mockState.loading).toEqual({
        severity: 'error',
        message: 'Updating BoQ Entity failed',
        type: statusConstants.FAILURE_STATUS,
      });
    });
  });
});
