import reducer, {
  setTerm,
  setPaginationRowsPerPage,
  setOrder,
  setDesc,
  setPaginationPage,
  setOffset,
  selectContact,
  setContacts,
  fetchAll,
  addData,
  editData,
  removeData,
  getContacts,
  addContact,
  updateContact,
  removeContact,
  setMainContact,
} from './index';

describe('supply-chain reducer', () => {
  const initialState = {
    loading: false,
    error: '',
    dataById: [],
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

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('regular reducers', () => {
    it('should handle setTerm', () => {
      const action = setTerm('test search');
      const state = reducer(initialState, action);
      expect(state.term).toBe('test search');
      expect(state.paginationPage).toBe(0);
    });

    it('should handle setTerm with null/undefined value', () => {
      const action = setTerm(null);
      const state = reducer(initialState, action);
      expect(state.term).toBe('');
      expect(state.paginationPage).toBe(0);
    });

    it('should handle setPaginationRowsPerPage', () => {
      const action = setPaginationRowsPerPage(25);
      const state = reducer(initialState, action);
      expect(state.paginationRowsPerPage).toBe(25);
    });

    it('should handle setOrder', () => {
      const action = setOrder('name');
      const state = reducer(initialState, action);
      expect(state.order).toBe('name');
    });

    it('should handle setOffset', () => {
      const action = setOffset(100);
      const state = reducer(initialState, action);
      expect(state.offset).toBe(100);
    });

    it('should handle setDesc', () => {
      const action = setDesc(1);
      const state = reducer(initialState, action);
      expect(state.desc).toBe(1);
    });

    it('should handle setPaginationPage', () => {
      const action = setPaginationPage(5);
      const state = reducer(initialState, action);
      expect(state.paginationPage).toBe(5);
    });

    it('should handle selectContact', () => {
      const currentState = {
        ...initialState,
        contacts: {
          123: [
            { id: 1, name: 'Contact 1', selected: false },
            { id: 2, name: 'Contact 2', selected: false },
          ],
        },
      };

      const action = selectContact({ subId: 123, contactId: 1 });
      const state = reducer(currentState, action);

      expect(state.contacts[123][0].selected).toBe(true);
      expect(state.contacts[123][1].selected).toBe(false);
    });

    it('should handle selectContact toggle', () => {
      const currentState = {
        ...initialState,
        contacts: {
          123: [
            { id: 1, name: 'Contact 1', selected: true },
            { id: 2, name: 'Contact 2', selected: false },
          ],
        },
      };

      const action = selectContact({ subId: 123, contactId: 1 });
      const state = reducer(currentState, action);

      expect(state.contacts[123][0].selected).toBe(false);
      expect(state.contacts[123][1].selected).toBe(false);
    });

    it('should handle selectContact with non-existent subId', () => {
      const currentState = {
        ...initialState,
        contacts: {
          123: [
            { id: 1, name: 'Contact 1', selected: false },
          ],
        },
      };

      const action = selectContact({ subId: 456, contactId: 1 });
      const state = reducer(currentState, action);

      // Should not change anything
      expect(state.contacts).toEqual(currentState.contacts);
    });

    it('should handle setContacts', () => {
      const contacts = {
        123: [{ id: 1, name: 'Contact 1' }],
        456: [{ id: 2, name: 'Contact 2' }],
      };
      const action = setContacts(contacts);
      const state = reducer(initialState, action);
      expect(state.contacts).toEqual(contacts);
    });
  });

  describe('async thunk actions', () => {
    it('should export all async thunk actions', () => {
      expect(fetchAll).toBeDefined();
      expect(addData).toBeDefined();
      expect(editData).toBeDefined();
      expect(removeData).toBeDefined();
      expect(getContacts).toBeDefined();
      expect(addContact).toBeDefined();
      expect(updateContact).toBeDefined();
      expect(removeContact).toBeDefined();
      expect(setMainContact).toBeDefined();
    });

    it('should have correct type prefixes for async thunks', () => {
      expect(fetchAll.typePrefix).toBe('account/supply-chain');
      expect(addData.typePrefix).toBe('account/add-supply-chain');
      expect(editData.typePrefix).toBe('account/edit-supply-chain');
      expect(removeData.typePrefix).toBe('account/remove-supply-chain');
      expect(getContacts.typePrefix).toBe('account/getContacts');
      expect(addContact.typePrefix).toBe('account/addContact');
      expect(updateContact.typePrefix).toBe('account/updateContact');
      expect(removeContact.typePrefix).toBe('account/removeContact');
      expect(setMainContact.typePrefix).toBe('account/setMainContact');
    });
  });

  describe('state transitions', () => {
    it('should maintain other state when setting term', () => {
      const currentState = {
        ...initialState,
        loading: true,
        data: [{ id: 1, name: 'Test' }],
        paginationPage: 5,
        contacts: { 123: [] },
      };

      const action = setTerm('new search');
      const state = reducer(currentState, action);

      expect(state).toEqual({
        ...currentState,
        term: 'new search',
        paginationPage: 0, // This should reset
      });
    });

    it('should preserve all other state when updating pagination', () => {
      const currentState = {
        ...initialState,
        term: 'search term',
        data: [{ id: 1, name: 'Test' }],
        loading: true,
        contacts: { 123: [{ id: 1, name: 'Contact' }] },
      };

      const action = setPaginationRowsPerPage(100);
      const state = reducer(currentState, action);

      expect(state).toEqual({
        ...currentState,
        paginationRowsPerPage: 100,
      });
    });

    it('should handle complex contact selection scenarios', () => {
      const currentState = {
        ...initialState,
        contacts: {
          123: [
            { id: 1, name: 'Contact 1', selected: false },
            { id: 2, name: 'Contact 2', selected: true },
            { id: 3, name: 'Contact 3', selected: false },
          ],
          456: [
            { id: 4, name: 'Contact 4', selected: false },
          ],
        },
      };

      // Select contact 1 in subId 123
      const action1 = selectContact({ subId: 123, contactId: 1 });
      const state1 = reducer(currentState, action1);

      expect(state1.contacts[123][0].selected).toBe(true);
      expect(state1.contacts[123][1].selected).toBe(true); // Should remain true
      expect(state1.contacts[123][2].selected).toBe(false);
      expect(state1.contacts[456][0].selected).toBe(false); // Should not change

      // Deselect contact 2 in subId 123
      const action2 = selectContact({ subId: 123, contactId: 2 });
      const state2 = reducer(state1, action2);

      expect(state2.contacts[123][0].selected).toBe(true);
      expect(state2.contacts[123][1].selected).toBe(false); // Should toggle to false
      expect(state2.contacts[123][2].selected).toBe(false);
      expect(state2.contacts[456][0].selected).toBe(false);
    });
  });
});
