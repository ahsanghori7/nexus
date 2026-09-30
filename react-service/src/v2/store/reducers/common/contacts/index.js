import { createSlice } from '@reduxjs/toolkit';
import extraReducers, {
  mockPostContactsFailure,
  mockPostContactsSuccess,
} from './extraReducers';

// TODO: Refactor this to properly delete it
const initialState = {
  open: false,
  templates: [],
  selectedTemplate: 0,
  loading: false,
};

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    setOpenContactsModal(state, action) {
      state.open = action.payload;
    },
    setTenderTemplates(state, action) {
      state.templates = action.payload;
    },
    setSelectedTemplate(state, action) {
      state.selectedTemplate = action.payload;
    },
  },
  extraReducers,
});

export const { setOpenContactsModal, setSelectedTemplate, setTenderTemplates } =
  contactsSlice.actions;
export {
  mockPostContactsFailure,
  mockPostContactsSuccess,
};
export default contactsSlice.reducer;
