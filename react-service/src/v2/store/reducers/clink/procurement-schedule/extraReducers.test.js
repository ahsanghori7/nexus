import extraReducers, {
  getProjectProcurement,
  getProjectInterests,
  getProjectProcurementOverviewV2,
  fetchApproversShortlistedSubs,
  exportProcurementSchedule,
} from './extraReducers';
import isEmpty from 'lodash/isEmpty';

// Mock lodash/isEmpty
jest.mock('lodash/isEmpty', () => jest.fn());

describe('procurement-schedule extraReducers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const initialState = {
    interests: [],
    packages: [],
    submittingProcurement: true,
    errorProcurement: false,
    submittingInterest: true,
    submittingChain: true,
    errorInterest: false,
    enquiryProOnLoad: {},
  };

  describe('getProjectProcurement handlers', () => {
    it('should handle getProjectProcurement.pending', () => {
      const state = { ...initialState, errorProcurement: true };
      const pendingHandler = extraReducers[getProjectProcurement.pending];
      pendingHandler(state);

      expect(state.submittingProcurement).toBe(true);
      expect(state.errorProcurement).toBe(false);
    });

    it('should handle getProjectProcurement.fulfilled with object payload', () => {
      const payload = {
        package1: {
          id: 1,
          name: 'Package 1',
          start_on_site: '2024-01-01',
          service_label: 'Design and Supply',
          packages: [123],
        },
        package2: {
          id: 2,
          name: 'Package 2',
          tender_return: '2024-02-01',
          service_label: 'Design Only',
          packages: [456],
        },
        package3: { id: 3, name: 'Package 3' }, // Should be filtered out
      };

      isEmpty.mockImplementation((value) => !value);

      const state = { ...initialState, submittingProcurement: true };
      const action = { payload };
      const fulfilledHandler = extraReducers[getProjectProcurement.fulfilled];
      fulfilledHandler(state, action);

      expect(state.submittingProcurement).toBe(false);
      expect(state.errorProcurement).toBe(false);
      expect(state.packages).toHaveLength(2);
      expect(state.packages).toEqual([
        {
          id: 1,
          name: 'Package 1',
          start_on_site: '2024-01-01',
          service_label: 'Design and Supply',
          packages: [123],
        },
        {
          id: 2,
          name: 'Package 2',
          tender_return: '2024-02-01',
          service_label: 'Design Only',
          packages: [456],
        },
      ]);
    });

    it('should handle getProjectProcurement.fulfilled with array payload', () => {
      const payload = [
        {
          id: 1,
          name: 'Package 1',
          start_on_site: '2024-01-01',
          service_label: 'Design and Supply',
          packages: [123],
        },
        {
          id: 2,
          name: 'Package 2',
          tender_return: '2024-02-01',
          service_label: 'Design Only',
          packages: [456],
        },
        { id: 3, name: 'Package 3' }, // Should be filtered out
      ];

      isEmpty.mockImplementation((value) => !value);

      const state = { ...initialState, submittingProcurement: true };
      const action = { payload };
      const fulfilledHandler = extraReducers[getProjectProcurement.fulfilled];
      fulfilledHandler(state, action);

      expect(state.submittingProcurement).toBe(false);
      expect(state.errorProcurement).toBe(false);
      expect(state.packages).toHaveLength(2);
      expect(state.packages).toEqual([
        {
          id: 1,
          name: 'Package 1',
          start_on_site: '2024-01-01',
          service_label: 'Design and Supply',
          packages: [123],
        },
        {
          id: 2,
          name: 'Package 2',
          tender_return: '2024-02-01',
          service_label: 'Design Only',
          packages: [456],
        },
      ]);
    });

    it('should filter out a package with an empty service_label even when start_on_site and packages are present', () => {
      const payload = [
        {
          id: 1,
          name: 'Package 1',
          start_on_site: '2024-01-01',
          service_label: 'Design and Supply',
          packages: [123],
        },
        {
          id: 2,
          name: 'Package 2',
          start_on_site: '2024-01-01',
          service_label: '',
          packages: [456],
        },
      ];

      isEmpty.mockImplementation((value) => !value || value.length === 0);

      const state = { ...initialState, submittingProcurement: true };
      const action = { payload };
      const fulfilledHandler = extraReducers[getProjectProcurement.fulfilled];
      fulfilledHandler(state, action);

      expect(state.packages).toHaveLength(1);
      expect(state.packages[0].id).toBe(1);
    });

    it('should filter out a package with empty packages even when start_on_site and service_label are present', () => {
      const payload = [
        {
          id: 1,
          name: 'Package 1',
          start_on_site: '2024-01-01',
          service_label: 'Design and Supply',
          packages: [123],
        },
        {
          id: 2,
          name: 'Package 2',
          start_on_site: '2024-01-01',
          service_label: 'Design Only',
          packages: [],
        },
      ];

      isEmpty.mockImplementation((value) => !value || value.length === 0);

      const state = { ...initialState, submittingProcurement: true };
      const action = { payload };
      const fulfilledHandler = extraReducers[getProjectProcurement.fulfilled];
      fulfilledHandler(state, action);

      expect(state.packages).toHaveLength(1);
      expect(state.packages[0].id).toBe(1);
    });

    it('should handle getProjectProcurement.fulfilled with empty payload', () => {
      const payload = {};

      isEmpty.mockReturnValue(true);

      const state = { ...initialState, submittingProcurement: true };
      const action = { payload };
      const fulfilledHandler = extraReducers[getProjectProcurement.fulfilled];
      fulfilledHandler(state, action);

      expect(state.submittingProcurement).toBe(false);
      expect(state.errorProcurement).toBe(false);
      expect(state.packages).toEqual([]);
    });

    it('should handle getProjectProcurement.fulfilled with packages having both start_on_site and tender_return', () => {
      const payload = {
        package1: {
          id: 1,
          name: 'Package 1',
          start_on_site: '2024-01-01',
          tender_return: '2024-02-01',
        },
      };

      isEmpty.mockReturnValue(false);

      const state = { ...initialState, submittingProcurement: true };
      const action = { payload };
      const fulfilledHandler = extraReducers[getProjectProcurement.fulfilled];
      fulfilledHandler(state, action);

      expect(state.packages).toHaveLength(1);
      expect(state.packages[0]).toEqual({
        id: 1,
        name: 'Package 1',
        start_on_site: '2024-01-01',
        tender_return: '2024-02-01',
      });
    });

    it('should handle getProjectProcurement.fulfilled with packages having only start_on_site', () => {
      const payload = {
        package1: {
          id: 1,
          name: 'Package 1',
          start_on_site: '2024-01-01',
          service_label: 'Design and Supply',
          packages: [123],
        },
      };

      isEmpty.mockImplementation(
        (value) =>
          value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0),
      );

      const state = { ...initialState, submittingProcurement: true };
      const action = { payload };
      const fulfilledHandler = extraReducers[getProjectProcurement.fulfilled];
      fulfilledHandler(state, action);

      expect(state.packages).toHaveLength(1);
      expect(state.packages[0]).toEqual({
        id: 1,
        name: 'Package 1',
        start_on_site: '2024-01-01',
        service_label: 'Design and Supply',
        packages: [123],
      });
    });

    it('should handle getProjectProcurement.rejected', () => {
      const state = { ...initialState, submittingProcurement: true };
      const rejectedHandler = extraReducers[getProjectProcurement.rejected];
      rejectedHandler(state);

      expect(state.submittingProcurement).toBe(false);
      expect(state.errorProcurement).toBe(true);
    });
  });

  describe('getProjectProcurementOverviewV2 handlers', () => {
    it('should handle getProjectProcurementOverviewV2.pending', () => {
      const state = { ...initialState, errorProcurement: true };
      const pendingHandler =
        extraReducers[getProjectProcurementOverviewV2.pending];
      pendingHandler(state);

      expect(state.submittingProcurement).toBe(true);
      expect(state.errorProcurement).toBe(false);
    });

    it('should filter out a v2 package with an empty service_label even when start_on_site and packages are present', () => {
      const payload = [
        {
          id: 1,
          name: 'Package 1',
          start_on_site: '2024-01-01',
          service_label: 'Design and Supply',
          packages: [123],
        },
        {
          id: 2,
          name: 'Package 2',
          start_on_site: '2024-01-01',
          service_label: '',
          packages: [456],
        },
      ];

      isEmpty.mockImplementation((value) => !value || value.length === 0);

      const state = { ...initialState, submittingProcurement: true };
      const action = { payload };
      const fulfilledHandler =
        extraReducers[getProjectProcurementOverviewV2.fulfilled];
      fulfilledHandler(state, action);

      expect(state.submittingProcurement).toBe(false);
      expect(state.errorProcurement).toBe(false);
      expect(state.packages).toHaveLength(1);
      expect(state.packages[0].id).toBe(1);
    });

    it('should filter out a v2 package with empty packages even when start_on_site and service_label are present', () => {
      const payload = [
        {
          id: 1,
          name: 'Package 1',
          start_on_site: '2024-01-01',
          service_label: 'Design and Supply',
          packages: [123],
        },
        {
          id: 2,
          name: 'Package 2',
          start_on_site: '2024-01-01',
          service_label: 'Design Only',
          packages: [],
        },
      ];

      isEmpty.mockImplementation((value) => !value || value.length === 0);

      const state = { ...initialState, submittingProcurement: true };
      const action = { payload };
      const fulfilledHandler =
        extraReducers[getProjectProcurementOverviewV2.fulfilled];
      fulfilledHandler(state, action);

      expect(state.packages).toHaveLength(1);
      expect(state.packages[0].id).toBe(1);
    });

    it('should keep a v2 package with valid service_label, packages, and start_on_site', () => {
      const payload = [
        {
          id: 1,
          name: 'Package 1',
          start_on_site: '2024-01-01',
          service_label: 'Design and Supply',
          packages: [123],
        },
      ];

      isEmpty.mockImplementation((value) => !value || value.length === 0);

      const state = { ...initialState, submittingProcurement: true };
      const action = { payload };
      const fulfilledHandler =
        extraReducers[getProjectProcurementOverviewV2.fulfilled];
      fulfilledHandler(state, action);

      expect(state.packages).toEqual(payload);
    });

    it('should handle getProjectProcurementOverviewV2.rejected', () => {
      const state = { ...initialState, submittingProcurement: true };
      const rejectedHandler =
        extraReducers[getProjectProcurementOverviewV2.rejected];
      rejectedHandler(state);

      expect(state.submittingProcurement).toBe(false);
      expect(state.errorProcurement).toBe(true);
    });
  });

  describe('getProjectInterests handlers', () => {
    it('should handle getProjectInterests.pending', () => {
      const state = { ...initialState, errorInterest: true };
      const pendingHandler = extraReducers[getProjectInterests.pending];
      pendingHandler(state);

      expect(state.submittingInterest).toBe(true);
      expect(state.errorInterest).toBe(false);
    });

    it('should handle getProjectInterests.fulfilled with object payload', () => {
      const payload = {
        interest1: { id: 1, name: 'Interest 1' },
        interest2: { id: 2, name: 'Interest 2' },
      };

      const state = { ...initialState, submittingInterest: true };
      const action = { payload };
      const fulfilledHandler = extraReducers[getProjectInterests.fulfilled];
      fulfilledHandler(state, action);

      expect(state.submittingInterest).toBe(false);
      expect(state.errorInterest).toBe(false);
      expect(state.interests).toEqual([
        { id: 1, name: 'Interest 1' },
        { id: 2, name: 'Interest 2' },
      ]);
    });

    it('should handle getProjectInterests.fulfilled with array payload', () => {
      const payload = [
        { id: 1, name: 'Interest 1' },
        { id: 2, name: 'Interest 2' },
      ];

      const state = { ...initialState, submittingInterest: true };
      const action = { payload };
      const fulfilledHandler = extraReducers[getProjectInterests.fulfilled];
      fulfilledHandler(state, action);

      expect(state.submittingInterest).toBe(false);
      expect(state.errorInterest).toBe(false);
      expect(state.interests).toEqual(payload);
    });

    it('should handle getProjectInterests.fulfilled with empty object payload', () => {
      const payload = {};

      const state = { ...initialState, submittingInterest: true };
      const action = { payload };
      const fulfilledHandler = extraReducers[getProjectInterests.fulfilled];
      fulfilledHandler(state, action);

      expect(state.submittingInterest).toBe(false);
      expect(state.errorInterest).toBe(false);
      expect(state.interests).toEqual([]);
    });

    it('should handle getProjectInterests.rejected', () => {
      const state = { ...initialState, submittingInterest: true };
      const rejectedHandler = extraReducers[getProjectInterests.rejected];
      rejectedHandler(state);

      expect(state.submittingInterest).toBe(false);
      expect(state.errorInterest).toBe(true);
    });
  });

  describe('state preservation', () => {
    it('should preserve other state properties during getProjectProcurement operations', () => {
      const state = {
        ...initialState,
        interests: [{ id: 1, name: 'Interest 1' }],
        enquiryProOnLoad: { projectId: 123 },
        submittingChain: false,
      };

      const pendingHandler = extraReducers[getProjectProcurement.pending];
      pendingHandler(state);

      expect(state.interests).toEqual([{ id: 1, name: 'Interest 1' }]);
      expect(state.enquiryProOnLoad).toEqual({ projectId: 123 });
      expect(state.submittingChain).toBe(false);
    });

    it('should preserve other state properties during getProjectInterests operations', () => {
      const state = {
        ...initialState,
        packages: [{ id: 1, name: 'Package 1' }],
        enquiryProOnLoad: { projectId: 456 },
        submittingProcurement: false,
      };

      const pendingHandler = extraReducers[getProjectInterests.pending];
      pendingHandler(state);

      expect(state.packages).toEqual([{ id: 1, name: 'Package 1' }]);
      expect(state.enquiryProOnLoad).toEqual({ projectId: 456 });
      expect(state.submittingProcurement).toBe(false);
    });
  });

  describe('exportProcurementSchedule handlers', () => {
    it('should handle exportProcurementSchedule.pending', () => {
      const state = { ...initialState, isExporting: false };
      extraReducers[exportProcurementSchedule.pending](state);
      expect(state.isExporting).toBe(true);
    });

    it('should handle exportProcurementSchedule.fulfilled', () => {
      const state = { ...initialState, isExporting: true };
      extraReducers[exportProcurementSchedule.fulfilled](state);
      expect(state.isExporting).toBe(false);
    });

    it('should handle exportProcurementSchedule.rejected', () => {
      const state = { ...initialState, isExporting: true };
      extraReducers[exportProcurementSchedule.rejected](state);
      expect(state.isExporting).toBe(false);
    });
  });

  describe('fetchApproversShortlistedSubcontractors handlers', () => {
    it('should handle fetchApproversShortlistedSubs.pending', () => {
      const state = {
        ...initialState,
        fetchingApprovers: false,
        approvers: [{ id: 999, name: 'Old Approver' }],
      };

      const pendingHandler =
        extraReducers[fetchApproversShortlistedSubs.pending];
      pendingHandler(state);

      expect(state.fetchingApprovers).toBe(true);
      expect(state.approvers).toEqual([]);
    });

    it('should handle fetchApproversShortlistedSubs.fulfilled', () => {
      const payload = [
        { id: 1, name: 'Approver One' },
        { id: 2, name: 'Approver Two' },
      ];

      const state = {
        ...initialState,
        fetchingApprovers: true,
        approvers: [],
      };

      const fulfilledHandler =
        extraReducers[fetchApproversShortlistedSubs.fulfilled];
      fulfilledHandler(state, { payload });

      expect(state.fetchingApprovers).toBe(false);
      expect(state.approvers).toEqual(payload);
    });

    it('should handle fetchApproversShortlistedSubs.rejected', () => {
      const state = {
        ...initialState,
        fetchingApprovers: true,
        approvers: [{ id: 1, name: 'Approver One' }],
      };

      const rejectedHandler =
        extraReducers[fetchApproversShortlistedSubs.rejected];
      rejectedHandler(state);

      expect(state.fetchingApprovers).toBe(false);
      expect(state.approvers).toEqual([]);
    });
  });
});
