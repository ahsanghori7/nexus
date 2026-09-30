import reducer, { updateAccounts } from './index';
import status from 'store/reducers/common/constants'; // Import status constants

describe('common account reducer', () => {
  const initialState = {
    list: [],
    listCount: 0,
    roles: [],
    team: {},
    status: { severity: '', message: '', type: status.IDLE_STATUS }, // Use imported status
    inviteError: '',
    account: null,
    distance: [],
    features: [],
    approvalThresholds: [],
    groups: [],
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, {})).toEqual(initialState);
  });

  it('should handle updateAccounts', () => {
    const newAccounts = [{ id: 1, name: 'Test Account' }];
    const expectedState = {
      ...initialState,
      list: newAccounts,
    };
    expect(reducer(initialState, updateAccounts(newAccounts))).toEqual(
      expectedState,
    );
  });
});
