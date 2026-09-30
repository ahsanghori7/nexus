import configReducer, { setTitle, setType, setLock } from './Config';

describe('prosper Config slice', () => {
  const initialState = {
    type: 'string',
    title: 'TITLE',
    lock: false,
  };

  it('should return the initial state', () => {
    expect(configReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setTitle', () => {
    const actual = configReducer(initialState, setTitle('New Title'));
    expect(actual.title).toEqual('New Title');
  });

  it('should handle setType', () => {
    const actual = configReducer(initialState, setType('number'));
    expect(actual.type).toEqual('number');
  });

  it('should handle setLock', () => {
    let actual = configReducer(initialState, setLock(true));
    expect(actual.lock).toEqual(true);

    actual = configReducer(actual, setLock(false));
    expect(actual.lock).toEqual(false);
  });
});
