import { configureStore } from '@reduxjs/toolkit';
import teamManagerReducer, { activateTeamAccount } from './index';
import { postFormData } from 'services/helpers';
import status from 'store/reducers/common/constants';

jest.mock('services/helpers', () => ({
  postFormData: jest.fn(),
}));

describe('teamManager extraReducers', () => {
  let store;
  const initialState = { severity: '', message: '', type: status.IDLE_STATUS };

  beforeEach(() => {
    store = configureStore({
      reducer: { teamManager: teamManagerReducer },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle activateTeamAccount.pending and fulfilled', async () => {
    const mockResponse = {
      severity: 'success',
      message: 'OK',
      type: status.SUCCESS_STATUS,
    };

    postFormData.mockResolvedValue({
      json: () => Promise.resolve(mockResponse),
    });

    await store.dispatch(
      activateTeamAccount({ tokenId: 'testToken', data: {} }),
    );

    expect(postFormData).toHaveBeenCalledWith(
      'team_manager',
      {},
      'activate/testToken',
    );
    expect(store.getState().teamManager).toEqual(initialState);
  });

  it('should handle activateTeamAccount.rejected', async () => {
    postFormData.mockRejectedValue(new Error('Activation failed'));

    await store.dispatch(
      activateTeamAccount({ tokenId: 'testToken', data: {} }),
    );

    expect(store.getState().teamManager).toEqual(initialState);
  });

  // Keep these to cover the reducer handler lines
  it('should handle activateTeamAccount.pending action type', () => {
    store.dispatch({ type: activateTeamAccount.pending.type });
    expect(store.getState().teamManager).toEqual(initialState);
  });

  it('should handle activateTeamAccount.fulfilled action type', () => {
    store.dispatch({ type: activateTeamAccount.fulfilled.type, payload: {} });
    expect(store.getState().teamManager).toEqual(initialState);
  });

  it('should handle activateTeamAccount.rejected action type', () => {
    store.dispatch({ type: activateTeamAccount.rejected.type });
    expect(store.getState().teamManager).toEqual(initialState);
  });

  it('should call activateTeamAccount async thunk successfully', async () => {
    const mockResponse = { success: true, message: 'Account activated' };
    const mockJsonResponse = {
      json: jest.fn().mockResolvedValue(mockResponse),
    };
    postFormData.mockResolvedValue(mockJsonResponse);

    const tokenId = 'test-token-123';
    const data = { email: 'test@example.com' };

    const result = await store.dispatch(activateTeamAccount({ tokenId, data }));

    expect(postFormData).toHaveBeenCalledWith(
      'team_manager',
      data,
      `activate/${tokenId}`,
    );
    expect(result.payload).toEqual(mockResponse);
  });
});
