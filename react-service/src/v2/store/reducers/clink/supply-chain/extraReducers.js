import {
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
} from './asyncThunk';

export default {
  [fetchAll.pending]: (state) => {
    state.loading = true;
    state.error = '';
  },
  [fetchAll.fulfilled]: (state, { payload }) => {
    state.data = payload.data;
    state.info = payload.info;
    state.aid = payload.aid;
    state.loading = false;
  },
  [fetchAll.rejected]: (state) => {
    state.loading = false;
    state.error = 'An error occurred while fetching the supply chain data.';
  },

  [fetchBySubcontractorId.pending]: () => {},
  [fetchBySubcontractorId.fulfilled]: (state, { payload }) => {
    state.dataById = payload;
  },
  [fetchBySubcontractorId.rejected]: () => {},

  [addData.pending]: (state) => {
    state.loading = true;
    state.error = '';
  },
  [addData.fulfilled]: (state, { payload }) => {
    let newContractors = [...state.data, payload];
    if (
      state.data.find(
        (contractor) => Number(contractor?.id) === Number(payload?.id),
      )
    ) {
      newContractors = [...state.data].map((contractor) =>
        Number(contractor?.id) === Number(payload?.id)
          ? {
              ...contractor,
              ...payload,
              users: contractor?.users || payload?.users,
              type: contractor?.type || payload?.type,
            }
          : contractor,
      );
    }
    state.data = newContractors;
    state.loading = false;
  },
  [addData.rejected]: (state) => {
    state.loading = false;
    state.error = '';
  },
  [editData.pending]: (state) => {
    state.loading = true;
    state.error = '';
  },
  [editData.fulfilled]: (state, { payload }) => {
    state.data = [...state.data].map((contractor) =>
      Number(contractor.id) === Number(payload.id)
        ? {
            ...contractor,
            ...payload,
            users: contractor?.users || payload?.users,
            type: contractor?.type || payload?.type,
          }
        : contractor,
    );
    state.loading = false;
  },
  [editData.rejected]: (state) => {
    state.loading = false;
    state.error = 'An error occurred while editing supply chain data.';
  },
  [removeData.pending]: (state) => {
    state.loading = true;
    state.error = '';
  },
  [removeData.fulfilled]: (state, { meta }) => {
    state.data = [...state.data].filter(
      (contractor) => Number(contractor.id) !== Number(meta.arg.id),
    );
    state.loading = false;
  },
  [removeData.rejected]: (state) => {
    state.loading = false;
    state.error = 'An error occurred while removing supply chain data.';
  },
  [getContacts.pending]: (state) => {
    state.error = '';
  },
  [getContacts.fulfilled]: (state, { payload, meta }) => {
    state.contacts[meta.arg] =
      payload?.data?.map((contact) => ({
        ...contact,
        selected: contact.user_type === 'account_holder',
      })) || [];
  },
  [getContacts.rejected]: (state) => {
    state.error = 'An error occurred while fetching supply chain contacts.';
  },
  [removeContact.pending]: () => {},
  [removeContact.fulfilled]: (state, { meta }) => {
    const userId = Number(meta?.arg?.userId) || 0;
    const subcontractorId = Number(meta?.arg?.subcontractorId) || 0;
    state.contacts[subcontractorId] = state.contacts[subcontractorId].filter(
      (contact) => Number(contact.id) !== userId,
    );
  },
  [removeContact.rejected]: () => {},
  [addContact.pending]: () => {},
  [addContact.fulfilled]: (state, { payload, meta }) => {
    const subcontractorId = Number(meta?.arg?.subcontractorId) || 0;
    const contact = payload?.response?.user || payload?.data?.user; // hack to make things work
    if (contact) {
      state.contacts[subcontractorId] = state.contacts[subcontractorId]
        ? [...state.contacts[subcontractorId], contact]
        : [contact];
    }
  },
  [addContact.rejected]: () => {},
  [setMainContact.fulfilled]: () => {},
  [setMainContact.rejected]: () => {},
  [setMainContact.pending]: () => {},
};

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
