import reducer, {
  resetProject,
  resetIfsProjects,
  updateMember,
  setTasks,
  setOverview,
  resetOverview,
  setOpenedDatePickerId,
} from './index';
import { initTasks, getStatusOverview, getBudgetSummary } from './helper';

// Mock the helper functions
jest.mock('./helper', () => ({
  initTasks: jest.fn(),
  getStatusOverview: jest.fn(),
  getBudgetSummary: jest.fn(),
}));

// Mock lodash functions
jest.mock('lodash/isEmpty', () =>
  jest.fn(
    (value) =>
      !value ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'object' && Object.keys(value).length === 0),
  ),
);
jest.mock('lodash/uniqBy', () =>
  jest.fn((array, key) => {
    const seen = new Set();
    return array.filter((item) => {
      const value = item?.[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }),
);

// Mock Subscription helper
jest.mock('v2/helpers/user/subscription', () => {
  return jest.fn().mockImplementation(() => ({
    isExternalMin: jest.fn(() => false),
  }));
});

describe('project reducer', () => {
  const initialState = {
    data: null,
    status: '',
    instructions: [],
    summary: {},
    dependency: {},
    dependencyStatus: true,
    statusSummary: '',
    loadingSummary: false,
    loadingStatus: false,
    members: [],
    milestones: [],
    tasks: [],
    overview: [],
    summaryOverview: {},
    showAlert: false,
    tenders: {},
    openedDatePickerId: null,
    dashboardActions: {},
    shortlistedSubcontractors: {},
    loadingShortlistedSubcontractors: false,
    ifsProjects: {
      records: [],
      total: 0,
      page: 1,
      search: '',
      loading: false,
      loadingMore: false,
      error: null,
    },
    linkedIfsProject: {
      data: null,
      loading: false,
      error: null,
    },
  };

  it('should handle initial state', () => {
    const newState = reducer(undefined, { type: '@@INIT' });
    expect(newState).toEqual(initialState);
  });

  describe('setOpenedDatePickerId', () => {
    it('should set the opened date picker ID', () => {
      const payload = 'date-picker-123';
      const newState = reducer(initialState, setOpenedDatePickerId(payload));

      expect(newState.openedDatePickerId).toBe(payload);
      expect(newState).toEqual({
        ...initialState,
        openedDatePickerId: payload,
      });
    });

    it('should handle null payload', () => {
      const stateWithPickerId = {
        ...initialState,
        openedDatePickerId: 'some-id',
      };

      const newState = reducer(stateWithPickerId, setOpenedDatePickerId(null));
      expect(newState.openedDatePickerId).toBe(null);
    });
  });

  describe('resetProject', () => {
    it('should reset all project data to initial state', () => {
      const populatedState = {
        ...initialState,
        data: { id: 1, name: 'Test Project' },
        status: 'active',
        instructions: ['instruction1', 'instruction2'],
        summary: { total: 100 },
        dependency: { dep1: 'value1' },
        dependencyStatus: false,
        statusSummary: 'In Progress',
        loadingSummary: true,
        loadingStatus: true,
        members: [{ id: 1, name: 'User 1' }],
        tasks: [{ id: 1, name: 'Task 1' }],
        overview: [{ id: 1, package: 'Package 1' }],
        summaryOverview: { budget: 5000 },
        showAlert: true,
        tenders: { tender1: 'data' },
        openedDatePickerId: 'picker-123',
        ifsProjects: {
          records: [{ id: 7 }],
          total: 1,
          page: 2,
          search: 'x',
          loading: true,
          loadingMore: false,
          error: 'err',
        },
        linkedIfsProject: {
          data: { id: 7, project_code: 'MCL-0042' },
          loading: true,
          error: 'err',
        },
      };

      const newState = reducer(populatedState, resetProject());
      expect(newState).toEqual(initialState);
    });
  });

  describe('resetIfsProjects', () => {
    it('should reset IFS projects catalogue state', () => {
      const populatedState = {
        ...initialState,
        ifsProjects: {
          records: [{ id: 7, project_code: 'MCL-0042' }],
          total: 1,
          page: 2,
          search: 'depot',
          loading: false,
          loadingMore: true,
          error: 'oops',
        },
      };

      const newState = reducer(populatedState, resetIfsProjects());
      expect(newState.ifsProjects).toEqual(initialState.ifsProjects);
      expect(newState.data).toBe(populatedState.data);
    });
  });

  describe('resetOverview', () => {
    it('should reset overview-related data', () => {
      const populatedState = {
        ...initialState,
        data: { id: 1, name: 'Test Project' },
        overview: [{ id: 1, package: 'Package 1' }],
        tasks: [{ id: 1, name: 'Task 1' }],
        summaryOverview: { budget: 5000 },
        summary: { total: 100 },
        openedDatePickerId: 'picker-123',
        // These should remain unchanged
        status: 'active',
        members: [{ id: 1, name: 'User 1' }],
      };

      const newState = reducer(populatedState, resetOverview());

      expect(newState.overview).toEqual([]);
      expect(newState.tasks).toEqual([]);
      expect(newState.summaryOverview).toEqual({});
      expect(newState.summary).toEqual({});
      expect(newState.openedDatePickerId).toBe(null);

      // These should remain unchanged
      expect(newState.data).toEqual(populatedState.data);
      expect(newState.status).toBe('active');
      expect(newState.members).toEqual(populatedState.members);
    });
  });

  describe('updateMember', () => {
    it('should update a member by user_id', () => {
      const stateWithMembers = {
        ...initialState,
        members: [
          {
            user_id: 1,
            name: 'John Doe',
            member: {
              role: 'admin',
              permissions: ['read'],
            },
          },
          {
            user_id: 2,
            name: 'Jane Smith',
            member: {
              role: 'user',
              permissions: ['read'],
            },
          },
        ],
      };

      const payload = {
        id: 1,
        name: 'role',
        value: 'manager',
      };

      const newState = reducer(stateWithMembers, updateMember(payload));

      expect(newState.members[0].member.role).toBe('manager');
      expect(newState.members[0].member.permissions).toEqual(['read']); // Should preserve other properties
      expect(newState.members[1]).toEqual(stateWithMembers.members[1]); // Other members unchanged
    });

    it('should handle string user_id comparison', () => {
      const stateWithMembers = {
        ...initialState,
        members: [
          {
            user_id: '1', // String ID
            name: 'John Doe',
            member: {
              role: 'admin',
            },
          },
        ],
      };

      const payload = {
        id: 1, // Number ID
        name: 'role',
        value: 'manager',
      };

      const newState = reducer(stateWithMembers, updateMember(payload));
      expect(newState.members[0].member.role).toBe('manager');
    });

    it('should not update when user_id does not match', () => {
      const stateWithMembers = {
        ...initialState,
        members: [
          {
            user_id: 1,
            name: 'John Doe',
            member: {
              role: 'admin',
            },
          },
        ],
      };

      const payload = {
        id: 999, // Non-matching ID
        name: 'role',
        value: 'manager',
      };

      const newState = reducer(stateWithMembers, updateMember(payload));
      expect(newState.members[0].member.role).toBe('admin'); // Should remain unchanged
    });
  });

  describe('setTasks', () => {
    beforeEach(() => {
      initTasks.mockClear();
      initTasks.mockImplementation(() => [
        [
          { id: 1, name: 'Task 1' },
          { id: 2, name: 'Task 2' },
        ],
        true,
      ]);
    });

    it('should set tasks when data.tender exists', () => {
      const stateWithTender = {
        ...initialState,
        data: {
          tender: [
            { id: 1, name: 'Tender 1' },
            { id: 2, name: 'Tender 2' },
          ],
        },
        summary: { total: 100 },
        dependency: { dep1: 'value' },
      };

      const newState = reducer(stateWithTender, setTasks());

      expect(initTasks).toHaveBeenCalled();
      expect(newState.tasks).toEqual([
        { id: 1, name: 'Task 1' },
        { id: 2, name: 'Task 2' },
      ]);
      expect(newState.showAlert).toBe(true);
    });

    it('should not set tasks when data.tender is empty', () => {
      const stateWithoutTender = {
        ...initialState,
        data: { tender: [] },
      };

      const newState = reducer(stateWithoutTender, setTasks());

      expect(initTasks).not.toHaveBeenCalled();
      expect(newState.tasks).toEqual([]);
      expect(newState.showAlert).toBe(false);
    });

    it('should not set tasks when data is null', () => {
      const newState = reducer(initialState, setTasks());

      expect(initTasks).not.toHaveBeenCalled();
      expect(newState.tasks).toEqual([]);
      expect(newState.showAlert).toBe(false);
    });
  });

  describe('setOverview - V2 data (with milestones)', () => {
    const v2Payload = {
      loadingQuotes: false,
      orders: [],
      loadingOrders: false,
      submittingProcurement: false,
      loadingSummary: false,
      procurementSchedule: [
        {
          id: 10,
          label: 'Package V2',
          reference_no: 'REF-10',
          procurement: {
            1: {
              id: 1,
              sub_id: 1,
              name: 'Sub One',
              subscription_id: 'sub-1',
              awarded: 1,
              status: { id: 2, clink_label: 'Awarded' },
            },
            2: {
              sub_id: 2,
              name: 'Sub Two',
              status: { uid: 'awarded' },
            },
            3: {
              sub_id: 3,
              name: 'Sub Three',
              status: 'Pending Approval',
            },
          },
          shortlisted_subcontractors: [
            {
              id: 3,
              name: 'Sub Three Duplicate',
              status: { label: 'Draft' },
            },
            {
              subcontractor_id: 4,
              company_name: 'Sub Four',
              status: { prosper_label: 'Shortlisted' },
              has_document: true,
            },
          ],
          tender_coverage: '3/5',
          milestones: {
            current: {
              id: 1,
              sort_order: 1,
              planned_end_date: '2026-02-01',
              label: 'Current Milestone',
              lead_time_status: 'On Track',
              type: 'manual',
            },
            next: null,
            completed: [{ id: 2, label: 'Completed Milestone' }],
          },
          budget: 20000,
          order_value: 15000,
          variance: 5000,
          order_issue_date: '15-01-2026',
          start_on_site: '-',
          variance_type: 'positive',
          variance_percent: '25.0',
          service_label: 'Design and Supply',
          packages: [123],
        },
      ],
    };

    it('builds a v2 overview row merging procurement and shortlisted subcontractors', () => {
      const newState = reducer(initialState, setOverview(v2Payload));

      expect(newState.overview).toHaveLength(1);
      const row = newState.overview[0];

      expect(row.id).toBe(10);
      expect(row.package).toBe('Package V2');
      expect(row.reference_no).toBe('REF-10');

      // procurement entries take priority over duplicate shortlisted entry (id: 3)
      expect(row.subcontractors).toHaveLength(4);

      const subOne = row.subcontractors.find((s) => s.name === 'Sub One');
      expect(subOne.awarded).toBe(true);
      expect(subOne.status).toBe('Awarded');
      expect(subOne.url).toBe('/main-contractor/supply_chain/1?return=sc');

      const subTwo = row.subcontractors.find((s) => s.name === 'Sub Two');
      expect(subTwo.awarded).toBe(true);

      const subThree = row.subcontractors.find((s) => s.name === 'Sub Three');
      expect(subThree.awarded).toBe(false);
      expect(subThree.status).toBe('Pending Approval');

      const subFour = row.subcontractors.find((s) => s.name === 'Sub Four');
      expect(subFour.awarded).toBe(false);
      expect(subFour.status).toBe('Shortlisted');
      expect(subFour.url).toBe('/main-contractor/supply_chain/4?return=sc');

      expect(row.tenderCoverage).toEqual({
        percentage: 60,
        display: '3/5 (60%)',
      });

      expect(row.current_milestone).toEqual({
        id: 1,
        status: 1,
        date: '2026-02-01',
        name: 'Current Milestone',
        risk: 'On Track',
        milestone_type: 'manual',
      });
      expect(row.next_milestone).toBeNull();
      expect(row.complete_milestone).toEqual([
        { id: 2, label: 'Completed Milestone' },
      ]);

      expect(row.budget).toBe(20000);
      expect(row.actual).toBe(15000);
      expect(row.variance).toBe(5000);
      expect(row.issue_order).toBe('2026-01-15');
      expect(row.start_on_site).toBeNull();
      expect(row.variance_type).toBe('positive');
      expect(row.variance_percent).toBe('25.0');
    });

    it('calculates summaryOverview totals for v2 data', () => {
      const newState = reducer(initialState, setOverview(v2Payload));

      expect(newState.summaryOverview).toEqual({
        budget: 20000,
        forecast: 15000,
        profit_loss: 5000,
      });
    });

    it('filters out a v2 package with an empty service_label even when start_on_site and packages are present', () => {
      const payloadWithMissingServiceLabel = {
        ...v2Payload,
        procurementSchedule: [
          {
            ...v2Payload.procurementSchedule[0],
            service_label: '',
          },
        ],
      };

      const newState = reducer(
        initialState,
        setOverview(payloadWithMissingServiceLabel),
      );

      expect(newState.overview).toHaveLength(0);
    });

    it('filters out a v2 package with empty packages even when start_on_site and service_label are present', () => {
      const payloadWithMissingPackages = {
        ...v2Payload,
        procurementSchedule: [
          {
            ...v2Payload.procurementSchedule[0],
            packages: [],
          },
        ],
      };

      const newState = reducer(
        initialState,
        setOverview(payloadWithMissingPackages),
      );

      expect(newState.overview).toHaveLength(0);
    });

    it('filters out a v2 package missing both start_on_site and tender_return', () => {
      const payloadWithMissingDates = {
        ...v2Payload,
        procurementSchedule: [
          {
            ...v2Payload.procurementSchedule[0],
            start_on_site: undefined,
            tender_return: undefined,
          },
        ],
      };

      const newState = reducer(
        initialState,
        setOverview(payloadWithMissingDates),
      );

      expect(newState.overview).toHaveLength(0);
    });

    it('handles a v2 item with no procurement or shortlisted subcontractors', () => {
      const emptyPayload = {
        ...v2Payload,
        procurementSchedule: [
          {
            id: 11,
            label: 'Empty Package',
            milestones: { current: null, next: null, completed: [] },
            start_on_site: '-',
            service_label: 'Design and Supply',
            packages: [123],
          },
        ],
      };

      const newState = reducer(initialState, setOverview(emptyPayload));

      expect(newState.overview[0].subcontractors).toEqual([]);
      expect(newState.overview[0].current_milestone).toBeNull();
      expect(newState.overview[0].tenderCoverage).toEqual({
        percentage: null,
        display: '—',
      });
      expect(newState.overview[0].issue_order).toBe('—');
      expect(newState.overview[0].start_on_site).toBeNull();
      expect(newState.overview[0].status).toBe('Not Started');
    });

    it('does not build overview when submitting procurement', () => {
      const newState = reducer(
        initialState,
        setOverview({ ...v2Payload, submittingProcurement: true }),
      );

      expect(newState.overview).toEqual([
        {
          id: false,
          package: false,
          reference_no: false,
          subcontractors: false,
          tenderCoverage: false,
          current_milestone: false,
          next_milestone: false,
          budget: false,
          actual: false,
          variance: false,
          issue_order: false,
          start_on_site: false,
          status: false,
        },
      ]);
      expect(newState.summaryOverview).toEqual({});
    });

    it('leaves an already ISO-formatted date unchanged', () => {
      const isoDatePayload = {
        ...v2Payload,
        procurementSchedule: [
          {
            ...v2Payload.procurementSchedule[0],
            order_issue_date: '2026-01-15',
          },
        ],
      };

      const newState = reducer(initialState, setOverview(isoDatePayload));
      expect(newState.overview[0].issue_order).toBe('2026-01-15');
    });

    it('returns null status label for non-string, non-object status values', () => {
      const numericStatusPayload = {
        ...v2Payload,
        procurementSchedule: [
          {
            ...v2Payload.procurementSchedule[0],
            procurement: {
              1: { sub_id: 1, name: 'Sub Numeric Status', status: 7 },
            },
            shortlisted_subcontractors: [],
          },
        ],
      };

      const newState = reducer(initialState, setOverview(numericStatusPayload));
      expect(newState.overview[0].subcontractors[0].status).toBeNull();
    });

    it('parses malformed tender coverage strings gracefully', () => {
      const malformedPayload = {
        ...v2Payload,
        procurementSchedule: [
          {
            ...v2Payload.procurementSchedule[0],
            tender_coverage: 'bad-format',
          },
        ],
      };

      const newState = reducer(initialState, setOverview(malformedPayload));
      expect(newState.overview[0].tenderCoverage).toEqual({
        percentage: null,
        display: '—',
      });
    });
  });

  describe('setOverview', () => {
    beforeEach(() => {
      getStatusOverview.mockImplementation(() => ({
        current: { status: 1, name: 'Issue Tender' },
        next: { status: 2, name: 'Quote Due' },
        issue_order: '2023-10-01',
        start_on_site: '2023-12-01',
        status: 'Not Started',
        value: 1250,
      }));

      getBudgetSummary.mockImplementation(() => ({
        budget: 1000000,
        actual: 750000,
        variance: 250000,
      }));
    });

    const mockPayload = {
      loadingQuotes: false,
      orders: [{ id: 1, price: 50000 }],
      loadingOrders: false,
      procurementSchedule: [
        {
          id: 1,
          service_label: 'Design and Supply',
          packages: [123],
          procurement: {
            1: { sub_id: 1, name: 'Sub 1', status: { id: 1 } },
            2: { sub_id: 2, name: 'Sub 2', status: { id: 5 } },
          },
        },
        {
          id: 2,
          service_label: 'Design Only',
          packages: [456],
          procurement: {},
        },
      ],
      submittingProcurement: false,
      loadingSummary: false,
      quotesData: {
        tenders: {
          1: {
            budget: 100000,
            quotes: {
              q1: {
                subcontractor_id: 1,
                subcontractor: { id: 1, name: 'Subcontractor 1' },
                order_price: 25000,
              },
              q2: {
                subcontractor_id: 2,
                subcontractor: { id: 2, name: 'Subcontractor 2' },
                order_price: 0,
              },
            },
          },
        },
      },
    };

    const stateWithTenders = {
      ...initialState,
      data: {
        tender: [
          {
            id: 1,
            label: 'Package A',
            state: true,
            start_on_site: '2023-12-01',
            awarded: false,
          },
        ],
      },
      summary: { 1: { total: 100 } },
    };

    it('should create overview when tenders exist', () => {
      const newState = reducer(stateWithTenders, setOverview(mockPayload));

      expect(newState.overview).toHaveLength(1);
      expect(newState.overview[0]).toMatchObject({
        id: 1,
        package: 'Package A',
        status: 'Not Started',
        budget: 100000,
        actual: 125000, // from quoteData.actual_value (mock has none)
      });
    });

    it('should filter out tenders without state', () => {
      const stateWithInactiveTender = {
        ...stateWithTenders,
        data: {
          tender: [
            {
              id: 1,
              label: 'Package A',
              state: false, // Inactive
              start_on_site: '2023-12-01',
            },
            {
              id: 2,
              label: 'Package B',
              state: true, // Active
              start_on_site: '2023-12-01',
            },
          ],
        },
      };

      const newState = reducer(
        stateWithInactiveTender,
        setOverview(mockPayload),
      );

      // Should only include the active tender
      expect(newState.overview).toHaveLength(1);
      expect(newState.overview[0].id).toBe(2);
    });

    it('should filter out tenders without start_on_site or tender_return', () => {
      const stateWithIncompleteTender = {
        ...stateWithTenders,
        data: {
          tender: [
            {
              id: 1,
              label: 'Package A',
              state: true,
              // Missing start_on_site and tender_return
            },
            {
              id: 2,
              label: 'Package B',
              state: true,
              start_on_site: '2023-12-01',
            },
          ],
        },
      };

      const newState = reducer(
        stateWithIncompleteTender,
        setOverview(mockPayload),
      );

      // Should only include the complete tender
      expect(newState.overview).toHaveLength(1);
      expect(newState.overview[0].id).toBe(2);
    });

    it('should filter out tenders whose procurement schedule entry has no service_label', () => {
      const payloadWithMissingServiceLabel = {
        ...mockPayload,
        procurementSchedule: [
          {
            id: 1,
            service_label: '',
            packages: [123],
            procurement: {},
          },
          {
            id: 2,
            service_label: 'Design Only',
            packages: [456],
            procurement: {},
          },
        ],
      };

      const stateWithTwoTenders = {
        ...stateWithTenders,
        data: {
          tender: [
            {
              id: 1,
              label: 'Package A',
              state: true,
              start_on_site: '2023-12-01',
            },
            {
              id: 2,
              label: 'Package B',
              state: true,
              start_on_site: '2023-12-01',
            },
          ],
        },
      };

      const newState = reducer(
        stateWithTwoTenders,
        setOverview(payloadWithMissingServiceLabel),
      );

      expect(newState.overview).toHaveLength(1);
      expect(newState.overview[0].id).toBe(2);
    });

    it('should filter out tenders whose procurement schedule entry has no packages', () => {
      const payloadWithMissingPackages = {
        ...mockPayload,
        procurementSchedule: [
          {
            id: 1,
            service_label: 'Design and Supply',
            packages: [],
            procurement: {},
          },
        ],
      };

      const newState = reducer(
        stateWithTenders,
        setOverview(payloadWithMissingPackages),
      );

      expect(newState.overview).toHaveLength(0);
    });

    it('should filter out tenders with no matching procurement schedule entry', () => {
      const payloadWithNoMatchingSchedule = {
        ...mockPayload,
        procurementSchedule: [
          {
            id: 999,
            service_label: 'Design and Supply',
            packages: [123],
            procurement: {},
          },
        ],
      };

      const newState = reducer(
        stateWithTenders,
        setOverview(payloadWithNoMatchingSchedule),
      );

      expect(newState.overview).toHaveLength(0);
    });

    it('should only mark the awarded subcontractor true when package is awarded', () => {
      const payloadWithParentAwarded = {
        ...mockPayload,
        procurementSchedule: [
          {
            id: 1,
            awarded: 1,
            service_label: 'Design and Supply',
            packages: [123],
            procurement: {
              1: {
                sub_id: 1,
                name: 'Sub 1',
                status: { uid: 'awarded' },
              },
              2: {
                sub_id: 2,
                name: 'Sub 2',
                status: { uid: 'pending' },
              },
            },
          },
        ],
      };

      const stateWithAwardedTender = {
        ...stateWithTenders,
        data: {
          tender: [
            {
              id: 1,
              label: 'Package A',
              state: true,
              start_on_site: '2023-12-01',
              awarded: true,
            },
          ],
        },
      };

      const newState = reducer(
        stateWithAwardedTender,
        setOverview(payloadWithParentAwarded),
      );

      expect(newState.overview[0].subcontractors).toHaveLength(2);
      expect(newState.overview[0].subcontractors[0].awarded).toBe(true);
      expect(newState.overview[0].subcontractors[1].awarded).toBe(false);
    });

    it('should handle loading states correctly', () => {
      const loadingPayload = {
        ...mockPayload,
        loadingQuotes: true,
        loadingOrders: true,
        submittingProcurement: true,
        loadingSummary: true,
      };

      const newState = reducer(stateWithTenders, setOverview(loadingPayload));

      expect(newState.overview[0].subcontractors).toBe(false);
      expect(newState.overview[0].budget).toBe(false);
      expect(newState.overview[0].actual).toBe(false);
      expect(newState.overview[0].variance).toBe(false);
      expect(newState.overview[0].tenderCoverage).toBe(false);
    });

    it('should set budget summary when quotes data is available', () => {
      const newState = reducer(stateWithTenders, setOverview(mockPayload));

      expect(getBudgetSummary).toHaveBeenCalledWith(mockPayload.quotesData);
      expect(newState.summaryOverview).toMatchObject({
        budget: 1000000,
        actual: 750000,
        variance: 250000,
        forecast: 125000, // sum of overview actual_value (mock tenders have none)
        profit_loss: 875000, // budget - forecast
      });
    });

    it('should handle empty data state', () => {
      const newState = reducer(initialState, setOverview(mockPayload));

      expect(newState.overview).toEqual([
        {
          id: false,
          package: false,
          reference_no: false,
          subcontractors: false,
          tenderCoverage: false,
          current_milestone: false,
          next_milestone: false,
          budget: false,
          actual: false,
          variance: false,
          issue_order: false,
          start_on_site: false,
          status: false,
        },
      ]);
    });

    it('should show tenderCoverage as a dash when no tender documents have been sent (v2 data)', () => {
      const stateWithV2Tenders = {
        ...stateWithTenders,
        data: {
          tender: [
            {
              id: 1,
              label: 'Package A',
              state: true,
              start_on_site: '2023-12-01',
              awarded: false
            }
          ]
        }
      };

      const v2Payload = {
        ...mockPayload,
        procurementSchedule: [
          {
            id: 1,
            label: 'Package A',
            milestones: {},
            tender_coverage: '0/5',
            start_on_site: '2023-12-01',
            service_label: 'Design and Supply',
            packages: [1],
          },
          {
            id: 2,
            label: 'Package B',
            milestones: {},
            tender_coverage: '0/0',
            start_on_site: '2023-12-01',
            service_label: 'Design and Supply',
            packages: [2],
          },
          {
            id: 3,
            label: 'Package C',
            milestones: {},
            tender_coverage: '3/5',
            start_on_site: '2023-12-01',
            service_label: 'Design and Supply',
            packages: [3],
          },
          {
            id: 4,
            label: 'Package D',
            milestones: {},
            tender_coverage: '5/0',
            start_on_site: '2023-12-01',
            service_label: 'Design and Supply',
            packages: [4],
          }
        ]
      };

      const newState = reducer(stateWithV2Tenders, setOverview(v2Payload));

      expect(newState.overview[0].tenderCoverage).toEqual({
        percentage: 0,
        display: '0/5 (0%)'
      });
      expect(newState.overview[1].tenderCoverage).toEqual({
        percentage: null,
        display: '—'
      });
      expect(newState.overview[2].tenderCoverage).toEqual({
        percentage: 60,
        display: '3/5 (60%)'
      });
      expect(newState.overview[3].tenderCoverage).toEqual({
        percentage: null,
        display: '—'
      });
    });
  });
});
