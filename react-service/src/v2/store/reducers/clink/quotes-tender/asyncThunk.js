import { createAsyncThunk } from '@reduxjs/toolkit';
import Relay from 'v2/services/relay';
import moment from 'moment';

const relay = new Relay('relay', '', '');

const fetchQuotes = createAsyncThunk('transaction/getQuotes', async (pid) =>
  relay
    .get('', { action: 'transaction', method: 'getQuotes', pid })
    .then((result) => (result.status === 200 ? result.json() : result.status))
    .catch((error) => error.status),
);

const fetchQuoteFiles = createAsyncThunk(
  'transaction/getQuotesFiles',
  async (pid) =>
    relay
      .get('', { action: 'transaction', method: 'getQuotesFiles', pid })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status),
);

const fetchQuoteDocuments = createAsyncThunk(
  'transaction/getQuoteDocuments',
  async (pid) =>
    relay
      .get('', { action: 'transaction', method: 'getQuoteDocuments', pid })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status),
);

const postQuote = createAsyncThunk(
  'transaction/addQuote',
  async ({ data, pid, tid }) => {
    return relay
      .postForm(data, '', {
        action: 'transaction',
        method: 'addQuote',
        pid,
        tid,
      })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status);
  },
);

const editQuote = createAsyncThunk(
  'transaction/updateQuote',
  async ({ order, pid, tid }) =>
    relay
      .patch(order, '', {
        action: 'transaction',
        method: 'updateQuote',
        pid,
        tid,
      })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status),
);

const toggleCompliant = createAsyncThunk(
  'transaction/toggledCompliant',
  async ({ data, pid, id }) =>
    relay
      .post(data, '', {
        action: 'transaction',
        method: 'toggledCompliant',
        pid,
        id,
      })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status),
);

const deleteQuote = createAsyncThunk(
  'transaction/deleteQuote',
  async ({ pid, tid }) =>
    relay
      .post({}, '', {
        action: 'transaction',
        method: 'deleteQuote',
        pid,
        tid,
      })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status),
);

const withdrawAward = createAsyncThunk(
  'transaction/withdrawAward',
  async ({ pid, tid, id }) =>
    relay
      .post({}, '', {
        action: 'transaction',
        method: 'withdrawAward',
        pid,
        tid,
        id,
      })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status),
);

const award = createAsyncThunk(
  'transaction/award',
  async ({ data, pid, tid, sid, id }) =>
    relay
      .patch(data, '', {
        action: 'transaction',
        method: 'award',
        pid,
        tid,
        sid,
        id,
      })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status),
);

const toggledSelected = createAsyncThunk(
  'transaction/toggledSelected',
  async ({ data, pid, id }) =>
    relay
      .post(data, '', {
        action: 'transaction',
        method: 'toggledSelected',
        pid,
        id,
      })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status),
);

// TODO: Rename this to be coherent with the others
const updateProjectTender = createAsyncThunk(
  'project/updateProjectTender',
  async ({ data, tid, id }) => {
    const budget_updated_at = moment().format('YYYY-MM-DD');
    return relay
      .patch({ ...data, budget_updated_at }, '', {
        action: 'project',
        method: 'updateProjectTender',
        tid,
        id, // project id
      })
      .then((result) => (result.status === 200 ? result.json() : result.status))
      .catch((error) => error.status);
  },
);

export {
  fetchQuoteFiles,
  fetchQuoteDocuments,
  fetchQuotes,
  postQuote,
  editQuote,
  toggleCompliant,
  deleteQuote,
  withdrawAward,
  award,
  toggledSelected,
  updateProjectTender,
};
