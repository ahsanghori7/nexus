import reducer, {
  addCertificate,
  addTurnover,
  updateTurnover,
  removeTurnover,
  updateSize,
  changeLocalCompanyInfo,
} from 'v2/store/reducers/common/prequalification_v2/index';

describe('prequalification v2 slice reducers', () => {
  it('adds certificate entry', () => {
    const initial = reducer(undefined, { type: '@@INIT' });
    const state = reducer(initial, addCertificate());
    expect(state['custom-certificate'].length).toBe(initial['custom-certificate'].length + 1);
  });

  it('manages turnover rows', () => {
    let state = reducer(undefined, { type: '@@INIT' });
    state = reducer(state, addTurnover());
    expect(state.turnover.length).toBeGreaterThan(1);

    const year = state.turnover[0].year;
    state = reducer(state, updateTurnover({ year, name: 'value', value: '500' }));
    expect(state.turnover.find((t) => t.year === year).value).toBe('500');

    state = reducer(state, removeTurnover(year));
    expect(state.turnover.find((t) => t.year === year)).toBeUndefined();
  });

  it('does not add turnover beyond max limit', () => {
    let state = reducer(undefined, { type: '@@INIT' });
    state = reducer(state, addTurnover());
    state = reducer(state, addTurnover());
    const fullLength = state.turnover.length;

    state = reducer(state, addTurnover());
    expect(state.turnover.length).toBe(fullLength);
  });

  it('updates size and company information', () => {
    let state = reducer(undefined, { type: '@@INIT' });
    state = reducer(
      state,
      updateSize({
        bodyCompanyInfo: { aid: 'A1', trading_name: 'New Co', num_current_employees: 10 },
        bodyTurnover: { latest: { year: '2022', value: '100' } },
      }),
    );
    expect(state.company_information.trading_name).toBe('New Co');
    expect(Object.values(state.turnover)[0].value).toBe('100');

    state = reducer(state, changeLocalCompanyInfo({ section: 'trading_name', value: 'Updated Co' }));
    expect(state.company_information.trading_name).toBe('Updated Co');
  });
});
