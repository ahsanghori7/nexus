import statusConstants from 'store/reducers/common/constants';
import { v4 as uuidv4 } from 'uuid';
import i18next from 'v2/helpers/i18n';
import {
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
  normalizeFetchBoQListArg,
  releaseBoqBusyFlagsForPackage,
} from './asyncThunk';
import isEqual from 'lodash/isEqual';
import {
  bumpAiPollGeneration,
  isStaleAiPollResponse,
} from 'v2/apps/clink/pages/boq/boqAiPollGeneration';
import {
  mapAiNoteToDraft,
  mapAiResultEntriesToBoqDraftRows,
  resolveBoqEditingAfterListFetch,
} from 'v2/apps/clink/pages/boq/boqEntityPayload';

const ADD = 'addition';
const changesTypes = {
  [ADD]: i18next.t('new-tender-addendum'),
  modification: i18next.t('edit-tender-addendum'),
};

function clearAiGetPollStickyForPackage(state, packageId) {
  if (packageId == null || !state.aiGetPollStickyById?.[packageId]) return;
  const nextSticky = { ...(state.aiGetPollStickyById || {}) };
  delete nextSticky[packageId];
  state.aiGetPollStickyById = nextSticky;
}

/** POST `ai/generate-boq/:id` failed; ignore late GET poll responses until user clears (New BoQ / Retry / new POST). */
function isPostGenerationAiErrorLocked(state, packageId) {
  if (packageId == null) return false;
  const cur = state.aiGenerationById?.[packageId];
  return cur?.status === 'ERROR' && cur?.errorSource === 'POST';
}

function normalizeAiPollStatus(status) {
  return String(status ?? '')
    .trim()
    .toUpperCase();
}

function isAiGenerationInProgress(state, packageId) {
  if (packageId == null) return false;
  const status = normalizeAiPollStatus(state.aiGenerationById?.[packageId]?.status);
  return status === 'PENDING' || status === 'STARTED';
}

/** Ignore stale rehydration/poll responses that arrive before the server registers a new job. */
function isStaleAiPollNotFound(state, packageId, incomingStatus) {
  if (!isAiGenerationInProgress(state, packageId)) return false;
  const next = normalizeAiPollStatus(incomingStatus ?? 'NOT_FOUND');
  return next === 'NOT_FOUND' || next === '';
}

/** GET ai/generate-boq failed with HTTP 5xx (incl. 503 QSAI unreachable): drop AI state, skip rehydrate; sticky shows “AI down” snackbar when tab active */
function applyAiGetPollHttpFailure(state, packageId) {
  if (!packageId) return;
  const next = { ...(state.aiGenerationById || {}) };
  delete next[packageId];
  state.aiGenerationById = next;
  state.aiRehydrationSkippedById = {
    ...(state.aiRehydrationSkippedById || {}),
    [packageId]: true,
  };
  state.aiGetPollStickyById = {
    ...(state.aiGetPollStickyById || {}),
    [packageId]: true,
  };
}

/** Non-5xx GET failure: reset AI poll state without snackbar (e.g. 403). */
function applyAiGetPollEscapeNoSticky(state, packageId) {
  if (!packageId) return;
  const next = { ...(state.aiGenerationById || {}) };
  delete next[packageId];
  state.aiGenerationById = next;
  state.aiRehydrationSkippedById = {
    ...(state.aiRehydrationSkippedById || {}),
    [packageId]: true,
  };
}

function normalizeHttpStatus(raw) {
  if (raw === undefined || raw === null || raw === '') return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export default {
  // Smart BOQ Builder (AI)
  [generateBoqWithAI.pending]: (state, action) => {
    const packageId = action.meta?.arg?.packageId;
    if (packageId) {
      bumpAiPollGeneration(state, packageId);
      clearAiGetPollStickyForPackage(state, packageId);
      state.aiGenerationById = {
        ...(state.aiGenerationById || {}),
        [packageId]: {
          ...(state.aiGenerationById?.[packageId] || {}),
          status: 'PENDING',
          error: null,
          errorSource: null,
          current_step: 0,
          total_steps: 0,
          processing_type: null,
          result: null,
          completed_at: null,
        },
      };
    }
    if (packageId && state.aiRehydrationSkippedById?.[packageId]) {
      const nextSkip = { ...state.aiRehydrationSkippedById };
      delete nextSkip[packageId];
      state.aiRehydrationSkippedById = nextSkip;
    }
    state.loading = {
      severity: 'info',
      message: 'Generating BoQ',
      type: statusConstants.LOADING_STATUS,
    };
  },
  [generateBoqWithAI.fulfilled]: (state, action) => {
    const { meta, payload } = action;
    const packageId = meta?.arg?.packageId;
    // httpHelper (v1) returns a plain string body on non-2xx instead of throwing
    if (typeof payload === 'string') {
      if (packageId) {
        state.aiGenerationById = {
          ...(state.aiGenerationById || {}),
          [packageId]: {
            ...(state.aiGenerationById?.[packageId] || {}),
            status: 'ERROR',
            error: payload,
            errorSource: 'POST',
          },
        };
      }
      state.loading = {
        severity: false,
        message: '',
        type: statusConstants.IDLE_STATUS,
      };
      return;
    }
    if (packageId) {
      const next = payload?.data || payload || {};
      const nextStatus = String(next.status || 'PENDING')
        .trim()
        .toUpperCase();
      state.aiGenerationById = {
        ...(state.aiGenerationById || {}),
        [packageId]: {
          ...(state.aiGenerationById?.[packageId] || {}),
          // If a new generation starts, reset any old progress/result fields
          ...(nextStatus === 'PENDING' && {
            current_step: 0,
            total_steps: 0,
            processing_type: null,
            result: null,
            completed_at: null,
            error: null,
          }),
          ...next,
          status: nextStatus,
        },
      };
    }
    state.loading = {
      severity: false,
      message: '',
      type: statusConstants.IDLE_STATUS,
    };
  },
  [generateBoqWithAI.rejected]: (state, action) => {
    const packageId = action.meta?.arg?.packageId;
    if (packageId) {
      const { payload, error } = action;
      const message =
        typeof payload === 'object' && payload !== null && 'message' in payload
          ? payload.message
          : payload || error?.message || 'Unknown error';
      state.aiGenerationById = {
        ...(state.aiGenerationById || {}),
        [packageId]: {
          ...(state.aiGenerationById?.[packageId] || {}),
          status: 'ERROR',
          error: message,
          errorSource: 'POST',
        },
      };
    }
    state.loading = {
      severity: false,
      message: '',
      type: statusConstants.IDLE_STATUS,
    };
  },

  [fetchGenerateBoqStatus.pending]: (state, action) => {
    const packageId = action?.meta?.arg?.packageId;
    if (!packageId) return;
    state.uiLoading = state.uiLoading || {};
    state.uiLoading.aiPollById = {
      ...(state.uiLoading.aiPollById || {}),
      [packageId]: true,
    };
  },
  [fetchGenerateBoqStatus.fulfilled]: (state, action) => {
    const { meta, payload } = action;
    const packageId = meta?.arg?.packageId;
    const pollGeneration = meta?.arg?.pollGeneration;
    if (!packageId) return;
    if (state.uiLoading?.aiPollById?.[packageId]) {
      const next = { ...state.uiLoading.aiPollById };
      delete next[packageId];
      state.uiLoading.aiPollById = next;
    }
    if (isStaleAiPollResponse(state, packageId, pollGeneration)) {
      return;
    }
    if (isPostGenerationAiErrorLocked(state, packageId)) {
      return;
    }
    const next = payload?.data || payload || {};
    clearAiGetPollStickyForPackage(state, packageId);
    const normalizedStatus = next.status
      ? String(next.status).trim().toUpperCase()
      : next.status;
    if (isStaleAiPollNotFound(state, packageId, normalizedStatus)) {
      return;
    }
    state.aiGenerationById = {
      ...(state.aiGenerationById || {}),
      [packageId]: {
        ...(state.aiGenerationById?.[packageId] || {}),
        ...next,
        ...(normalizedStatus ? { status: normalizedStatus } : {}),
      },
    };
  },
  [fetchGenerateBoqStatus.rejected]: (state, action) => {
    const { meta, payload } = action;
    const packageId = meta?.arg?.packageId;
    const pollGeneration = meta?.arg?.pollGeneration;
    if (!packageId) return;
    if (state.uiLoading?.aiPollById?.[packageId]) {
      const next = { ...state.uiLoading.aiPollById };
      delete next[packageId];
      state.uiLoading.aiPollById = next;
    }
    if (isStaleAiPollResponse(state, packageId, pollGeneration)) {
      return;
    }
    if (isPostGenerationAiErrorLocked(state, packageId)) {
      return;
    }
    const statusCode = normalizeHttpStatus(
      typeof payload === 'object' && payload !== null
        ? payload.status
        : undefined
    );
    // Relay returns a clean 404 for the normal "no analysis yet" empty-state
    // (AI2-494), so the HTTP status code is authoritative.
    if (statusCode === 404) {
      if (!isStaleAiPollNotFound(state, packageId, 'NOT_FOUND')) {
        state.aiGenerationById = {
          ...(state.aiGenerationById || {}),
          [packageId]: {
            ...(state.aiGenerationById?.[packageId] || {}),
            status: 'NOT_FOUND',
          },
        };
      }
    } else if (statusCode >= 500) {
      applyAiGetPollHttpFailure(state, packageId);
    } else {
      applyAiGetPollEscapeNoSticky(state, packageId);
    }
  },
  [fetchBoQList.pending]: (state) => {
    state.uiLoading = state.uiLoading || {};
    state.uiLoading.boqList = true;
    state.loading = {
      severity: 'info',
      message: 'Loading BoQ list',
      type: statusConstants.LOADING_STATUS,
    };
  },
  [fetchBoQList.fulfilled]: (state, { payload, meta }) => {
    if (state.uiLoading) {
      state.uiLoading.boqList = false;
      const { releaseBusyForPackageId } = normalizeFetchBoQListArg(meta?.arg);
      if (releaseBusyForPackageId != null) {
        const nextUi = releaseBoqBusyFlagsForPackage(
          state.uiLoading,
          releaseBusyForPackageId
        );
        state.uiLoading.updateEntityById = nextUi.updateEntityById;
        state.uiLoading.newBoqResetById = nextUi.newBoqResetById;
      }
    }
    if (payload && payload.data) {
      const { data } = payload;
      state.entities = data.map((entity) => {
        const entries = [...entity.entries]
          .sort((a, b) => a.position - b.position)
          .map((e) => ({
            ...e,
            budget_rate: Number(e.budget_rate) ? e.budget_rate : '',
            budget_total: Number(e.budget_total) ? e.budget_total : '',
            quantity: Number(e.quantity) ? e.quantity : '',
          }));

        const packageId = entity.id;
        const aiEntry = state.aiGenerationById?.[packageId];
        const aiResultEntries = aiEntry?.result?.entries;
        const hasAiSuccessDraft =
          !entries.length &&
          aiEntry?.status === 'SUCCESS' &&
          Array.isArray(aiResultEntries) &&
          aiResultEntries.some(
            (e) => String(e?.type || '').toLowerCase().trim() === 'item'
          );

        let nextEntries = entries;
        let nextNote = entity.note;

        if (hasAiSuccessDraft) {
          nextEntries = mapAiResultEntriesToBoqDraftRows(aiResultEntries, {
            units: state.units,
          });
          nextNote = mapAiNoteToDraft(aiEntry.result?.notes);
        }

        const editing = resolveBoqEditingAfterListFetch(
          entity,
          entries,
          state.projectStatuses,
          { hasAiSuccessDraft }
        );

        return {
          ...entity,
          tid: entity.tender.id,
          label: entity.tender.label,
          editing,
          saved: false,
          entries,
          nextEntries,
          nextNote,
        };
      });
    }
    state.loading = {
      severity: false,
      message: '',
      type: statusConstants.IDLE_STATUS,
    };
  },
  [fetchBoQList.rejected]: (state, action) => {
    if (state.uiLoading) {
      state.uiLoading.boqList = false;
      const { releaseBusyForPackageId } = normalizeFetchBoQListArg(
        action?.meta?.arg
      );
      if (releaseBusyForPackageId != null) {
        const nextUi = releaseBoqBusyFlagsForPackage(
          state.uiLoading,
          releaseBusyForPackageId
        );
        state.uiLoading.updateEntityById = nextUi.updateEntityById;
        state.uiLoading.newBoqResetById = nextUi.newBoqResetById;
      }
    }
    state.loading = {
      severity: 'error',
      message: 'Loading BoQ list failed',
      type: statusConstants.FAILURE_STATUS,
    };
  },
  [fetchBoQQuotes.pending]: (state) => {
    state.loading = {
      severity: 'info',
      message: 'Loading BoQ Quotes',
      type: statusConstants.LOADING_STATUS,
    };
  },

  /**
   * ToDo: Refactor this action as if called from prosper it should be one quote, if called from C-link it should be a list of quotes
   *   To save time now and get the tender analysis page working I've added a prop to the state called quotes
   *   The problem is there will be multiple quotes attached to one BOQ if from C-Link, so entries update in this method doesnt make sense.
   */
  [fetchBoQQuotes.fulfilled]: (state, { payload }) => {
    if (payload && payload.data) {
      const transaction = payload.data;

      state.loadedQuotes = true;
      state.quotes = transaction;

      const quotes = transaction.flatMap((t) => t.quote);
      const entity = { ...state.entity };

      entity.quote_exclusion = '';
      if (transaction.length > 0) {
        entity.quote_exclusion = transaction[0].note ?? '';
        entity.programme =
          transaction[0].programme_weeks?.text ||
          transaction[0].programme ||
          '';
        entity.programme_weeks = transaction[0].programme_weeks;
        entity.exclusion_note = transaction[0].exclusion_note;
      } else {
        entity.quote_exclusion = '';
        entity.programme = '';
      }
      entity.original_quote_exclusion = entity.quote_exclusion;
      entity.original_programme = entity.programme;

      const entries = entity.entries.map((e) => {
        const entry = { ...e };
        const newEntry = quotes.find((quote) => quote.boq_item_id === entry.id);
        if (newEntry) {
          return {
            ...entry,
            rate: Number(newEntry.rate) ? Number(newEntry.rate) : '',
            boq_quote_item_id: newEntry.id,
            price: Number(newEntry.price) ? Number(newEntry.price) : '',
            quotes,
          };
        }
        return {
          ...entry,
          rate: '',
          boq_quote_item_id: null,
          price: '',
          quotes,
        };
      });
      state.entity = {
        ...entity,
        entries,
        sent: Boolean(quotes.length),
        nextEntries: entries,
      };
    }
    state.loading = {
      severity: false,
      message: '',
      type: statusConstants.IDLE_STATUS,
    };
  },
  [fetchBoQQuotes.rejected]: (state) => {
    state.loading = {
      severity: 'error',
      message: 'Loading BoQ Quotes failed',
      type: statusConstants.FAILURE_STATUS,
    };
  },
  [fetchBoQByTenderId.pending]: (state) => {
    state.loading = {
      severity: 'info',
      message: 'Loading BoQ Entity',
      type: statusConstants.LOADING_STATUS,
    };
  },
  [fetchBoQByTenderId.fulfilled]: (state, { payload, meta }) => {
    const { arg } = meta;
    const { keepLoading = false } = arg;
    if (typeof payload === 'string') {
      state.loading = {
        severity: false,
        message: '',
        type: statusConstants.IDLE_STATUS,
      };
    } else if (payload && payload.data) {
      const entity = payload.data;
      const entries = [...entity.entries];
      const differences = entity?.differences ?? [];

      state.entity = {
        ...entity,
        entries: entries.map((e) => {
          const selectedDifference = differences.find(
            (d) => Number(d.item) === Number(e.id)
          );
          delete selectedDifference?.new?.position;
          delete selectedDifference?.original?.position;
          const type = selectedDifference?.type;
          const allowedVersion = e?.version > 1;
          const hasNewChanges =
            selectedDifference &&
            allowedVersion &&
            !isEqual(selectedDifference?.new, selectedDifference?.original);
          return {
            ...e,
            tooltipText: type ? changesTypes[type] : '',
            hasNewChanges,
          };
        }),
        saved: false,
        sent: false,
        note:
          payload.data.note && payload.data.note.text
            ? payload.data.note
            : { text: 'There are no general notes for this itemised list.' },
        programme: '',
      };
    }
    if (!keepLoading) {
      state.loading = {
        severity: false,
        message: '',
        type: statusConstants.IDLE_STATUS,
      };
    }
  },
  [fetchBoQByTenderId.rejected]: (state) => {
    state.loading = {
      severity: 'error',
      message: 'Loading BoQ Entity failed',
      type: statusConstants.FAILURE_STATUS,
    };
  },
  /// End Quotes To delete
  [fetchUnits.pending]: () => {},
  [fetchUnits.fulfilled]: (state, { payload }) => {
    state.units =
      payload && payload.data
        ? payload.data.map((d) => ({ ...d, value: d.id, label: d.symbol }))
        : [];
  },
  [fetchUnits.rejected]: () => {},
  [fetchProjectStatuses.pending]: () => {},
  [fetchProjectStatuses.fulfilled]: (state, { payload }) => {
    if (payload && payload.data) {
      const object = payload.data.reduce(
        (obj, item) => Object.assign(obj, { [item.label]: item }),
        {}
      );
      state.projectStatuses = object;
      if (state.entities?.length) {
        state.entities = state.entities.map((entity) => ({
          ...entity,
          editing: resolveBoqEditingAfterListFetch(
            entity,
            entity.entries,
            state.projectStatuses
          ),
        }));
      }
    }
  },
  [fetchProjectStatuses.rejected]: () => {},
  [createEntity.pending]: () => {},
  [createEntity.fulfilled]: () => {},
  [createEntity.rejected]: () => {},
  [updateEntity.pending]: (state, action) => {
    const id = action?.meta?.arg?.id;
    const isNewBoqReset = Boolean(action?.meta?.arg?.data?.is_new);
    if (id) {
      state.uiLoading = state.uiLoading || {};
      state.uiLoading.updateEntityById = {
        ...(state.uiLoading.updateEntityById || {}),
        [id]: true,
      };
      if (isNewBoqReset) {
        state.uiLoading.newBoqResetById = {
          ...(state.uiLoading.newBoqResetById || {}),
          [id]: true,
        };
      }
    }
    state.loading = {
      severity: 'info',
      message: 'Updating BoQ Entity',
      type: statusConstants.LOADING_STATUS,
    };
  },
  [updateEntity.fulfilled]: (state, { meta, payload }) => {
    const { arg } = meta;
    const { id, data } = arg;
    // Keep updateEntityById until fetchBoQList completes (see fulfilled handler).
    // httpHelper (v1) returns response.statusText on non-2xx instead of rejecting (e.g. PATCH 404 → "Not Found").
    if (typeof payload === 'string') {
      if (id && state.uiLoading) {
        const nextUi = releaseBoqBusyFlagsForPackage(state.uiLoading, id);
        state.uiLoading.updateEntityById = nextUi.updateEntityById;
        state.uiLoading.newBoqResetById = nextUi.newBoqResetById;
      }
      if (id && state.aiGetPollStickyById?.[id]) {
        const nextSticky = { ...state.aiGetPollStickyById };
        delete nextSticky[id];
        state.aiGetPollStickyById = nextSticky;
      }
      state.loading = {
        severity: 'error',
        message: payload || 'Updating BoQ Entity failed',
        type: statusConstants.FAILURE_STATUS,
      };
      return;
    }
    const { entries, notes } = data;
    const entities = [...state.entities].map((entity) =>
      Number(entity.id) === id
        ? {
            ...entity,
            entries: entries.map((e) => ({
              ...e,
              edited: true,
              id: e.id || uuidv4(),
            })),
            note: { ...entity.note, text: notes && notes.text },
          }
        : entity
    );
    state.entities = entities;
    state.loading = {
      severity: false,
      message: '',
      type: statusConstants.IDLE_STATUS,
    };
  },
  [updateEntity.rejected]: (state, action) => {
    const id = action?.meta?.arg?.id;
    if (id && state.uiLoading?.updateEntityById?.[id]) {
      const next = { ...state.uiLoading.updateEntityById };
      delete next[id];
      state.uiLoading.updateEntityById = next;
    }
    if (id && state.uiLoading?.newBoqResetById?.[id]) {
      const nextReset = { ...state.uiLoading.newBoqResetById };
      delete nextReset[id];
      state.uiLoading.newBoqResetById = nextReset;
    }
    if (id && state.aiGetPollStickyById?.[id]) {
      const nextSticky = { ...state.aiGetPollStickyById };
      delete nextSticky[id];
      state.aiGetPollStickyById = nextSticky;
    }
    state.loading = {
      severity: 'error',
      message: 'Updating BoQ Entity failed',
      type: statusConstants.FAILURE_STATUS,
    };
  },
  [publishBoQ.pending]: (state) => {
    const id = state?.entity?.id;
    if (id) {
      state.uiLoading = state.uiLoading || {};
      state.uiLoading.publishById = {
        ...(state.uiLoading.publishById || {}),
        [id]: true,
      };
    }
    state.loading = {
      severity: 'info',
      message: 'Publishing BoQ',
      type: statusConstants.LOADING_STATUS,
    };
  },
  [publishBoQ.fulfilled]: (state, { payload, meta }) => {
    const entityId = meta?.arg?.id;
    if (entityId && state.uiLoading?.publishById?.[entityId]) {
      const next = { ...state.uiLoading.publishById };
      delete next[entityId];
      state.uiLoading.publishById = next;
    }
    if (payload && payload.success) {
      const { arg } = meta;
      const { id: publishedEntityId, status } = arg;
      const entities = [...state.entities];
      const projectStatuses = { ...state.projectStatuses };
      const publishedStatus = projectStatuses
        ? projectStatuses.published
        : { id: 0 };
      state.entities = entities.map((entity) => {
        const { entries } = entity;
        const newEntries = entries.map((entry) => ({
          ...entry,
          item_version: {
            ...entry.item_version,
            status: publishedStatus.id,
            version: entry.item_version.version,
          },
        }));
        return Number(entity.id) === publishedEntityId
          ? {
              ...entity,
              status,
              has_published_version:
                Number(status) === Number(publishedStatus.id),
              entries: newEntries,
            }
          : entity;
      });
    }
    state.loading = {
      severity: false,
      message: '',
      type: statusConstants.IDLE_STATUS,
    };
  },
  [publishBoQ.rejected]: (state, action) => {
    const id = action?.meta?.arg?.id;
    if (id && state.uiLoading?.publishById?.[id]) {
      const next = { ...state.uiLoading.publishById };
      delete next[id];
      state.uiLoading.publishById = next;
    }
    state.loading = {
      severity: 'error',
      message: 'Publishing BoQ failed',
      type: statusConstants.FAILURE_STATUS,
    };
  },
  [republishBoQ.pending]: (state, action) => {
    const id = action?.meta?.arg?.id;
    if (id) {
      state.uiLoading = state.uiLoading || {};
      state.uiLoading.publishById = {
        ...(state.uiLoading.publishById || {}),
        [id]: true,
      };
    }
    state.loading = {
      severity: 'info',
      message: 'Republish BoQ',
      type: statusConstants.LOADING_STATUS,
    };
  },
  [republishBoQ.fulfilled]: (state, { payload, meta }) => {
    const entityId = meta?.arg?.id;
    if (entityId && state.uiLoading?.publishById?.[entityId]) {
      const next = { ...state.uiLoading.publishById };
      delete next[entityId];
      state.uiLoading.publishById = next;
    }
    if (payload && payload.success) {
      const { arg } = meta;
      const { id: republishedEntityId } = arg;
      const entities = [...state.entities];
      const projectStatuses = { ...state.projectStatuses };
      const publishedStatus = projectStatuses
        ? projectStatuses.published
        : { id: 0 };
      state.entities = entities.map((entity) => {
        const { entries } = entity;
        const newEntries = entries.map((entry) => ({
          ...entry,
          item_version: {
            ...entry.item_version,
            status: publishedStatus.id,
            version: entry.item_version.version,
          },
        }));
        return Number(entity.id) === republishedEntityId
          ? {
              ...entity,
              has_published_version: true,
              editing: false,
              entries: newEntries,
            }
          : entity;
      });
    }
    state.loading = {
      severity: false,
      message: '',
      type: statusConstants.IDLE_STATUS,
    };
  },
  [republishBoQ.rejected]: (state, action) => {
    const id = action?.meta?.arg?.id;
    if (id && state.uiLoading?.publishById?.[id]) {
      const next = { ...state.uiLoading.publishById };
      delete next[id];
      state.uiLoading.publishById = next;
    }
    state.loading = {
      severity: 'error',
      message: 'Republish BoQ failed',
      type: statusConstants.FAILURE_STATUS,
    };
  },
  [quoteItems.pending]: (state) => {
    state.loading = {
      severity: 'info',
      message: 'Quoting an Item',
      type: statusConstants.LOADING_STATUS,
    };
    state.loadedQuotes = false;
  },
  [quoteItems.fulfilled]: (state, { payload, meta }) => {
    if (payload && payload.data) {
      const { arg } = meta;
      const { body } = arg;
      const entity = { ...state.entity };
      const quotes = { quoteItems: [], note: '' };
      [...body.entries()].forEach(([key, value]) => {
        const quoteItemsMatch = key.match(/quoteItems\[(\d+)\]\['(\w+)'\]/);
        if (quoteItemsMatch) {
          const index = parseInt(quoteItemsMatch[1], 10);
          const property = quoteItemsMatch[2];
          if (!quotes.quoteItems[index]) {
            quotes.quoteItems[index] = {};
          }
          quotes.quoteItems[index][property] = value;
        } else {
          quotes[key] = value;
        }

        if (key === 'note') {
          // :(
          entity.quote_exclusion = value;
        } else if (key === 'programme') {
          entity.programme = Number(value);
        }
      });

      const sentQuotes = {};
      quotes.quoteItems.forEach((q) => {
        sentQuotes[q.boq_item_id] = q;
      });

      const response = {};
      if (payload && payload.data && payload.data.length) {
        payload.data.forEach((i) => {
          const [sentQuote] = quotes.quoteItems.filter(
            (q) => Number(q.boq_item_id) === Number(i.boq_item_id)
          );
          response[i.boq_item_id] = {
            boq_quote_item_id: i.new_quote_item_id,
            rate: sentQuote ? sentQuote.rate : 0,
          };
          if (sentQuote) {
            delete sentQuotes[i.boq_item_id];
          }
        });
      }

      const newData = { ...response, ...sentQuotes };
      const entries = entity.entries.map((entry) =>
        quotes.quoteItems
          .map((item) => Number(item.boq_item_id))
          .includes(Number(entry.id))
          ? {
              ...entry,
              rate: newData[Number(entry.id)].rate,
              boq_quote_item_id: newData[Number(entry.id)].boq_quote_item_id,
            }
          : entry
      );
      state.entity = { ...entity, entries };
    }
    state.loadedQuotes = true;
    state.loading = {
      severity: false,
      message: '',
      type: statusConstants.IDLE_STATUS,
    };
  },
  [quoteItems.rejected]: (state) => {
    state.loading = {
      severity: 'error',
      message: 'Quoting an Item failed',
      type: statusConstants.FAILURE_STATUS,
    };
  },
  [quoteItemsDocs.pending]: () => {},
  [quoteItemsDocs.fulfilled]: () => {},
  [quoteItemsDocs.rejected]: () => {},
  [publishQuote.pending]: (state) => {
    state.loading = {
      severity: 'info',
      message: 'Publishing',
      type: statusConstants.LOADING_STATUS,
    };
    state.loadedQuotes = false;
  },
  [publishQuote.fulfilled]: (state, { payload }) => {
    if (payload && payload.data && payload.data.success) {
      state.published = true;
    }
    state.loading = {
      severity: false,
      message: '',
      type: statusConstants.IDLE_STATUS,
    };
  },
  [publishQuote.rejected]: (state) => {
    state.loading = {
      severity: 'error',
      message: 'Publishing failed',
      type: statusConstants.FAILURE_STATUS,
    };
  },
  [republishQuote.pending]: (state) => {
    state.loading = {
      severity: 'info',
      message: 'Republishing',
      type: statusConstants.LOADING_STATUS,
    };
    state.loadedQuotes = false;
  },
  [republishQuote.fulfilled]: (state, { payload }) => {
    if (payload && payload.data && payload.data.success) {
      state.published = true;
    }
    state.loading = {
      severity: false,
      message: '',
      type: statusConstants.IDLE_STATUS,
    };
  },
  [republishQuote.rejected]: (state) => {
    state.loading = {
      severity: 'error',
      message: 'Republishing failed',
      type: statusConstants.FAILURE_STATUS,
    };
  },
  [fetchOrderTemplates.pending]: () => {},
  [fetchOrderTemplates.fulfilled]: (state, { payload }) => {
    state.orderTemplates = payload;
    return state;
  },
  [fetchOrderTemplates.rejected]: () => {},
  [changeCompliance.pending]: () => {},
  [changeCompliance.fulfilled]: (state, action) => {
    const { meta } = action;
    const { arg } = meta;
    const { toggle } = arg;
    state.quotes = state.quotes.map((quote) => {
      if (quote.id === arg.id) {
        return {
          ...quote,
          compliant: toggle ? 1 : 0,
        };
      }
      return quote;
    });
  },
  [changeCompliance.rejected]: () => {},
  [fetchQuoteHistory.pending]: () => {},
  [fetchQuoteHistory.fulfilled]: (state, { payload }) => {
    state.quoteHistory = (payload && payload.data) || [];
  },
  [fetchQuoteHistory.rejected]: () => {},
};
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
