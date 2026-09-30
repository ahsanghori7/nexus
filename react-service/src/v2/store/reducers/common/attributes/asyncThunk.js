import { createAsyncThunk } from '@reduxjs/toolkit';
import { httpHelperV2 as httpHelperService } from 'v2/services/httpHelper';

const fetchRegions = createAsyncThunk(
  'attribute/category/region_category',
  async () => {
    return httpHelperService({
      url: 'attribute/category/region_category/attributes',
    });
  },
);

const fetchTrades = createAsyncThunk(
  'attribute/category/trades',
  async (acountId) => {
    return httpHelperService({
      url: `attribute/category/account_trade/group_id/${acountId}/attributes`,
    });
  },
);

const fetchAsiteFolders = createAsyncThunk(
  'attribute/category/fetchAsiteFolders',
  async () => {
    return httpHelperService({
      url: `document/provider/asite/workspace/folders`,
    });
  },
);

const fetchPublicTrades = createAsyncThunk(
  'attribute/category/public_trades',
  async () => {
    return httpHelperService({
      url: 'public/attribute',
    });
  },
);

const fetchProjectType = createAsyncThunk(
  'attribute/category/project_type_category',
  async () => {
    return httpHelperService({
      url: 'attribute/category/project_type_category/attributes',
    });
  },
);

export { fetchRegions, fetchTrades, fetchProjectType, fetchPublicTrades, fetchAsiteFolders };
