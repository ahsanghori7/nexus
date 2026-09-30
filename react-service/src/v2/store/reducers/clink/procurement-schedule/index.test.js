import reducer, {
  openEnquiryPro,
  restartProcurement,
  resetApprovers,
  getProjectProcurement,
  getProjectInterests,
  fetchApproversShortlistedSubs,
} from './index';

describe('procurement-schedule reducer', () => {
  const initialState = {
    interests: [],
    packages: [],
    submittingProcurement: true,
    errorProcurement: false,
    submittingInterest: true,
    submittingChain: true,
    errorInterest: false,
    enquiryProOnLoad: {},
    approvers: [],
    fetchingApprovers: false,
    deletingShortlisted: false,
    requestingApproval: false,
    approvingOrRejecting: false,
    fetchingLogs: false,
    withdrawingApproval: false,
    acknowledgingRejection: false,
  };

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('regular reducers', () => {
    it('should handle openEnquiryPro', () => {
      const payload = { projectId: 123, enquiryId: 456 };
      const action = openEnquiryPro(payload);
      const state = reducer(initialState, action);
      expect(state.enquiryProOnLoad).toEqual(payload);
    });

    it('should handle openEnquiryPro with empty payload', () => {
      const payload = {};
      const action = openEnquiryPro(payload);
      const state = reducer(initialState, action);
      expect(state.enquiryProOnLoad).toEqual({});
    });

    it('should handle openEnquiryPro with complex payload', () => {
      const payload = {
        projectId: 123,
        enquiryId: 456,
        packageId: 789,
        details: {
          name: 'Test Package',
          description: 'Test Description',
        },
      };
      const action = openEnquiryPro(payload);
      const state = reducer(initialState, action);
      expect(state.enquiryProOnLoad).toEqual(payload);
    });

    it('should handle restartProcurement', () => {
      const currentState = {
        ...initialState,
        interests: [{ id: 1, name: 'Interest 1' }],
        packages: [{ id: 1, name: 'Package 1' }],
        enquiryProOnLoad: { projectId: 123 },
      };

      const action = restartProcurement();
      const state = reducer(currentState, action);

      expect(state.interests).toEqual([]);
      expect(state.packages).toEqual([]);
      expect(state.enquiryProOnLoad).toEqual({ projectId: 123 }); // Should remain unchanged
    });

    it('should handle resetApprovers', () => {
      const currentState = {
        ...initialState,
        approvers: [{ level: 1, roles: [] }],
        fetchingApprovers: true,
      };

      const action = resetApprovers();
      const state = reducer(currentState, action);

      expect(state.approvers).toEqual([]);
      expect(state.fetchingApprovers).toBe(false);
    });

    it('should handle resetApprovers when already empty', () => {
      const action = resetApprovers();
      const state = reducer(initialState, action);

      expect(state.approvers).toEqual([]);
      expect(state.fetchingApprovers).toBe(false);
    });
  });

  describe('async thunk actions', () => {
    it('should export async thunk actions', () => {
      expect(getProjectProcurement).toBeDefined();
      expect(getProjectInterests).toBeDefined();
      expect(fetchApproversShortlistedSubs).toBeDefined();
    });

    it('should have correct type prefixes for async thunks', () => {
      expect(getProjectProcurement.typePrefix).toBe(
        'project/getProjectProcurement',
      );
      expect(getProjectInterests.typePrefix).toBe(
        'project/getProjectInterests',
      );
      expect(fetchApproversShortlistedSubs.typePrefix).toBe(
        'project/fetchApproversShortlistedSubs',
      );
    });
  });

  describe('state transitions', () => {
    it('should maintain other state when opening enquiry pro', () => {
      const currentState = {
        ...initialState,
        interests: [{ id: 1, name: 'Test Interest' }],
        packages: [{ id: 1, name: 'Test Package' }],
        submittingProcurement: false,
        errorProcurement: true,
      };

      const payload = { newEnquiry: 'data' };
      const action = openEnquiryPro(payload);
      const state = reducer(currentState, action);

      expect(state).toEqual({
        ...currentState,
        enquiryProOnLoad: payload,
      });
    });

    it('should maintain other state when restarting procurement', () => {
      const currentState = {
        ...initialState,
        interests: [{ id: 1, name: 'Interest' }],
        packages: [{ id: 1, name: 'Package' }],
        submittingProcurement: false,
        errorProcurement: true,
        submittingInterest: false,
        enquiryProOnLoad: { projectId: 456 },
      };

      const action = restartProcurement();
      const state = reducer(currentState, action);

      expect(state).toEqual({
        ...currentState,
        interests: [],
        packages: [],
      });
    });

    it('should maintain other state when resetting approvers', () => {
      const currentState = {
        ...initialState,
        interests: [{ id: 1, name: 'Interest' }],
        packages: [{ id: 1, name: 'Package' }],
        approvers: [{ level: 1, roles: [] }],
        fetchingApprovers: true,
        enquiryProOnLoad: { projectId: 456 },
      };

      const action = resetApprovers();
      const state = reducer(currentState, action);

      expect(state).toEqual({
        ...currentState,
        approvers: [],
        fetchingApprovers: false,
      });
    });

    it('should handle multiple state updates', () => {
      let state = initialState;

      // First open enquiry pro
      const enquiryPayload = { projectId: 123, enquiryId: 456 };
      state = reducer(state, openEnquiryPro(enquiryPayload));
      expect(state.enquiryProOnLoad).toEqual(enquiryPayload);

      // Then restart procurement
      state = reducer(state, restartProcurement());
      expect(state.interests).toEqual([]);
      expect(state.packages).toEqual([]);
      expect(state.enquiryProOnLoad).toEqual(enquiryPayload); // Should remain

      // Then open different enquiry pro
      const newEnquiryPayload = { projectId: 789, enquiryId: 101 };
      state = reducer(state, openEnquiryPro(newEnquiryPayload));
      expect(state.enquiryProOnLoad).toEqual(newEnquiryPayload);
    });
  });
});
