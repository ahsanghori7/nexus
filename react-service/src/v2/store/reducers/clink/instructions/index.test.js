import reducer, {
  blockAccess,
  changeBudget,
  changeInstructionStatus,
  resetInstruction,
} from './index';

describe('instructions reducer', () => {
  const initialState = {
    status: 'loading',
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

  it('should handle initial state', () => {
    const newState = reducer(undefined, { type: '@@INIT' });
    expect(newState).toEqual(initialState);
  });

  it('should block access', () => {
    const newState = reducer(initialState, blockAccess());

    expect(newState.blocked).toBe(true);
  });

  it('should update instruction status', () => {
    const newState = reducer(initialState, changeInstructionStatus('success'));

    expect(newState.status).toBe('success');
  });

  it('should reset the current instruction data', () => {
    const state = {
      ...initialState,
      data: {
        id: 7,
        subject: 'Current instruction',
      },
    };

    const newState = reducer(state, resetInstruction());

    expect(newState.data).toBeNull();
  });

  it('should update the selected forecast budget and recalculate totals', () => {
    const state = {
      ...initialState,
      forecastList: [
        {
          tid: 101,
          package: 'Groundworks',
          order: '10',
          variations: '2',
          omissions: '1',
          budget: 1,
          total: '13',
        },
        {
          tid: 202,
          package: 'Steel',
          order: '5',
          variations: '0',
          omissions: '0',
          budget: 3,
          total: '8',
        },
        {
          tid: 0,
          package: 'TOTALS',
          order: 15,
          variations: 2,
          omissions: 1,
          budget: 4,
          total: 21,
          end: true,
        },
      ],
    };

    const newState = reducer(
      state,
      changeBudget({
        tid: 101,
        budget: 250,
      })
    );

    expect(newState.forecastList).toHaveLength(3);
    expect(newState.forecastList[0]).toEqual({
      tid: 101,
      package: 'Groundworks',
      order: '10',
      variations: '2',
      omissions: '1',
      budget: 2.5,
      total: '13',
    });
    expect(newState.forecastList[1]).toEqual(state.forecastList[1]);
    expect(newState.forecastList[2]).toEqual({
      tid: 0,
      package: 'TOTALS',
      order: 15,
      variations: 2,
      omissions: 1,
      budget: 5.5,
      total: 21,
      end: true,
    });
  });
});
