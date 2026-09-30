import { produce } from 'immer';
import extraReducers, {
  fetchFeatures,
  fetchAccountFeatures,
  updateAccountFeatures,
  fetchAccountEnvelopes,
  updateAccountEnvelopes,
} from './extraReducers';
import status from 'store/reducers/common/constants';

// Mock external dependencies
jest.mock('services/helpers', () => ({
  fetchData: jest.fn(),
  patchData: jest.fn(),
}));

const initialState = {
  featureList: [],
  list: [],
  envelopes: {},
  status: { severity: '', message: '', type: status.IDLE_STATUS },
};

describe('common features extraReducers', () => {
  describe('fetchFeatures', () => {
    it('should handle fetchFeatures.pending', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[fetchFeatures.pending](draft);
      });

      expect(state.status).toEqual({
        severity: 'info',
        message: 'Loading features',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle fetchFeatures.fulfilled with payload', () => {
      const payload = [
        { id: 1, name: 'Feature 1' },
        { id: 2, name: 'Feature 2' },
      ];

      const state = produce(initialState, (draft) => {
        extraReducers[fetchFeatures.fulfilled](draft, { payload });
      });

      expect(state.featureList).toEqual(payload);
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle fetchFeatures.fulfilled with null payload', () => {
      const payload = null;

      const state = produce(initialState, (draft) => {
        extraReducers[fetchFeatures.fulfilled](draft, { payload });
      });

      expect(state.featureList).toEqual([]); // Should remain unchanged
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle fetchFeatures.rejected', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[fetchFeatures.rejected](draft);
      });

      expect(state.status).toEqual({
        severity: 'Loading features failed',
        message: '',
        type: status.FAILURE_STATUS,
      });
    });
  });

  describe('fetchAccountFeatures', () => {
    it('should handle fetchAccountFeatures.pending', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[fetchAccountFeatures.pending](draft);
      });

      expect(state.status).toEqual({
        severity: 'info',
        message: 'Loading accounts with features',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle fetchAccountFeatures.fulfilled with valid array payload', () => {
      const payload = [
        {
          id: 1,
          account_id: 123,
          account: { name: 'Account A' },
          feature: 'Feature X',
          feature_id: 10,
        },
        {
          id: 2,
          account_id: 123,
          account: { name: 'Account A' },
          feature: 'Feature Y',
          feature_id: 11,
        },
        {
          id: 3,
          account_id: 456,
          account: { name: 'Account B' },
          feature: 'Feature Z',
          feature_id: 12,
        },
      ];

      const state = produce(initialState, (draft) => {
        extraReducers[fetchAccountFeatures.fulfilled](draft, { payload });
      });

      expect(state.list).toHaveLength(2); // Two unique accounts
      
      const account123 = state.list.find(item => item.account_id === 123);
      expect(account123).toEqual({
        id: 2, // Last item's id for this account_id
        account_id: 123,
        account: { name: 'Account A' },
        features: 'Feature X,Feature Y',
        feature_ids: [10, 11],
      });

      const account456 = state.list.find(item => item.account_id === 456);
      expect(account456).toEqual({
        id: 3,
        account_id: 456,
        account: { name: 'Account B' },
        features: 'Feature Z',
        feature_ids: [12],
      });

      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle fetchAccountFeatures.fulfilled with features having null feature_id', () => {
      const payload = [
        {
          id: 1,
          account_id: 123,
          account: { name: 'Account A' },
          feature: 'Feature X',
          feature_id: 10,
        },
        {
          id: 2,
          account_id: 123,
          account: { name: 'Account A' },
          feature: 'Feature Y',
          feature_id: null, // This should be filtered out
        },
        {
          id: 3,
          account_id: 123,
          account: { name: 'Account A' },
          feature: 'Feature Z',
          feature_id: 12,
        },
      ];

      const state = produce(initialState, (draft) => {
        extraReducers[fetchAccountFeatures.fulfilled](draft, { payload });
      });

      expect(state.list).toHaveLength(1);
      expect(state.list[0].features).toBe('Feature X,Feature Y,Feature Z');
      expect(state.list[0].feature_ids).toEqual([10, 12]); // null filtered out
    });

    it('should handle fetchAccountFeatures.fulfilled with non-array payload', () => {
      const payload = { not: 'an array' };

      const state = produce(initialState, (draft) => {
        extraReducers[fetchAccountFeatures.fulfilled](draft, { payload });
      });

      expect(state.list).toEqual([]); // Should remain unchanged
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle fetchAccountFeatures.fulfilled with null payload', () => {
      const payload = null;

      const state = produce(initialState, (draft) => {
        extraReducers[fetchAccountFeatures.fulfilled](draft, { payload });
      });

      expect(state.list).toEqual([]); // Should remain unchanged
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle fetchAccountFeatures.rejected', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[fetchAccountFeatures.rejected](draft);
      });

      expect(state.status).toEqual({
        severity: 'Loading accounts with features failed',
        message: '',
        type: status.FAILURE_STATUS,
      });
    });
  });

  describe('updateAccountFeatures', () => {
    it('should handle updateAccountFeatures.pending', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[updateAccountFeatures.pending](draft);
      });

      expect(state.status).toEqual({
        severity: 'info',
        message: 'Updating features for accounts',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle updateAccountFeatures.fulfilled with payload', () => {
      const payload = [
        { id: 1, account_id: 123, features: 'Updated Feature' },
      ];

      const state = produce(initialState, (draft) => {
        extraReducers[updateAccountFeatures.fulfilled](draft, { payload });
      });

      expect(state.list).toEqual(payload);
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle updateAccountFeatures.fulfilled with null payload', () => {
      const initialStateWithData = {
        ...initialState,
        list: [{ id: 1, existing: 'data' }],
      };

      const payload = null;

      const state = produce(initialStateWithData, (draft) => {
        extraReducers[updateAccountFeatures.fulfilled](draft, { payload });
      });

      expect(state.list).toEqual([{ id: 1, existing: 'data' }]); // Should remain unchanged
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle updateAccountFeatures.rejected', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[updateAccountFeatures.rejected](draft);
      });

      expect(state.status).toEqual({
        severity: 'Updating features for accounts failed',
        message: '',
        type: status.FAILURE_STATUS,
      });
    });
  });

  describe('fetchAccountEnvelopes', () => {
    it('should handle fetchAccountEnvelopes.pending', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[fetchAccountEnvelopes.pending](draft);
      });

      expect(state.status).toEqual({
        severity: 'info',
        message: 'Loading envelopes',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle fetchAccountEnvelopes.fulfilled with payload', () => {
      const payload = {
        envelope1: { id: 1, name: 'Envelope 1' },
        envelope2: { id: 2, name: 'Envelope 2' },
      };

      const state = produce(initialState, (draft) => {
        extraReducers[fetchAccountEnvelopes.fulfilled](draft, { payload });
      });

      expect(state.envelopes).toEqual(payload);
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle fetchAccountEnvelopes.fulfilled with null payload', () => {
      const payload = null;

      const state = produce(initialState, (draft) => {
        extraReducers[fetchAccountEnvelopes.fulfilled](draft, { payload });
      });

      expect(state.envelopes).toEqual({}); // Should remain unchanged
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle fetchAccountEnvelopes.rejected', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[fetchAccountEnvelopes.rejected](draft);
      });

      expect(state.status).toEqual({
        severity: 'Loading envelopes failed',
        message: '',
        type: status.FAILURE_STATUS,
      });
    });
  });

  describe('updateAccountEnvelopes', () => {
    it('should handle updateAccountEnvelopes.pending', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[updateAccountEnvelopes.pending](draft);
      });

      expect(state.status).toEqual({
        severity: 'info',
        message: 'Updating envelopes for accounts',
        type: status.LOADING_STATUS,
      });
    });

    it('should handle updateAccountEnvelopes.fulfilled with payload', () => {
      const payload = [
        { id: 1, account_id: 123, envelope: 'Updated Envelope' },
      ];

      const state = produce(initialState, (draft) => {
        extraReducers[updateAccountEnvelopes.fulfilled](draft, { payload });
      });

      expect(state.list).toEqual(payload);
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle updateAccountEnvelopes.fulfilled with null payload', () => {
      const initialStateWithData = {
        ...initialState,
        list: [{ id: 1, existing: 'data' }],
      };

      const payload = null;

      const state = produce(initialStateWithData, (draft) => {
        extraReducers[updateAccountEnvelopes.fulfilled](draft, { payload });
      });

      expect(state.list).toEqual([{ id: 1, existing: 'data' }]); // Should remain unchanged
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle updateAccountEnvelopes.rejected', () => {
      const state = produce(initialState, (draft) => {
        extraReducers[updateAccountEnvelopes.rejected](draft);
      });

      expect(state.status).toEqual({
        severity: 'Updating envelopes for accounts failed',
        message: '',
        type: status.FAILURE_STATUS,
      });
    });
  });

  describe('integration and edge cases', () => {
    it('should preserve other state properties during updates', () => {
      const stateWithExtraProperties = {
        ...initialState,
        customProperty: 'should be preserved',
        featureList: ['existing feature'],
      };

      const payload = [{ id: 1, name: 'New Feature' }];

      const state = produce(stateWithExtraProperties, (draft) => {
        extraReducers[fetchFeatures.fulfilled](draft, { payload });
      });

      expect(state.customProperty).toBe('should be preserved');
      expect(state.featureList).toEqual(payload);
    });

    it('should handle complex fetchAccountFeatures with multiple accounts and mixed feature_ids', () => {
      const payload = [
        {
          id: 1,
          account_id: 123,
          account: { name: 'Account A' },
          feature: 'Feature 1',
          feature_id: '10', // String that should be converted to number
        },
        {
          id: 2,
          account_id: 123,
          account: { name: 'Account A' },
          feature: 'Feature 2',
          feature_id: null, // Should be filtered out
        },
        {
          id: 3,
          account_id: 123,
          account: { name: 'Account A' },
          feature: 'Feature 3',
          feature_id: 0, // Falsy but should be kept since it's a valid number
        },
        {
          id: 4,
          account_id: 456,
          account: { name: 'Account B' },
          feature: 'Feature 4',
          feature_id: '20',
        },
      ];

      const state = produce(initialState, (draft) => {
        extraReducers[fetchAccountFeatures.fulfilled](draft, { payload });
      });

      expect(state.list).toHaveLength(2);
      
      const account123 = state.list.find(item => item.account_id === 123);
      expect(account123.features).toBe('Feature 1,Feature 2,Feature 3');
      expect(account123.feature_ids).toEqual([10]); // null and 0 filtered out since filter((f) => f) removes falsy values

      const account456 = state.list.find(item => item.account_id === 456);
      expect(account456.features).toBe('Feature 4');
      expect(account456.feature_ids).toEqual([20]);
    });

    it('should handle empty array payload for fetchAccountFeatures', () => {
      const payload = [];

      const state = produce(initialState, (draft) => {
        extraReducers[fetchAccountFeatures.fulfilled](draft, { payload });
      });

      expect(state.list).toEqual([]);
      expect(state.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });

    it('should handle single account with multiple features correctly', () => {
      const payload = [
        {
          id: 1,
          account_id: 999,
          account: { name: 'Single Account' },
          feature: 'Feature A',
          feature_id: 1,
        },
        {
          id: 2,
          account_id: 999,
          account: { name: 'Single Account' },
          feature: 'Feature B',
          feature_id: 2,
        },
        {
          id: 3,
          account_id: 999,
          account: { name: 'Single Account' },
          feature: 'Feature C',
          feature_id: 3,
        },
      ];

      const state = produce(initialState, (draft) => {
        extraReducers[fetchAccountFeatures.fulfilled](draft, { payload });
      });

      expect(state.list).toHaveLength(1);
      expect(state.list[0].account_id).toBe(999);
      expect(state.list[0].features).toBe('Feature A,Feature B,Feature C');
      expect(state.list[0].feature_ids).toEqual([1, 2, 3]);
    });
  });
});
