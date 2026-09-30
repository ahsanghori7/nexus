import { createSlice } from '@reduxjs/toolkit';
import extraReducers, {
  fetchAll,
  fetchBySubcontractorId,
  addData,
  editData,
  removeData,
  getContacts,
  addContact,
  updateContact,
  removeContact,
  setMainContact,
} from './extraReducers';

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

const supplyChainSlice = createSlice({
  name: 'supplyChain',
  initialState,
  reducers: {
    setTerm: (state, action) => {
      state.term = action.payload || '';
      state.paginationPage = 0;
    },
    setPaginationRowsPerPage: (state, action) => {
      state.paginationRowsPerPage = action.payload;
    },
    setOrder: (state, action) => {
      state.order = action.payload;
    },
    setOffset: (state, action) => {
      state.offset = action.payload;
    },
    setDesc: (state, action) => {
      state.desc = action.payload;
    },
    setPaginationPage: (state, action) => {
      state.paginationPage = action.payload;
    },
    selectContact: (state, action) => {
      const { subId, contactId } = action.payload;
      if (state.contacts[subId]) {
        state.contacts[subId] = state.contacts[subId].map((contact) => ({
          ...contact,
          selected:
            contact.id === contactId ? !contact.selected : contact.selected,
        }));
      }
    },
    setContacts: (state, action) => {
      state.contacts = action.payload;
    },
  },
  extraReducers,
});

export {
  fetchAll,
  fetchBySubcontractorId,
  addData,
  editData,
  removeData,
  getContacts,
  addContact,
  updateContact,
  removeContact,
  setMainContact,
};
export const {
  setTerm,
  setPaginationRowsPerPage,
  setOrder,
  setDesc,
  setPaginationPage,
  setOffset,
  selectContact,
  setContacts,
} = supplyChainSlice.actions;
export default supplyChainSlice.reducer;
