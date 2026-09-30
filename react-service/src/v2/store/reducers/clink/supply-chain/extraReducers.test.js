import extraReducers from './extraReducers';
import {
  fetchAll,
  addData,
  editData,
  removeData,
  getContacts,
  addContact,
  updateContact,
  removeContact,
  setMainContact,
} from './asyncThunk';

describe('supply-chain extraReducers', () => {
  const initialState = {
    loading: false,
    error: '',
    data: [],
    term: '',
    info: { total: 0 },
    aid: 0,
    offset: 0,
    paginationRowsPerPage: 50,
    order: 'company',
    desc: 0,
    paginationPage: 0,
    contacts: {},
  };

  describe('fetchAll handlers', () => {
    it('should handle fetchAll.pending', () => {
      const state = { ...initialState, error: 'Previous error' };
      const pendingHandler = extraReducers[fetchAll.pending];
      pendingHandler(state);

      expect(state.loading).toBe(true);
      expect(state.error).toBe('');
    });

    it('should handle fetchAll.fulfilled', () => {
      const state = { ...initialState, loading: true };
      const payload = {
        data: [{ id: 1, name: 'Company 1' }],
        info: { total: 1 },
        aid: 123,
      };
      const action = { payload };
      const fulfilledHandler = extraReducers[fetchAll.fulfilled];
      fulfilledHandler(state, action);

      expect(state.loading).toBe(false);
      expect(state.data).toEqual(payload.data);
      expect(state.info).toEqual(payload.info);
      expect(state.aid).toBe(123);
    });

    it('should handle fetchAll.rejected', () => {
      const state = { ...initialState, loading: true };
      const rejectedHandler = extraReducers[fetchAll.rejected];
      rejectedHandler(state);

      expect(state.loading).toBe(false);
      expect(state.error).toBe('An error occurred while fetching the supply chain data.');
    });
  });

  describe('addData handlers', () => {
    it('should handle addData.pending', () => {
      const state = { ...initialState, error: 'Previous error' };
      const pendingHandler = extraReducers[addData.pending];
      pendingHandler(state);

      expect(state.loading).toBe(true);
      expect(state.error).toBe('');
    });

    it('should handle addData.fulfilled with new contractor', () => {
      const state = {
        ...initialState,
        data: [{ id: 1, name: 'Existing Company' }],
        loading: true,
      };
      const payload = { id: 2, name: 'New Company', users: [] };
      const action = { payload };
      const fulfilledHandler = extraReducers[addData.fulfilled];
      fulfilledHandler(state, action);

      expect(state.loading).toBe(false);
      expect(state.data).toHaveLength(2);
      expect(state.data[1]).toEqual(payload);
    });

    it('should handle addData.fulfilled with existing contractor update', () => {
      const existingContractor = { id: 1, name: 'Old Company', users: ['user1'], type: 'existing' };
      const state = {
        ...initialState,
        data: [existingContractor],
        loading: true,
      };
      const payload = { id: 1, name: 'Updated Company', users: ['user2'], type: 'updated' };
      const action = { payload };
      const fulfilledHandler = extraReducers[addData.fulfilled];
      fulfilledHandler(state, action);

      expect(state.loading).toBe(false);
      expect(state.data).toHaveLength(1);
      expect(state.data[0]).toEqual({
        ...existingContractor,
        ...payload,
        users: existingContractor.users, // Should preserve existing users
        type: existingContractor.type, // Should preserve existing type
      });
    });

    it('should handle addData.rejected', () => {
      const state = { ...initialState, loading: true };
      const rejectedHandler = extraReducers[addData.rejected];
      rejectedHandler(state);

      expect(state.loading).toBe(false);
      expect(state.error).toBe('');
    });
  });

  describe('editData handlers', () => {
    it('should handle editData.pending', () => {
      const state = { ...initialState, error: 'Previous error' };
      const pendingHandler = extraReducers[editData.pending];
      pendingHandler(state);

      expect(state.loading).toBe(true);
      expect(state.error).toBe('');
    });

    it('should handle editData.fulfilled', () => {
      const existingData = [
        { id: 1, name: 'Company 1' },
        { id: 2, name: 'Company 2' },
      ];
      const state = { ...initialState, data: existingData, loading: true };
      const payload = { id: 1, name: 'Updated Company 1' };
      const action = { payload };
      const fulfilledHandler = extraReducers[editData.fulfilled];
      fulfilledHandler(state, action);

      expect(state.loading).toBe(false);
      expect(state.data[0]).toEqual(payload);
      expect(state.data[1]).toEqual(existingData[1]); // Should remain unchanged
    });

    it('should handle editData.rejected', () => {
      const state = { ...initialState, loading: true };
      const rejectedHandler = extraReducers[editData.rejected];
      rejectedHandler(state);

      expect(state.loading).toBe(false);
      expect(state.error).toBe('An error occurred while editing supply chain data.');
    });
  });

  describe('removeData handlers', () => {
    it('should handle removeData.pending', () => {
      const state = { ...initialState, error: 'Previous error' };
      const pendingHandler = extraReducers[removeData.pending];
      pendingHandler(state);

      expect(state.loading).toBe(true);
      expect(state.error).toBe('');
    });

    it('should handle removeData.fulfilled', () => {
      const existingData = [
        { id: 1, name: 'Company 1' },
        { id: 2, name: 'Company 2' },
      ];
      const state = { ...initialState, data: existingData, loading: true };
      const action = { meta: { arg: { id: 1 } } };
      const fulfilledHandler = extraReducers[removeData.fulfilled];
      fulfilledHandler(state, action);

      expect(state.loading).toBe(false);
      expect(state.data).toHaveLength(1);
      expect(state.data[0].id).toBe(2);
    });

    it('should handle removeData.rejected', () => {
      const state = { ...initialState, loading: true };
      const rejectedHandler = extraReducers[removeData.rejected];
      rejectedHandler(state);

      expect(state.loading).toBe(false);
      expect(state.error).toBe('An error occurred while removing supply chain data.');
    });
  });

  describe('getContacts handlers', () => {
    it('should handle getContacts.fulfilled', () => {
      const state = { ...initialState, contacts: { 456: ['old contact'] } };
      const payload = { data: [{ id: 1, name: 'Contact 1', user_type: 'normal' }] };
      const action = { payload, meta: { arg: 123 } };
      const fulfilledHandler = extraReducers[getContacts.fulfilled];
      fulfilledHandler(state, action);

      expect(state.contacts[123]).toEqual([
        { id: 1, name: 'Contact 1', user_type: 'normal', selected: false }
      ]);
      expect(state.contacts[456]).toEqual(['old contact']); // Should preserve other contacts
    });
  });

  describe('addContact handlers', () => {
    it('should handle addContact.fulfilled', () => {
      const existingContacts = [{ id: 1, name: 'Existing Contact' }];
      const state = { ...initialState, contacts: { 123: existingContacts } };
      const payload = { data: { user: { id: 2, name: 'New Contact' } } };
      const action = { payload, meta: { arg: { subcontractorId: 123 } } };
      const fulfilledHandler = extraReducers[addContact.fulfilled];
      fulfilledHandler(state, action);

      expect(state.contacts[123]).toHaveLength(2);
      expect(state.contacts[123][1]).toEqual(payload.data.user);
    });

    it('should handle addContact.fulfilled with no existing contacts', () => {
      const state = { ...initialState, contacts: {} };
      const payload = { data: { user: { id: 1, name: 'First Contact' } } };
      const action = { payload, meta: { arg: { subcontractorId: 123 } } };
      const fulfilledHandler = extraReducers[addContact.fulfilled];
      fulfilledHandler(state, action);

      expect(state.contacts[123]).toEqual([payload.data.user]);
    });

    it('should handle addContact.fulfilled with response.user format', () => {
      const state = { ...initialState, contacts: {} };
      const payload = { response: { user: { id: 1, name: 'Response Contact' } } };
      const action = { payload, meta: { arg: { subcontractorId: 123 } } };
      const fulfilledHandler = extraReducers[addContact.fulfilled];
      fulfilledHandler(state, action);

      expect(state.contacts[123]).toEqual([payload.response.user]);
    });

    it('should handle addContact.fulfilled with no contact data', () => {
      const state = { ...initialState, contacts: { 123: [] } };
      const payload = { data: {} };
      const action = { payload, meta: { arg: { subcontractorId: 123 } } };
      const fulfilledHandler = extraReducers[addContact.fulfilled];
      fulfilledHandler(state, action);

      expect(state.contacts[123]).toEqual([]);
    });
  });

  describe('updateContact handlers', () => {
    it('should not have updateContact.fulfilled handler', () => {
      // This handler is not implemented in the actual extraReducers
      expect(extraReducers[updateContact.fulfilled]).toBeUndefined();
    });
  });

  describe('removeContact handlers', () => {
    it('should handle removeContact.fulfilled', () => {
      const existingContacts = [
        { id: 1, name: 'Contact 1' },
        { id: 2, name: 'Contact 2' },
      ];
      const state = { ...initialState, contacts: { 123: existingContacts } };
      const action = { meta: { arg: { subcontractorId: 123, userId: 1 } } };
      const fulfilledHandler = extraReducers[removeContact.fulfilled];
      fulfilledHandler(state, action);

      expect(state.contacts[123]).toHaveLength(1);
      expect(state.contacts[123][0].id).toBe(2);
    });

    it('should handle removeContact.fulfilled with no existing contacts', () => {
      const state = { ...initialState, contacts: { 123: [] } };
      const action = { meta: { arg: { subcontractorId: 123, userId: 1 } } };
      const fulfilledHandler = extraReducers[removeContact.fulfilled];
      fulfilledHandler(state, action);

      expect(state.contacts[123]).toEqual([]);
    });
  });

  describe('setMainContact handlers', () => {
    it('should have setMainContact.fulfilled handler', () => {
      // This handler is implemented as an empty handler in the actual extraReducers
      expect(extraReducers[setMainContact.fulfilled]).toBeDefined();
      expect(typeof extraReducers[setMainContact.fulfilled]).toBe('function');
    });
  });
});