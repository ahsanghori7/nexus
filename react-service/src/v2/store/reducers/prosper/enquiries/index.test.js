import enquiriesReducer, {
  changeStatus,
  nextBatch,
} from 'store/reducers/prosper/enquiries';

jest.mock('v2/helpers/flags', () => jest.fn(() => 2));

describe('prosper enquiries slice reducers', () => {
  const getInitialState = () =>
    enquiriesReducer(undefined, { type: '@@INIT' });

  it('updates the status when changeStatus is dispatched', () => {
    const initialState = getInitialState();

    const updatedState = enquiriesReducer(
      initialState,
      changeStatus('ready')
    );

    expect(updatedState.status).toBe('ready');
    expect(updatedState).not.toBe(initialState);
  });

  it('appends the next batch of enquiries to the current list', () => {
    const initialState = getInitialState();
    const populatedState = {
      ...initialState,
      current: [{ id: 'existing' }],
      total: [{ id: 'first' }, { id: 'second' }, { id: 'remaining' }],
    };

    const updatedState = enquiriesReducer(populatedState, nextBatch());

    expect(updatedState.current).toEqual([
      { id: 'existing' },
      { id: 'first' },
      { id: 'second' },
    ]);
    expect(updatedState.total).toEqual([{ id: 'remaining' }]);
  });
});
