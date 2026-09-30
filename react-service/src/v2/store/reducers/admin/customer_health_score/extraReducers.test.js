import extraReducers, {
  fetchHealthScore,
  updateHealthScore,
} from './extraReducers';
import status from 'store/reducers/common/constants';
import { produce } from 'immer';

// Mock i18next and capitalize
jest.mock('v2/helpers/i18n', () => global.i18next); // Mock with the global i18next
jest.mock('lodash/capitalize', () => jest.fn((str) => str)); // Mock capitalize

describe('customer_health_score extraReducers', () => {
  let initialState;

  beforeEach(() => {
    initialState = {
      list: [],
      listCount: 0,
      status: {
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      },
    };
  });

  describe('fetchHealthScore.pending', () => {
    it('should set status to loading and clear the list', () => {
      const newState = produce(initialState, (draft) => {
        extraReducers[fetchHealthScore.pending](draft);
      });
      expect(newState.status).toEqual({
        severity: 'info',
        message: 'Loading Health Score',
        type: status.LOADING_STATUS,
      });
      expect(newState.list).toEqual([]);
    });
  });

  describe('fetchHealthScore.fulfilled', () => {
    it('should set status to idle and populate the list with capitalized boolean values', () => {
      const payload = [
        { tender: true, issued: false, budget: true },
        { tender: false, issued: true, budget: false },
      ];
      const newState = produce(initialState, (draft) => {
        extraReducers[fetchHealthScore.fulfilled](draft, { payload });
      });
      expect(newState.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      expect(newState.list).toEqual([
        { tender: 'true', issued: 'false', budget: 'true' },
        { tender: 'false', issued: 'true', budget: 'false' },
      ]);
    });

    it('should set status to idle and clear the list if payload is empty', () => {
      const payload = [];
      const newState = produce(initialState, (draft) => {
        extraReducers[fetchHealthScore.fulfilled](draft, { payload });
      });
      expect(newState.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      expect(newState.list).toEqual([]);
    });

    it('should set status to idle and clear the list if payload is null', () => {
      const payload = null;
      const newState = produce(initialState, (draft) => {
        extraReducers[fetchHealthScore.fulfilled](draft, { payload });
      });
      expect(newState.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
      expect(newState.list).toEqual([]);
    });
  });

  describe('fetchHealthScore.rejected', () => {
    it('should set status to error and clear the list', () => {
      const newState = produce(initialState, (draft) => {
        extraReducers[fetchHealthScore.rejected](draft);
      });
      expect(newState.status).toEqual({
        severity: 'error',
        message: 'Error loading Health Score',
        type: status.FAILURE_STATUS,
      });
      expect(newState.list).toEqual([]);
      expect(newState.listCount).toBe(0);
    });
  });

  describe('updateHealthScore.pending', () => {
    it('should set status to loading', () => {
      const newState = produce(initialState, (draft) => {
        extraReducers[updateHealthScore.pending](draft);
      });
      expect(newState.status).toEqual({
        severity: 'info',
        message: 'Updating Health Score',
        type: status.LOADING_STATUS,
      });
    });
  });

  describe('updateHealthScore.fulfilled', () => {
    it('should set status to idle', () => {
      const newState = produce(initialState, (draft) => {
        extraReducers[updateHealthScore.fulfilled](draft);
      });
      expect(newState.status).toEqual({
        severity: false,
        message: '',
        type: status.IDLE_STATUS,
      });
    });
  });

  describe('updateHealthScore.rejected', () => {
    it('should set status to error', () => {
      const newState = produce(initialState, (draft) => {
        extraReducers[updateHealthScore.rejected](draft);
      });
      expect(newState.status).toEqual({
        severity: 'error',
        message: 'Error updating Health Score',
        type: status.FAILURE_STATUS,
      });
    });
  });
});
