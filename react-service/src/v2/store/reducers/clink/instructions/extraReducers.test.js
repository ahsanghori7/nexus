import { produce } from 'immer';
import extraReducers, {
  fetchInstructions,
  fetchInstruction,
  fetchStatus,
  fetchType,
  fetchSubcontractors,
  deleteInstruction,
  fetchForecastList,
  createInstruction,
  updateInstruction,
} from './extraReducers';

// Mock lodash functions used in extraReducers.js
jest.mock('lodash/isArray', () => jest.fn((value) => Array.isArray(value)));
jest.mock('lodash/isEmpty', () => jest.fn((value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0;
  return false;
}));

// Mock renderTextWithoutHtml
jest.mock('v2/helpers/data', () => ({
  renderTextWithoutHtml: jest.fn((html) => html.replace(/<[^>]*>?/gm, '')),
}));

describe('instructions extraReducers', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      status: '',
      blocked: false,
      data: null,
      list: [],
      statusList: [],
      typeList: [],
      subcontractorsList: [],
      forecastList: [],
      editMode: false,
      sentSuccessfully: false,
    };
  });

  // fetchInstructions
  it('should handle fetchInstructions.pending correctly', () => {
    const action = { type: fetchInstructions.pending.type };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchInstructions.pending.type](draft, action);
    });
    expect(state.status).toBe('loading');
    expect(state.list).toEqual([]);
  });

  it('should handle fetchInstructions.fulfilled correctly with payload', () => {
    const mockPayload = [
      { id: 1, description: '<p>Test 1</p>', price: 1000 },
      { id: 2, description: '<p>Test 2</p>', price: 2000 },
    ];
    const action = { type: fetchInstructions.fulfilled.type, payload: mockPayload };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchInstructions.fulfilled.type](draft, action);
    });
    expect(state.status).toBe('');
    expect(state.list).toEqual([
      { id: 1, description: 'Test 1', price: 10 },
      { id: 2, description: 'Test 2', price: 20 },
    ]);
  });

  it('should handle fetchInstructions.fulfilled correctly with empty payload', () => {
    const action = { type: fetchInstructions.fulfilled.type, payload: [] };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchInstructions.fulfilled.type](draft, action);
    });
    expect(state.status).toBe('');
    expect(state.list).toEqual([]);
  });

  it('should handle fetchInstructions.rejected correctly', () => {
    const action = { type: fetchInstructions.rejected.type };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchInstructions.rejected.type](draft, action);
    });
    expect(state.status).toBe('error');
    expect(state.list).toEqual([]);
  });

  // fetchInstruction
  it('should handle fetchInstruction.pending correctly', () => {
    const action = { type: fetchInstruction.pending.type, meta: { arg: { hideLoading: false } } };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchInstruction.pending.type](draft, action);
    });
    expect(state.status).toBe('loading');
  });

  it('should handle fetchInstruction.pending with hideLoading true', () => {
    const action = { type: fetchInstruction.pending.type, meta: { arg: { hideLoading: true } } };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchInstruction.pending.type](draft, action);
    });
    expect(state.status).toBe('');
  });

  it('should handle fetchInstruction.fulfilled correctly with full payload', () => {
    const mockPayload = {
      id: 1,
      subcontractor: { id: '10', name: 'Sub A', packages: { p1: 'Package 1' } },
      documents: [{ id: '101', name: 'Doc 1' }],
      price: 5000,
      otherData: 'abc',
    };
    const action = { type: fetchInstruction.fulfilled.type, payload: mockPayload };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchInstruction.fulfilled.type](draft, action);
    });
    expect(state.data).toEqual({
      id: 1,
      subcontractor: { id: 10, label: 'Sub A', packages: ['Package 1'] },
      documents: [{ id: 101, name: 'Doc 1' }],
      price: 50,
      otherData: 'abc',
    });
    expect(state.status).toBe('');
  });

  it('should handle fetchInstruction.fulfilled correctly with empty payload', () => {
    const action = { type: fetchInstruction.fulfilled.type, payload: null };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchInstruction.fulfilled.type](draft, action);
    });
    expect(state.data).toEqual({
      subcontractor: {},
      documents: [],
      price: 0,
    });
    expect(state.status).toBe('');
  });

  it('should handle fetchInstruction.rejected correctly', () => {
    const action = { type: fetchInstruction.rejected.type };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchInstruction.rejected.type](draft, action);
    });
    expect(state.status).toBe('error');
    expect(state.data).toBeNull();
  });

  // fetchStatus
  it('should handle fetchStatus.pending correctly', () => {
    const action = { type: fetchStatus.pending.type };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchStatus.pending.type](draft, action);
    });
    expect(state.statusList).toEqual([]);
  });

  it('should handle fetchStatus.fulfilled correctly', () => {
    const mockPayload = [{ id: 1, name: 'Status 1' }];
    const action = { type: fetchStatus.fulfilled.type, payload: mockPayload };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchStatus.fulfilled.type](draft, action);
    });
    expect(state.statusList).toEqual(mockPayload);
  });

  it('should handle fetchStatus.rejected correctly', () => {
    const action = { type: fetchStatus.rejected.type };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchStatus.rejected.type](draft, action);
    });
    expect(state.statusList).toEqual([]);
  });

  // fetchType
  it('should handle fetchType.pending correctly', () => {
    const action = { type: fetchType.pending.type };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchType.pending.type](draft, action);
    });
    expect(state.typeList).toEqual([]);
  });

  it('should handle fetchType.fulfilled correctly', () => {
    const mockPayload = [{ id: 1, name: 'Type 1' }];
    const action = { type: fetchType.fulfilled.type, payload: mockPayload };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchType.fulfilled.type](draft, action);
    });
    expect(state.typeList).toEqual(mockPayload);
  });

  it('should handle fetchType.rejected correctly', () => {
    const action = { type: fetchType.rejected.type };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchType.rejected.type](draft, action);
    });
    expect(state.typeList).toEqual([]);
  });

  // fetchSubcontractors
  it('should handle fetchSubcontractors.pending without state change', () => {
    const action = { type: fetchSubcontractors.pending.type };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchSubcontractors.pending.type](draft, action);
    });
    expect(state).toEqual(initialState);
  });

  it('should handle fetchSubcontractors.fulfilled correctly', () => {
    const mockPayload = [
      { id: '1', name: 'Sub A', packages: { p1: 'Package 1' } },
      { id: '2', name: 'Sub B', packages: { p2: 'Package 2' } },
    ];
    const action = { type: fetchSubcontractors.fulfilled.type, payload: mockPayload };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchSubcontractors.fulfilled.type](draft, action);
    });
    expect(state.subcontractorsList).toEqual([
      { id: 1, label: 'Sub A', packages: ['Package 1'] },
      { id: 2, label: 'Sub B', packages: ['Package 2'] },
    ]);
    expect(state.status).toBe('');
  });

  it('should handle fetchSubcontractors.rejected correctly', () => {
    const action = { type: fetchSubcontractors.rejected.type };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchSubcontractors.rejected.type](draft, action);
    });
    expect(state.subcontractorsList).toEqual([]);
    expect(state.status).toBe('error');
  });

  // deleteInstruction
  it('should handle deleteInstruction.pending correctly', () => {
    const action = { type: deleteInstruction.pending.type };
    const state = produce(initialState, (draft) => {
      extraReducers[deleteInstruction.pending.type](draft, action);
    });
    expect(state.status).toBe('loading');
  });

  it('should handle deleteInstruction.fulfilled correctly', () => {
    initialState.list = [{ id: 1 }, { id: 2 }];
    const action = { type: deleteInstruction.fulfilled.type, meta: { arg: 1 } };
    const state = produce(initialState, (draft) => {
      extraReducers[deleteInstruction.fulfilled.type](draft, action);
    });
    expect(state.status).toBe('');
    expect(state.list).toEqual([{ id: 2 }]);
  });

  it('should handle deleteInstruction.rejected correctly', () => {
    const action = { type: deleteInstruction.rejected.type };
    const state = produce(initialState, (draft) => {
      extraReducers[deleteInstruction.rejected.type](draft, action);
    });
    expect(state.status).toBe('error');
  });

  // fetchForecastList
  it('should handle fetchForecastList.pending correctly', () => {
    const action = { type: fetchForecastList.pending.type };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchForecastList.pending.type](draft, action);
    });
    expect(state.status).toBe('loading');
  });

  it('should handle fetchForecastList.fulfilled correctly with payload', () => {
    const mockPayload = [
      { tid: 1, budget: 1000, omissions: 100, order: 500, total: 1500, variations: 200 },
      { tid: 2, budget: 2000, omissions: 200, order: 600, total: 2500, variations: 300 },
    ];
    const action = { type: fetchForecastList.fulfilled.type, payload: mockPayload };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchForecastList.fulfilled.type](draft, action);
    });

    expect(state.status).toBe('');
    expect(state.forecastList.length).toBe(3); // 2 items + 1 total row
    expect(state.forecastList[0].budget).toBe(10);
    expect(state.forecastList[1].budget).toBe(20);
    expect(state.forecastList[2].package).toBe('TOTALS');
    expect(state.forecastList[2].order).toBe(11); // 5 + 6
    expect(state.forecastList[2].variations).toBe(5); // 2 + 3
    expect(state.forecastList[2].omissions).toBe(3); // 1 + 2
    expect(state.forecastList[2].budget).toBe(30); // 10 + 20
    expect(state.forecastList[2].total).toBe(40); // 15 + 25
  });

  it('should handle fetchForecastList.fulfilled correctly with empty payload', () => {
    const action = { type: fetchForecastList.fulfilled.type, payload: [] };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchForecastList.fulfilled.type](draft, action);
    });
    expect(state.status).toBe('');
    expect(state.forecastList.length).toBe(1); // Only total row
    expect(state.forecastList[0].package).toBe('TOTALS');
    expect(state.forecastList[0].order).toBe(0);
  });

  it('should handle fetchForecastList.rejected correctly', () => {
    const action = { type: fetchForecastList.rejected.type };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchForecastList.rejected.type](draft, action);
    });
    expect(state.status).toBe('Error loading forecast list');
  });

  // createInstruction
  it('should handle createInstruction.pending correctly', () => {
    const action = { type: createInstruction.pending.type };
    const state = produce(initialState, (draft) => {
      extraReducers[createInstruction.pending.type](draft, action);
    });
    expect(state.status).toBe('');
  });

  it('should handle createInstruction.fulfilled correctly with success', () => {
    const action = { type: createInstruction.fulfilled.type, payload: { id: 123, success: true } };
    const state = produce(initialState, (draft) => {
      extraReducers[createInstruction.fulfilled.type](draft, action);
    });
    expect(state.data).toEqual({ id: 123 });
    expect(state.status).toBe('');
  });

  it('should handle createInstruction.fulfilled correctly without success', () => {
    const action = { type: createInstruction.fulfilled.type, payload: { id: 123, success: false } };
    const state = produce(initialState, (draft) => {
      extraReducers[createInstruction.fulfilled.type](draft, action);
    });
    expect(state.data).toBeNull(); // data should not be set if not successful
    expect(state.status).toBe('');
  });

  it('should handle createInstruction.rejected correctly', () => {
    const action = { type: createInstruction.rejected.type };
    const state = produce(initialState, (draft) => {
      extraReducers[createInstruction.rejected.type](draft, action);
    });
    expect(state.status).toBe('');
  });

  // updateInstruction
  it('should handle updateInstruction.pending correctly', () => {
    const action = { type: updateInstruction.pending.type };
    const state = produce(initialState, (draft) => {
      extraReducers[updateInstruction.pending.type](draft, action);
    });
    expect(state.status).toBe('loading');
  });

  it('should handle updateInstruction.fulfilled correctly with success', () => {
    initialState.data = { id: 1, oldProp: 'value' };
    const action = {
      type: updateInstruction.fulfilled.type,
      payload: { success: true },
      meta: { arg: { instruction: { description: 'New Desc', price: 7500, status: 1 } } },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[updateInstruction.fulfilled.type](draft, action);
    });
    expect(state.status).toBe('');
    expect(state.data).toEqual({ id: 1, oldProp: 'value', description: 'New Desc', price: 75 });
    expect(state.sentSuccessfully).toBe(true);
  });

  it('should handle updateInstruction.fulfilled correctly without success', () => {
    initialState.data = { id: 1, oldProp: 'value' };
    const action = {
      type: updateInstruction.fulfilled.type,
      payload: { success: false },
      meta: { arg: { instruction: { description: 'New Desc', price: 7500, status: 0 } } },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[updateInstruction.fulfilled.type](draft, action);
    });
    expect(state.status).toBe('send-instruction-error');
    expect(state.data).toEqual({ id: 1, oldProp: 'value' }); // data should not be updated
    expect(state.sentSuccessfully).toBe(false);
  });

  it('should handle updateInstruction.rejected correctly', () => {
    const action = { type: updateInstruction.rejected.type };
    const state = produce(initialState, (draft) => {
      extraReducers[updateInstruction.rejected.type](draft, action);
    });
    expect(state.status).toBe('send-instruction-error');
  });
});
