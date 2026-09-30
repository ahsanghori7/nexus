import { createAsyncThunk } from '@reduxjs/toolkit';
import httpRequest, { httpHelperV2 } from 'v2/services/httpHelper';
import Relay from 'v2/services/relay';

/**
 * fetchBoQList accepts a project slug string or `{ slug, releaseBusyForPackageId }`.
 * When releaseBusyForPackageId is set, list fetch completion clears that package's
 * updateEntity / newBoqReset busy flags only (supports concurrent package updates).
 */
export function normalizeFetchBoQListArg(arg) {
  if (typeof arg === 'string') {
    return { slug: arg, releaseBusyForPackageId: undefined };
  }
  if (arg && typeof arg === 'object') {
    return {
      slug: arg.slug,
      releaseBusyForPackageId: arg.releaseBusyForPackageId,
    };
  }
  return { slug: undefined, releaseBusyForPackageId: undefined };
}

export function boqFetchListArg(slug, releaseBusyForPackageId) {
  if (releaseBusyForPackageId == null) {
    return slug;
  }
  return { slug, releaseBusyForPackageId };
}

function omitPackageBusyFlag(map, packageId) {
  if (!map || packageId == null) {
    return map;
  }
  const next = { ...map };
  delete next[packageId];
  delete next[String(packageId)];
  return next;
}

/** Clears per-package PATCH / new-BoQ busy flags after a scoped list refresh. */
export function releaseBoqBusyFlagsForPackage(uiLoading, packageId) {
  if (!uiLoading || packageId == null) {
    return uiLoading;
  }
  return {
    ...uiLoading,
    updateEntityById: omitPackageBusyFlag(uiLoading.updateEntityById, packageId),
    newBoqResetById: omitPackageBusyFlag(uiLoading.newBoqResetById, packageId),
  };
}

const relay = new Relay('relay', '', '');
const fetchOrderTemplates = createAsyncThunk(
  'boq/fetchOrderTemplates',
  async (_, thunkAPI) => {
    try {
      const result = await relay.get('', { action: 'template', method: 'fetchAll', type: 'orders' });
      if (result.status === 200) return result.json();
      return thunkAPI.rejectWithValue(result.status);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.status || error.message);
    }
  }
);

const fetchBoQList = createAsyncThunk('boq/fetchBoQList', async (arg, thunkAPI) => {
  const { slug } = normalizeFetchBoQListArg(arg);
  try {
    return await httpHelperV2({ url: `project/${slug}/boq` });
  } catch (error) {
    return thunkAPI.rejectWithValue({
      message: error?.message || String(error),
      status: error?.status,
    });
  }
});

const fetchBoQQuotes = createAsyncThunk('boq/fetchBoQQuotes', async (boqId, thunkAPI) => {
  try {
    return await httpRequest({ url: `boq/${boqId}/quote` });
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || error);
  }
});

const fetchBoQByTenderId = createAsyncThunk(
  'boq/fetchBoQByTenderId',
  async ({ projectSlug, tid }, thunkAPI) => {
    try {
      return await httpRequest({
        url: `project/${projectSlug}/${tid}/boq`,
      });
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const fetchUnits = createAsyncThunk('boq/fetchUnits', async (_, thunkAPI) => {
  try {
    return await httpRequest({ url: `boq/units` });
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || error);
  }
});

const fetchProjectStatuses = createAsyncThunk(
  'boq/fetchProjectStatuses',
  async (_, thunkAPI) => {
    try {
      return await httpRequest({ url: `boq/project_statuses` });
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const createEntity = createAsyncThunk('boq/createEntity', async (_, thunkAPI) => {
  try {
    return await httpRequest({
      url: `boq/entity`,
      method: 'POST',
    });
  } catch (error) {
    return thunkAPI.rejectWithValue(error.message || error);
  }
});

const updateEntity = createAsyncThunk(
  'boq/updateEntity',
  async ({ id, data = {} }, thunkAPI) => {
    try {
      return await httpRequest({
        url: `boq/entity/${id}`,
        method: 'PATCH',
        body: data,
      });
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const generateBoqWithAI = createAsyncThunk(
  'boq/generateBoqWithAI',
  async ({ packageId, body }, thunkAPI) => {
    try {
      return await httpRequest({
        url: `ai/generate-boq/${packageId}`,
        method: 'POST',
        body,
        isFormData: true,
      });
    } catch (error) {
      return thunkAPI.rejectWithValue({
        message: error?.message || String(error),
        status: error?.status,
      });
    }
  }
);

const fetchGenerateBoqStatus = createAsyncThunk(
  'boq/fetchGenerateBoqStatus',
  async ({ packageId }, thunkAPI) => {
    try {
      // Use v2 helper so non-OK responses reject with numeric HTTP status (e.g. 500 vs 404).
      return await httpHelperV2({
        url: `ai/generate-boq/${packageId}`,
      });
    } catch (error) {
      const rawStatus = error?.status;
      const statusNum =
        rawStatus !== undefined && rawStatus !== null && rawStatus !== ''
          ? Number(rawStatus)
          : NaN;
      return thunkAPI.rejectWithValue({
        message: error?.message || String(error),
        status: Number.isFinite(statusNum) ? statusNum : undefined,
        // Parsed JSON from error response — HTTP may be 500 while body indicates 404 / not found.
        details: error?.response,
      });
    }
  }
);

const publishBoQ = createAsyncThunk(
  'boq/publishBoQ',
  async ({ id, status }, thunkAPI) => {
    try {
      return await httpRequest({
        url: `boq/publish/${id}`,
        method: 'PATCH',
        body: { status },
      });
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const republishBoQ = createAsyncThunk(
  'boq/republishBoQ',
  async ({ id, reason }, thunkAPI) => {
    try {
      return await httpRequest({
        url: `boq/republish_boq/${id}`,
        method: 'POST',
        body: { reason },
      });
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const quoteItems = createAsyncThunk(
  'boq/quoteItems',
  async ({ boq_id, sid, body }, thunkAPI) => {
    try {
      return await httpRequest({
        url: `boq/${boq_id}/quote/${sid}`,
        method: 'POST',
        body,
        isFormData: true,
      });
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const quoteItemsDocs = createAsyncThunk(
  'boq/quoteItemsDocs',
  async ({ boq_id, sid, body }, thunkAPI) => {
    try {
      return await httpRequest({
        url: `boq/${boq_id}/quote/${sid}/document`,
        method: 'POST',
        body,
        isFormData: true,
      });
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const publishQuote = createAsyncThunk(
  'boq/publishQuote',
  async ({ boq_id, sid, reason }, thunkAPI) => {
    try {
      return await httpRequest({
        url: `boq/${boq_id}/quote/${sid}/publish`,
        method: 'PATCH',
        body: reason ? { reason } : null,
      });
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);
const republishQuote = createAsyncThunk(
  'boq/republishQuote',
  async ({ boq_id, sid, reason }, thunkAPI) => {
    try {
      return await httpRequest({
        url: `boq/${boq_id}/quote/${sid}/republish`,
        method: 'PATCH',
        body: reason ? { reason } : null,
      });
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

const changeCompliance = createAsyncThunk(
  'boq/changeCompliance',
  async ({ toggle, pid, id }, thunkAPI) => {
    try {
      const result = await relay.post({ toggle }, '', {
        action: 'transaction',
        method: 'toggledCompliant',
        pid,
        id,
      });
      if (result.status === 200) return result.json();
      return thunkAPI.rejectWithValue(result.status);
    } catch (error) {
      return thunkAPI.rejectWithValue(error.status || error.message);
    }
  }
);

const fetchQuoteHistory = createAsyncThunk(
  'boq/fetchQuoteHistory',
  async ({ boqId }, thunkAPI) => {
    try {
      return await httpRequest({
        url: `boq/${boqId}/quote_history`,
      });
    } catch (error) {
      return thunkAPI.rejectWithValue(error.message || error);
    }
  }
);

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
