import { produce } from 'immer';
import extraReducers, {
  fetchOrders,
  deleteOrder,
  withdrawSentOrder,
  markAsSignOrder,
} from './extraReducers'; // Import the actual async thunks

describe('orders extraReducers', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      list: [],
      loading: false,
    };
  });

  // Test fetchOrders.pending
  it('should handle fetchOrders.pending correctly', () => {
    const action = { type: fetchOrders.pending.type };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchOrders.pending.type](draft, action);
    });
    expect(state.loading).toBe(true);
  });

  // Test fetchOrders.fulfilled
  it('should handle fetchOrders.fulfilled correctly with payload', () => {
    const mockPayload = [
      {
        id: 1,
        name: 'Order 1',
        tender: { id: 1, label: 'Tender A' },
        entries: [],
      },
    ];
    const action = {
      type: fetchOrders.fulfilled.type,
      payload: mockPayload,
    };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchOrders.fulfilled.type](draft, action);
    });
    expect(state.list).toEqual(mockPayload);
    expect(state.loading).toBe(false);
  });

  it('should handle fetchOrders.fulfilled correctly with empty payload', () => {
    const mockPayload = [];
    const action = {
      type: fetchOrders.fulfilled.type,
      payload: mockPayload,
    };
    const state = produce(initialState, (draft) => {
      extraReducers[fetchOrders.fulfilled.type](draft, action);
    });
    expect(state.list).toEqual(mockPayload);
    expect(state.loading).toBe(false); // payload is empty
  });

  // Test fetchOrders.rejected
  it('should handle fetchOrders.rejected correctly', () => {
    const action = { type: fetchOrders.rejected.type };
    initialState.loading = true; // Simulate loading state
    const state = produce(initialState, (draft) => {
      extraReducers[fetchOrders.rejected.type](draft, action);
    });
    expect(state.loading).toBe(false);
  });

  // Test deleteOrder.pending
  it('should handle deleteOrder.pending without state change', () => {
    const action = { type: deleteOrder.pending.type };
    const state = produce(initialState, (draft) => {
      extraReducers[deleteOrder.pending.type](draft, action);
    });
    expect(state).toEqual(initialState);
  });

  // Test deleteOrder.fulfilled
  it('should handle deleteOrder.fulfilled correctly when success is true', () => {
    initialState.list = [
      {
        tender: { id: 1 },
        entries: [{ document: { id: 101 } }, { document: { id: 102 } }],
      },
      {
        tender: { id: 2 },
        entries: [{ document: { id: 201 } }],
      },
    ];
    const action = {
      type: deleteOrder.fulfilled.type,
      payload: { success: true },
      meta: { arg: { tid: 1, did: 101 } },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[deleteOrder.fulfilled.type](draft, action);
    });
    expect(state.list).toEqual([
      {
        tender: { id: 1 },
        entries: [{ document: { id: 102 } }],
      },
      {
        tender: { id: 2 },
        entries: [{ document: { id: 201 } }],
      },
    ]);
  });

  it('should handle deleteOrder.fulfilled without changing state when success is false', () => {
    initialState.list = [
      {
        tender: { id: 1 },
        entries: [{ document: { id: 101 } }, { document: { id: 102 } }],
      },
    ];
    const action = {
      type: deleteOrder.fulfilled.type,
      payload: { success: false },
      meta: { arg: { tid: 1, did: 101 } },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[deleteOrder.fulfilled.type](draft, action);
    });
    expect(state.list).toEqual([
      {
        tender: { id: 1 },
        entries: [{ document: { id: 101 } }, { document: { id: 102 } }],
      },
    ]);
  });

  // Test deleteOrder.rejected
  it('should handle deleteOrder.rejected without state change', () => {
    const action = { type: deleteOrder.rejected.type };
    const state = produce(initialState, (draft) => {
      extraReducers[deleteOrder.rejected.type](draft, action);
    });
    expect(state).toEqual(initialState);
  });

  // Test withdrawSentOrder.pending
  it('should handle withdrawSentOrder.pending without state change', () => {
    const action = { type: withdrawSentOrder.pending.type };
    const state = produce(initialState, (draft) => {
      extraReducers[withdrawSentOrder.pending.type](draft, action);
    });
    expect(state).toEqual(initialState);
  });

  // Test withdrawSentOrder.fulfilled
  it('should handle withdrawSentOrder.fulfilled correctly', () => {
    initialState.list = [
      {
        tender: { id: 1 },
        entries: [
          { order_id: 10, document: { id: 101 }, status: 'Sent' },
          { order_id: 11, document: { id: 102 }, status: 'Sent' },
        ],
      },
    ];
    const action = {
      type: withdrawSentOrder.fulfilled.type,
      meta: { arg: { pid: 1, id: 10, tid: 1, did: 101 } },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[withdrawSentOrder.fulfilled.type](draft, action);
    });
    expect(state.list[0].entries[0].status).toBe('Withdrew');
    expect(state.list[0].entries[1].status).toBe('Sent'); // Other entry should be unchanged
  });

  // Test withdrawSentOrder.rejected
  it('should handle withdrawSentOrder.rejected without state change', () => {
    const action = { type: withdrawSentOrder.rejected.type };
    const state = produce(initialState, (draft) => {
      extraReducers[withdrawSentOrder.rejected.type](draft, action);
    });
    expect(state).toEqual(initialState);
  });

  // Test markAsSignOrder.pending
  it('should handle markAsSignOrder.pending without state change', () => {
    const action = { type: markAsSignOrder.pending.type };
    const state = produce(initialState, (draft) => {
      extraReducers[markAsSignOrder.pending.type](draft, action);
    });
    expect(state).toEqual(initialState);
  });

  // Test markAsSignOrder.fulfilled
  it('should handle markAsSignOrder.fulfilled correctly', () => {
    initialState.list = [
      {
        tender: { id: 1 },
        entries: [
          { order_id: 10, status: 'Sent' },
          { order_id: 11, status: 'Sent' },
        ],
      },
    ];
    const action = {
      type: markAsSignOrder.fulfilled.type,
      meta: { arg: { pid: 1, id: 10, tid: 1 } },
    };
    const state = produce(initialState, (draft) => {
      extraReducers[markAsSignOrder.fulfilled.type](draft, action);
    });
    expect(state.list[0].entries[0].status).toBe('Signed');
    expect(state.list[0].entries[1].status).toBe('Sent'); // Other entry should be unchanged
  });

  // Test markAsSignOrder.rejected
  it('should handle markAsSignOrder.rejected without state change', () => {
    const action = { type: markAsSignOrder.rejected.type };
    const state = produce(initialState, (draft) => {
      extraReducers[markAsSignOrder.rejected.type](draft, action);
    });
    expect(state).toEqual(initialState);
  });
});
