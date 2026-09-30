import { configureStore } from '@reduxjs/toolkit';
import tokenReducer, { checkToken, verifyToken } from './index'; // Import the reducer and thunks
import httpRequest from 'services/httpHelper';
import Relay from 'v2/services/relay';

// Mock external dependencies
jest.mock('services/httpHelper', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('v2/services/relay', () => {
  return jest.fn().mockImplementation(() => {
    return {
      patch: jest.fn(),
    };
  });
});

describe('token extraReducers', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        token: tokenReducer,
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkToken extraReducers', () => {
    it('should handle checkToken.pending', () => {
      store.dispatch(checkToken.pending('requestId', 'testToken'));
      expect(store.getState().token.loading).toBe(true);
      expect(store.getState().token.success).toBe(true); // success remains true initially
      expect(store.getState().token.tokenAward).toBe(0);
      expect(store.getState().token.data).toEqual({});
    });

    it('should handle checkToken.fulfilled with success', () => {
      const mockPayload = JSON.stringify({ success: true, token_award: 100 });
      store.dispatch(checkToken.fulfilled(mockPayload, 'requestId', 'testToken'));
      expect(store.getState().token.loading).toBe(false);
      expect(store.getState().token.success).toBe(true);
      expect(store.getState().token.tokenAward).toBe(100);
      expect(store.getState().token.data).toEqual({});
    });

    it('should handle checkToken.fulfilled with failure', () => {
      const mockPayload = JSON.stringify({ success: false });
      store.dispatch(checkToken.fulfilled(mockPayload, 'requestId', 'testToken'));
      expect(store.getState().token.loading).toBe(false);
      expect(store.getState().token.success).toBe(false);
      expect(store.getState().token.tokenAward).toBe(0);
      expect(store.getState().token.data).toEqual({});
    });

    it('should handle checkToken.fulfilled with null payload', () => {
      store.dispatch(checkToken.fulfilled(null, 'requestId', 'testToken'));
      expect(store.getState().token.loading).toBe(false);
      expect(store.getState().token.success).toBe(false);
      expect(store.getState().token.tokenAward).toBe(0);
      expect(store.getState().token.data).toEqual({});
    });


    it('should handle checkToken.rejected', () => {
      store.dispatch(checkToken.rejected(new Error('Failed to check token'), 'requestId', 'testToken'));
      expect(store.getState().token.loading).toBe(false);
      expect(store.getState().token.success).toBe(false);
      expect(store.getState().token.tokenAward).toBe(0);
      expect(store.getState().token.data).toEqual({});
    });
  });

  describe('verifyToken extraReducers', () => {
    it('should handle verifyToken.pending', () => {
      store.dispatch(verifyToken.pending('requestId', 'testToken'));
      expect(store.getState().token.loading).toBe(true);
      expect(store.getState().token.success).toBe(true); // success remains true initially
      expect(store.getState().token.tokenAward).toBe(0);
      expect(store.getState().token.data).toEqual({});
    });

    it('should handle verifyToken.fulfilled with data', () => {
      const mockPayload = { data: { userId: 123, username: 'testuser' } };
      store.dispatch(verifyToken.fulfilled(mockPayload, 'requestId', 'testToken'));
      expect(store.getState().token.loading).toBe(false);
      expect(store.getState().token.success).toEqual(mockPayload && mockPayload.data); // Assert based on actual reducer logic
      expect(store.getState().token.tokenAward).toBe(0);
      expect(store.getState().token.data).toEqual({ userId: 123, username: 'testuser' });
    });

    it('should handle verifyToken.fulfilled without data', () => {
      const mockPayload = {};
      store.dispatch(verifyToken.fulfilled(mockPayload, 'requestId', 'testToken'));
      expect(store.getState().token.loading).toBe(false);
      expect(store.getState().token.success).toEqual(mockPayload && mockPayload.data); // Assert based on actual reducer logic
      expect(store.getState().token.tokenAward).toBe(0);
      expect(store.getState().token.data).toEqual({});
    });

    it('should handle verifyToken.fulfilled with null payload', () => {
      store.dispatch(verifyToken.fulfilled(null, 'requestId', 'testToken'));
      expect(store.getState().token.loading).toBe(false);
      expect(store.getState().token.success).toEqual(null && null.data); // Assert based on actual reducer logic
      expect(store.getState().token.tokenAward).toBe(0);
      expect(store.getState().token.data).toEqual({});
    });

    it('should handle verifyToken.rejected', () => {
      store.dispatch(verifyToken.rejected(new Error('Failed to verify token'), 'requestId', 'testToken'));
      expect(store.getState().token.loading).toBe(false);
      expect(store.getState().token.success).toBe(false);
      expect(store.getState().token.tokenAward).toBe(0);
      expect(store.getState().token.data).toEqual({});
    });
  });

  describe('thunk payload creators', () => {
    it('checkToken calls relay patch and returns response text', async () => {
      const patch = jest.fn().mockResolvedValue({
        text: () => Promise.resolve('{"success":true}'),
      });
      Relay.mockImplementation(() => ({ patch }));

      const result = await store.dispatch(checkToken('promo-123'));

      expect(patch).toHaveBeenCalledWith(
        { promo_token: 'promo-123' },
        'check_promo_token',
      );
      expect(result.payload).toBe('{"success":true}');
    });

    it('verifyToken calls httpRequest with token endpoint', async () => {
      httpRequest.mockResolvedValue({ data: { valid: true } });

      const result = await store.dispatch(verifyToken('promo-xyz'));

      expect(httpRequest).toHaveBeenCalledWith({ url: 'token/verify/promo-xyz' });
      expect(result.payload).toEqual({ data: { valid: true } });
    });
  });
});
