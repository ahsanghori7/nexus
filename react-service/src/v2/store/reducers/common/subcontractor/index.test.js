import reducer, {
  reduceInfoToken,
  updateSubscription,
  enableProsperProBanner,
  updateSubscriptionHowToWin,
  updateUserDetails,
} from './index';

describe('common subcontractor reducer', () => {
  const initialState = {
    id: 0,
    accountId: 0,
    title: '',
    subtitle: '',
    rooms: [],
    token_prices: [],
    membership: {
      regions: [4],
      tokens: 0,
    },
    info: {},
    statusRoom: '',
    trades: {},
    regions: {},
    subscription_id: null,
    firstname: '',
    lastname: '',
    email: '',
    job_description: '',
    account_owner: false,
    unlocked_projects: [],
    prosperProBanner: false,
    canClaimFreeTokens: false,
    contractor_id: null,
    how_to_win_work_opted: false,
    tokens_top_up: 0,
    status: {
      severity: false,
      message: '',
      type: 'idle',
    },
    statusActions: {
      severity: false,
      message: '',
      type: 'idle',
    },
    country: null,
    features: null,
  };

  it('should handle initial state', () => {
    const newState = reducer(undefined, { type: '@@INIT' });
    expect(newState).toMatchObject(initialState);
  });

  it('should reduce info token', () => {
    const state = {
      ...initialState,
      membership: {
        regions: [4],
        tokens: 10,
      },
    };
    const newState = reducer(state, reduceInfoToken());
    expect(newState.membership.tokens).toBe(9);
  });

  it('should update subscription', () => {
    const state = { ...initialState };
    const newState = reducer(
      state,
      updateSubscription({ subscription_id: 123 })
    );
    expect(newState.subscription_id).toBe(123);
  });

  it('should enable prosper pro banner', () => {
    const state = { ...initialState, prosperProBanner: false };
    const newState = reducer(
      state,
      enableProsperProBanner({ enableProsperProBanner: true })
    );
    expect(newState.prosperProBanner).toBe(true);
  });

  it('should update subscription how to win', () => {
    const state = { ...initialState, how_to_win_work_opted: false };
    const newState = reducer(
      state,
      updateSubscriptionHowToWin({ how_to_win_work_opted: true })
    );
    expect(newState.how_to_win_work_opted).toBe(true);
  });

  it('should update user details', () => {
    const state = { ...initialState };
    const payload = {
      email: 'test@example.com',
      firstname: 'John',
      lastname: 'Doe',
      job_description: 'Developer',
    };
    const newState = reducer(state, updateUserDetails(payload));
    expect(newState.email).toBe('test@example.com');
    expect(newState.firstname).toBe('John');
    expect(newState.lastname).toBe('Doe');
    expect(newState.job_description).toBe('Developer');
  });
});
