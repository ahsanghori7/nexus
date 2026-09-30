import reducer, { fetchConstants } from './index';

// Mock the services and helpers
jest.mock('services/clinkHelpers', () => ({
  fetchData: jest.fn(),
}));

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    if (key === 'currency') return '$';
    return key;
  }),
}));

describe('constants reducer', () => {
  const initialState = {
    project: {},
    pricing_document: {},
    tender: {},
    default_categories: {},
    regions: [],
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle fetchConstants.pending', () => {
    const action = { type: fetchConstants.pending.type };
    const state = reducer(initialState, action);
    expect(state).toEqual(initialState);
  });

  it('should handle fetchConstants.fulfilled with basic payload', () => {
    const payload = {
      default_categories: { category1: 'value1' },
      pricing_document: { doc1: 'value1' },
      tender: {
        size: {
          small: '£10,000',
          medium: '£50,000',
        },
      },
      project: {
        insurances: ['£1,000,000 liability', '£500,000 professional'],
      },
    };

    const action = {
      type: fetchConstants.fulfilled.type,
      payload,
    };

    const expectedState = {
      ...initialState,
      default_categories: { category1: 'value1' },
      pricing_document: { doc1: 'value1' },
      tender: {
        size: {
          small: '$10,000',
          medium: '$50,000',
        },
      },
      project: {
        insurances: ['$1,000,000 liability', '$500,000 professional'],
      },
    };

    const state = reducer(initialState, action);
    expect(state).toEqual(expectedState);
  });

  it('should handle fetchConstants.fulfilled with empty tender and project', () => {
    const payload = {
      default_categories: {},
      pricing_document: {},
    };

    const action = {
      type: fetchConstants.fulfilled.type,
      payload,
    };

    const expectedState = {
      ...initialState,
      default_categories: {},
      pricing_document: {},
      tender: {
        size: {},
      },
      project: {
        insurances: [],
      },
    };

    const state = reducer(initialState, action);
    expect(state).toEqual(expectedState);
  });

  it('should handle fetchConstants.fulfilled with undefined tender.size', () => {
    const payload = {
      default_categories: {},
      pricing_document: {},
      tender: {},
      project: {},
    };

    const action = {
      type: fetchConstants.fulfilled.type,
      payload,
    };

    const expectedState = {
      ...initialState,
      default_categories: {},
      pricing_document: {},
      tender: {
        size: {},
      },
      project: {
        insurances: [],
      },
    };

    const state = reducer(initialState, action);
    expect(state).toEqual(expectedState);
  });

  it('should handle fetchConstants.rejected', () => {
    const action = { type: fetchConstants.rejected.type };
    const state = reducer(initialState, action);
    expect(state).toEqual(initialState);
  });

  it('should handle currency replacement in tender sizes', () => {
    const payload = {
      default_categories: {},
      pricing_document: {},
      tender: {
        size: {
          large: '£100,000 - £500,000',
          extra_large: 'Over £500,000',
        },
      },
      project: {},
    };

    const action = {
      type: fetchConstants.fulfilled.type,
      payload,
    };

    const state = reducer(initialState, action);
    expect(state.tender.size.large).toBe('$100,000 - $500,000');
    expect(state.tender.size.extra_large).toBe('Over $500,000');
  });

  it('should handle currency replacement in project insurances', () => {
    const payload = {
      default_categories: {},
      pricing_document: {},
      project: {
        insurances: [
          '£2,000,000 public liability',
          'Professional indemnity £1,000,000',
          '£500,000 employers liability',
        ],
      },
    };

    const action = {
      type: fetchConstants.fulfilled.type,
      payload,
    };

    const state = reducer(initialState, action);
    expect(state.project.insurances).toEqual([
      '$2,000,000 public liability',
      'Professional indemnity $1,000,000',
      '$500,000 employers liability',
    ]);
  });
});
