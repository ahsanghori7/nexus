import extraReducers, { fetchConstants } from './extraReducers';
import { fetchData } from 'services/clinkHelpers';
import i18next from 'v2/helpers/i18n';

// Mock the dependencies
jest.mock('services/clinkHelpers');
jest.mock('v2/helpers/i18n');

const mockFetchData = fetchData;
const mockI18next = i18next;

describe('constants extraReducers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockI18next.t.mockImplementation((key) => {
      if (key === 'currency') return '$';
      return key;
    });
  });

  describe('fetchConstants async thunk', () => {
    it('should create fetchConstants with correct type', () => {
      expect(fetchConstants.typePrefix).toBe('clink/fetchConstants');
    });

    it('should call fetchData with correct parameters', async () => {
      const mockData = { test: 'data' };
      mockFetchData.mockResolvedValue(mockData);

      const dispatch = jest.fn();
      const getState = jest.fn();

      await fetchConstants()(dispatch, getState, undefined);

      expect(mockFetchData).toHaveBeenCalledWith('project', 'getConstants');
    });
  });

  describe('extraReducers handlers', () => {
    const initialState = {
      project: {},
      pricing_document: {},
      tender: {},
      default_categories: {},
      regions: [],
    };

    it('should handle pending state correctly', () => {
      const pendingHandler = extraReducers[fetchConstants.pending];
      const result = pendingHandler();
      expect(result).toBeUndefined();
    });

    it('should handle rejected state correctly', () => {
      const rejectedHandler = extraReducers[fetchConstants.rejected];
      const result = rejectedHandler();
      expect(result).toBeUndefined();
    });

    it('should handle fulfilled state with complete payload', () => {
      const state = { ...initialState };
      const payload = {
        default_categories: { cat1: 'value1' },
        pricing_document: { doc1: 'value1' },
        tender: {
          size: {
            small: 'Up to £10,000',
            medium: '£10,000 - £50,000',
            large: 'Over £50,000',
          },
          type: 'public',
        },
        project: {
          insurances: [
            'Public liability £1,000,000',
            'Professional indemnity £500,000',
          ],
          other_field: 'value',
        },
      };

      const action = { payload };
      const fulfilledHandler = extraReducers[fetchConstants.fulfilled];
      fulfilledHandler(state, action);

      expect(state.default_categories).toEqual({ cat1: 'value1' });
      expect(state.pricing_document).toEqual({ doc1: 'value1' });
      expect(state.tender).toEqual({
        type: 'public',
        size: {
          small: 'Up to $10,000',
          medium: '$10,000 - $50,000',
          large: 'Over $50,000',
        },
      });
      expect(state.project).toEqual({
        other_field: 'value',
        insurances: [
          'Public liability $1,000,000',
          'Professional indemnity $500,000',
        ],
      });
    });

    it('should handle fulfilled state with empty tender and project', () => {
      const state = { ...initialState };
      const payload = {
        default_categories: {},
        pricing_document: {},
        tender: {},
        project: {},
      };

      const action = { payload };
      const fulfilledHandler = extraReducers[fetchConstants.fulfilled];
      fulfilledHandler(state, action);

      expect(state.tender).toEqual({ size: {} });
      expect(state.project).toEqual({ insurances: [] });
    });

    it('should handle fulfilled state with null/undefined tender and project', () => {
      const state = { ...initialState };
      const payload = {
        default_categories: {},
        pricing_document: {},
        tender: null,
        project: null,
      };

      const action = { payload };
      const fulfilledHandler = extraReducers[fetchConstants.fulfilled];
      fulfilledHandler(state, action);

      expect(state.tender).toEqual({ size: {} });
      expect(state.project).toEqual({ insurances: [] });
    });

    it('should handle fulfilled state with missing tender.size', () => {
      const state = { ...initialState };
      const payload = {
        default_categories: {},
        pricing_document: {},
        tender: { type: 'private' },
        project: { other_field: 'test' },
      };

      const action = { payload };
      const fulfilledHandler = extraReducers[fetchConstants.fulfilled];
      fulfilledHandler(state, action);

      expect(state.tender).toEqual({
        type: 'private',
        size: {},
      });
      expect(state.project).toEqual({
        other_field: 'test',
        insurances: [],
      });
    });

    it('should handle multiple currency symbols in strings', () => {
      const state = { ...initialState };
      const payload = {
        default_categories: {},
        pricing_document: {},
        tender: {
          size: {
            range: '£5,000 to £15,000 (£10,000 average)',
          },
        },
        project: {
          insurances: ['£1,000,000 + £500,000 combined coverage'],
        },
      };

      const action = { payload };
      const fulfilledHandler = extraReducers[fetchConstants.fulfilled];
      fulfilledHandler(state, action);

      expect(state.tender.size.range).toBe('$5,000 to $15,000 ($10,000 average)');
      expect(state.project.insurances[0]).toBe('$1,000,000 + $500,000 combined coverage');
    });

    it('should handle empty insurances array', () => {
      const state = { ...initialState };
      const payload = {
        default_categories: {},
        pricing_document: {},
        project: {
          insurances: [],
        },
      };

      const action = { payload };
      const fulfilledHandler = extraReducers[fetchConstants.fulfilled];
      fulfilledHandler(state, action);

      expect(state.project.insurances).toEqual([]);
    });
  });
});