import { normaliseFormValues } from 'v1/quotes-tender/helpers/price';
import {
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
} from './asyncThunk';

export default {
  [fetchQuoteFiles.pending]: () => {},
  [fetchQuoteFiles.fulfilled]: (state, { payload }) => {
    // Thunk returns numeric status codes on failure; treat as error and clear stale data.
    if (payload && typeof payload === 'object') {
      state.quoteFiles = payload;
    } else {
      state.quoteFiles = {};
    }
  },
  [fetchQuoteFiles.rejected]: () => {},
  [fetchQuoteDocuments.fulfilled]: (state, { payload }) => {
    // Backend returns [] (empty JSON array) when the project has no captured
    // files, and the thunk returns numeric status codes on failure.
    if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
      state.quoteDocuments = payload;
    } else {
      state.quoteDocuments = {};
    }
  },
  [fetchQuoteDocuments.rejected]: (state) => {
    state.quoteDocuments = {};
  },
  [fetchQuotes.pending]: (state) => {
    state.loading = true;
    state.loadingQuotes = true;
    state.error = false;
  },
  [fetchQuotes.fulfilled]: (state, { payload }) => {
    // Thunk returns numeric status codes on failure; treat as error and clear stale data.
    if (payload && typeof payload === 'object') {
      // New API moves subcontractor details out of each quote into a root-level
      // `subcontractors` map. Re-embed them into each quote so all UI components
      // continue to work without modification.
      const subcontractors = payload.subcontractors;
      if (subcontractors && payload.tenders) {
        const tenders = {};
        Object.keys(payload.tenders).forEach((tenderId) => {
          const tender = payload.tenders[tenderId];
          const quotes = tender.quotes;
          if (quotes && typeof quotes === 'object' && !Array.isArray(quotes)) {
            const hydratedQuotes = {};
            Object.keys(quotes).forEach((quoteId) => {
              const quote = quotes[quoteId];
              const subcontractor =
                subcontractors[quote.subcontractor_id] ??
                quote.subcontractor ??
                null;
              hydratedQuotes[quoteId] = { ...quote, subcontractor };
            });
            tenders[tenderId] = { ...tender, quotes: hydratedQuotes };
          } else {
            tenders[tenderId] = tender;
          }
        });
        state.quotesData = { ...payload, tenders };
      } else {
        state.quotesData = payload;
      }
      state.error = false;
    } else {
      state.quotesData = {};
      state.error = true;
    }
    state.loading = false;
    state.loadingQuotes = false;
  },
  [fetchQuotes.rejected]: (state) => {
    state.loading = false;
    state.loadingQuotes = false;
    state.error = true;
  },
  [postQuote.pending]: () => {},
  [postQuote.fulfilled]: (state, { payload, meta }) => {
    const { arg } = meta;
    const { tid } = arg;
    const serverQuote = (payload && payload.data) || payload || null;
    const qid = serverQuote?.id ?? null;

    if (!qid) return;

    if (!state.quoteFiles || typeof state.quoteFiles !== 'object') {
      state.quoteFiles = {};
    }
    if (!state.quotesData.tenders) {
      state.quotesData.tenders = {};
    }
    const tenderId = serverQuote?.tender?.id ?? tid;
    if (!state.quotesData.tenders[tenderId]) {
      state.quotesData.tenders[tenderId] = {
        ...(serverQuote.tender || {}),
        quotes: {},
      };
    } else if (!state.quotesData.tenders[tenderId].quotes) {
      state.quotesData.tenders[tenderId].quotes = {};
    }

    // addQuote returns zip on the transaction (often a full S3 URL). Use only that
    // so AI eligibility updates from the add response without refetching quote files.
    const zipUrl = serverQuote?.zip || null;

    // Normalise subcontractor so quote menu (incl. prequal) works without refresh
    const rawSubcontractor = serverQuote?.subcontractor || {};
    const normalisedSubcontractor = {
      ...rawSubcontractor,
      id: rawSubcontractor.id ?? serverQuote?.subcontractor_id,
      type_id: rawSubcontractor.type_id ?? serverQuote?.type_id,
    };

    state.quotesData.tenders[tenderId].quotes[qid] = {
      ...serverQuote,
      subcontractor: normalisedSubcontractor,
      ...(zipUrl ? { zip: zipUrl } : {}),
    };

    if (!state.quoteFiles[tenderId]) {
      state.quoteFiles[tenderId] = {};
    }
    if (zipUrl) {
      state.quoteFiles[tenderId][qid] = zipUrl;
    }
  },
  [postQuote.rejected]: () => {},
  [editQuote.pending]: () => {},
  [editQuote.fulfilled]: (state, { meta }) => {
    const { arg } = meta;
    // on backend tid is actually quote id
    const { tid, order, tenderId } = arg;
    const orderUpdate = normaliseFormValues(order, [
      'price',
      'measured_work',
      'prelims',
      'other_items',
    ]);
    const oldQuote = state.quotesData.tenders[tenderId].quotes[tid];
    state.quotesData.tenders[tenderId].quotes[tid] = {
      ...oldQuote,
      ...orderUpdate,
    };
  },
  [editQuote.rejected]: () => {},
  [toggleCompliant.pending]: () => {},
  [toggleCompliant.fulfilled]: (state, { payload, meta }) => {
    const { arg } = meta;
    const { success } = payload;
    const { id, tenderId, data } = arg;
    if (success) {
      const oldQuote = state.quotesData.tenders[tenderId].quotes[id];
      state.quotesData.tenders[tenderId].quotes[id] = {
        ...oldQuote,
        compliant: Number(data.toggle),
      };
    }
  },
  [toggleCompliant.rejected]: () => {},
  [deleteQuote.pending]: () => {},
  [deleteQuote.fulfilled]: (state, { payload, meta }) => {
    const { arg } = meta;
    const { success } = payload;
    const { tid, tenderId } = arg;
    if (success) {
      delete state.quotesData.tenders[tenderId].quotes[tid];
    }
  },
  [deleteQuote.rejected]: () => {},
  [withdrawAward.pending]: () => {},
  [withdrawAward.fulfilled]: (state, { payload, meta }) => {
    const { arg } = meta;
    const { success } = payload;
    const { tid, id } = arg;
    if (success) {
      state.quotesData.tenders[tid] = {
        ...state.quotesData.tenders[tid],
        awarded: 0,
        quotes: {
          ...state.quotesData.tenders[tid].quotes,
          [id]: {
            ...state.quotesData.tenders[tid].quotes[id],
            awarded: false,
            order_price: null,
            order_date: null,
          },
        },
      };
    }
  },
  [withdrawAward.rejected]: () => {},
  [award.pending]: () => {},
  [award.fulfilled]: (state, { payload, meta }) => {
    const { arg } = meta;
    const { success } = payload;
    const { data, tid, id } = arg;
    if (success) {
      const awardData = normaliseFormValues(data, ['order_value']);
      state.quotesData.tenders[tid] = {
        ...state.quotesData.tenders[tid],
        awarded: 1,
        quotes: {
          ...state.quotesData.tenders[tid].quotes,
          [id]: {
            ...state.quotesData.tenders[tid].quotes[id],
            awarded: true,
            order_price: awardData.order_value,
            order_date: data.order_date,
          },
        },
      };
    }
  },
  [award.rejected]: () => {},
  [toggledSelected.pending]: () => {},
  [toggledSelected.fulfilled]: (state, { payload, meta }) => {
    const { arg } = meta;
    const { success } = payload;
    const { data, tenderId, id } = arg;
    if (success) {
      state.quotesData.tenders[tenderId].quotes[id] = {
        ...state.quotesData.tenders[tenderId].quotes[id],
        price_selected: data.toggle,
      };
    }
  },
  [toggledSelected.rejected]: () => {},
  [updateProjectTender.pending]: () => {},
  [updateProjectTender.fulfilled]: (state, { payload, meta }) => {
    const { arg } = meta;
    const { success } = payload;
    const { data, tid } = arg;
    if (success) {
      state.quotesData.tenders[tid] = {
        ...state.quotesData.tenders[tid],
        budget: Number(data.budget),
      };
    }
  },
  [updateProjectTender.rejected]: () => {},
};

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
