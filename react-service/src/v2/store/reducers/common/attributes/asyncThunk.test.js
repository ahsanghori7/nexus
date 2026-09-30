import { fetchRegions, fetchTrades, fetchProjectType, fetchPublicTrades } from './asyncThunk';
import { httpHelperV2 } from 'v2/services/httpHelper';

// Mock the httpHelper service
jest.mock('v2/services/httpHelper', () => ({
  httpHelperV2: jest.fn(),
}));

describe('attributes asyncThunk', () => {
  const dispatch = jest.fn();
  const getState = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchRegions', () => {
    it('should create an action with correct type string', () => {
      expect(fetchRegions.typePrefix).toBe('attribute/category/region_category');
    });

    it('should call httpHelper with correct URL for regions', async () => {
      const mockResponse = { data: [{ id: 1, name: 'Region 1' }] };
      httpHelperV2.mockResolvedValue(mockResponse);

      const thunk = fetchRegions();
      const result = await thunk(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'attribute/category/region_category/attributes',
      });
      expect(result.payload).toEqual(mockResponse);
    });

    it('should handle fetchRegions error', async () => {
      const error = new Error('Network error');
      httpHelperV2.mockRejectedValue(error);

      const thunk = fetchRegions();
      const result = await thunk(dispatch, getState, undefined);

      expect(result.type).toBe('attribute/category/region_category/rejected');
    });
  });

  describe('fetchTrades', () => {
    it('should create an action with correct type string', () => {
      expect(fetchTrades.typePrefix).toBe('attribute/category/trades');
    });

    it('should call httpHelper with correct URL for trades', async () => {
      const accountId = '123';
      const mockResponse = { data: [{ id: 1, name: 'Trade 1' }] };
      httpHelperV2.mockResolvedValue(mockResponse);

      const thunk = fetchTrades(accountId);
      const result = await thunk(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: `attribute/category/account_trade/group_id/${accountId}/attributes`,
      });
      expect(result.payload).toEqual(mockResponse);
    });

    it('should handle fetchTrades error', async () => {
      const accountId = '123';
      const error = new Error('Network error');
      httpHelperV2.mockRejectedValue(error);

      const thunk = fetchTrades(accountId);
      const result = await thunk(dispatch, getState, undefined);

      expect(result.type).toBe('attribute/category/trades/rejected');
    });
  });

  describe('fetchPublicTrades', () => {
    it('should create an action with correct type string', () => {
      expect(fetchPublicTrades.typePrefix).toBe('attribute/category/public_trades');
    });

    it('should call httpHelper with correct URL for public trades', async () => {
      const mockResponse = { data: [{ id: 1, name: 'Public Trade 1' }] };
      httpHelperV2.mockResolvedValue(mockResponse);

      const thunk = fetchPublicTrades();
      const result = await thunk(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'public/attribute',
      });
      expect(result.payload).toEqual(mockResponse);
    });

    it('should handle fetchPublicTrades error', async () => {
      const error = new Error('Network error');
      httpHelperV2.mockRejectedValue(error);

      const thunk = fetchPublicTrades();
      const result = await thunk(dispatch, getState, undefined);

      expect(result.type).toBe('attribute/category/public_trades/rejected');
    });
  });

  describe('fetchProjectType', () => {
    it('should create an action with correct type string', () => {
      expect(fetchProjectType.typePrefix).toBe('attribute/category/project_type_category');
    });

    it('should call httpHelper with correct URL for project type', async () => {
      const mockResponse = { data: [{ id: 1, name: 'Project Type 1' }] };
      httpHelperV2.mockResolvedValue(mockResponse);

      const thunk = fetchProjectType();
      const result = await thunk(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: 'attribute/category/project_type_category/attributes',
      });
      expect(result.payload).toEqual(mockResponse);
    });

    it('should handle fetchProjectType error', async () => {
      const error = new Error('Network error');
      httpHelperV2.mockRejectedValue(error);

      const thunk = fetchProjectType();
      const result = await thunk(dispatch, getState, undefined);

      expect(result.type).toBe('attribute/category/project_type_category/rejected');
    });
  });

  describe('edge cases', () => {
    it('should handle fetchTrades with null accountId', async () => {
      const mockResponse = { data: [] };
      httpHelperV2.mockResolvedValue(mockResponse);

      const thunk = fetchTrades(null);
      await thunk(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: `attribute/category/account_trade/group_id/null/attributes`,
      });
    });

    it('should handle fetchTrades with undefined accountId', async () => {
      const mockResponse = { data: [] };
      httpHelperV2.mockResolvedValue(mockResponse);

      const thunk = fetchTrades(undefined);
      await thunk(dispatch, getState, undefined);

      expect(httpHelperV2).toHaveBeenCalledWith({
        url: `attribute/category/account_trade/group_id/undefined/attributes`,
      });
    });
  });
});