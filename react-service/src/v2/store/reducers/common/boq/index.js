import { createSlice } from '@reduxjs/toolkit';
import statusConstants from 'store/reducers/common/constants';
import {
  bumpAiPollGeneration,
} from 'v2/apps/clink/pages/boq/boqAiPollGeneration';
import extraReducers, {
  fetchBoQList,
  fetchBoQByTenderId,
  fetchBoQQuotes,
  fetchUnits,
  fetchProjectStatuses,
  createEntity,
  updateEntity,
  generateBoqWithAI,
  fetchGenerateBoqStatus,
  publishBoQ,
  republishBoQ,
  quoteItems,
  quoteItemsDocs,
  publishQuote,
  republishQuote,
  fetchOrderTemplates,
  changeCompliance,
  fetchQuoteHistory,
} from './extraReducers';

const initialState = {
  units: [],
  entity: null,
  entities: [],
  uiLoading: {
    boqList: false,
    /** PATCH `boq/entity/:id` in-flight by entity id */
    updateEntityById: {},
    /** "New BoQ" destructive reset in-flight by entity id */
    newBoqResetById: {},
    /** publish/republish in-flight by entity id */
    publishById: {},
    /** GET `ai/generate-boq/:id` poll in-flight by entity id */
    aiPollById: {},
  },
  aiGenerationById: {},
  /** Incremented on new AI POST / clear; stale GET responses are ignored. */
  aiPollGenerationById: {},
  /** After "Retry analysis", skip automatic GET ai/generate-boq rehydration until user starts AI again */
  aiRehydrationSkippedById: {},
  /** GET ai/generate-boq failed for this BoQ id; snackbar when tab is active (enable), cleared on success / Retry / new AI */
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

const boqSlice = createSlice({
  name: 'boq',
  initialState,
  reducers: {
    setSelectedEntries(state, action) {
      const { payload } = action;
      const { id, rows } = payload;
      if (id) {
        state.entities = [...state.entities].map((entity) =>
          Number(entity.id) === Number(id)
            ? { ...entity, nextEntries: rows }
            : entity
        );
      } else {
        state.entity = { ...state.entity, nextEntries: rows };
      }
    },
    setEditingMode(state, action) {
      const { payload } = action;
      const { id, value, excel } = payload;
      state.entities = [...state.entities].map((entity) =>
        Number(entity.id) === Number(id)
          ? { ...entity, editing: value }
          : entity
      );
      state.readyAfterTemplate = excel;
    },
    setEditingQuoteMode(state, action) {
      const { payload } = action;
      const { value } = payload;
      state.editingQuote = value;
    },
    setEntitySaved(state, action) {
      const { payload } = action;
      const { eid, value } = payload;
      state.entities = state.entities.map((e) =>
        e.id === eid
          ? {
              ...e,
              saved: value,
            }
          : e
      );
    },
    setPackageNote(state, action) {
      const { payload } = action;
      const { newNote, eid } = payload;
      state.entities = state.entities.map((e) => {
        if (e.id === eid) {
          return {
            ...e,
            nextNote: newNote,
          };
        }
        return e;
      });
    },
    setSubmitQuoteVars(state, action) {
      const { payload } = action;
      const { key, value } = payload;
      if (state.entity && [key] in state.entity) {
        state.entity[key] = value;
      }
    },
    setLocalLoadQuotes(state, action) {
      state.loadedQuotes = action?.payload ?? false;
    },
    clearAiGenerationResult(state, action) {
      const packageId = action?.payload?.packageId;
      if (!packageId || !state.aiGenerationById?.[packageId]) return;
      state.aiGenerationById = {
        ...state.aiGenerationById,
        [packageId]: {
          ...state.aiGenerationById[packageId],
          result: null,
        },
      };
    },
    clearAiGenerationForPackage(state, action) {
      const packageId = action?.payload?.packageId;
      if (!packageId) return;
      bumpAiPollGeneration(state, packageId);
      if (state.aiGenerationById?.[packageId]) {
        const next = { ...state.aiGenerationById };
        delete next[packageId];
        state.aiGenerationById = next;
      }
      state.aiRehydrationSkippedById = {
        ...(state.aiRehydrationSkippedById || {}),
        [packageId]: true,
      };
      if (state.aiGetPollStickyById?.[packageId]) {
        const nextSticky = { ...state.aiGetPollStickyById };
        delete nextSticky[packageId];
        state.aiGetPollStickyById = nextSticky;
      }
    },
  },
  extraReducers,
});

export {
  fetchBoQList,
  fetchBoQByTenderId,
  fetchBoQQuotes,
  fetchUnits,
  fetchProjectStatuses,
  createEntity,
  updateEntity,
  generateBoqWithAI,
  fetchGenerateBoqStatus,
  publishBoQ,
  republishBoQ,
  quoteItems,
  quoteItemsDocs,
  publishQuote,
  republishQuote,
  fetchOrderTemplates,
  changeCompliance,
  fetchQuoteHistory,
};
export const {
  setSelectedEntries,
  setPackageNote,
  setEditingMode,
  setEntitySaved,
  setSubmitQuoteVars,
  setEditingQuoteMode,
  setLocalLoadQuotes,
  clearAiGenerationResult,
  clearAiGenerationForPackage,
} = boqSlice.actions;
export default boqSlice.reducer;
