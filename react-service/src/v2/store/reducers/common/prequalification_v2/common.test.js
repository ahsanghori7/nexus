import {
  changeLoading,
  getNotLoadedDefaults,
  initPercentage,
  initPreqState,
  YEAR,
  INITIAL_TURNOVER,
  // CUSTOM_CERTIFICATE, // Not directly used in these initPreqState tests yet, can add if needed
} from './common';
import status from 'store/reducers/common/constants';

// Mock external helpers
jest.mock('v2/helpers/currency', () => ({
  __esModule: true, // Important for modules with default exports
  default: jest.fn((val) => { // This is the mock for parseCurrency (default export)
    if (typeof val === 'string') {
      return parseFloat(val.replace(/,/g, '')) || 0;
    }
    return parseFloat(val) || 0;
  }),
  parseFloatVal: jest.fn((val) => { // This is for the named export
    if (typeof val === 'string') {
      return parseFloat(val.replace(/,/g, '')) || 0;
    }
    return parseFloat(val) || 0;
  }),
}));

jest.mock('v2/helpers/date', () => ({
  expiredDate: jest.fn((date) => {
    const now = new Date('2024-01-15T00:00:00.000Z'); // Fixed "current" date for tests
    return new Date(date) < now; // Ensure date is parsed as Date object
  }),
}));

jest.mock('v2/helpers/prequal/organization', () => ({
  ROLE_CHECKER: {
    'CEO': 'ceo_role',
    'Director': 'director_role',
  },
  OTHER: { value: 'other_role' },
}));

// Mock for prequal/documents constants used in initSections
jest.mock('v2/helpers/prequal/documents', () => ({
  CUSTOM_CERTIFICATE: 'custom-certificate', // Ensure this matches the string key used in state
  SCHEDULE_INDEMNITY: 'Schedule Professional Indemnity', // Actual string label
  STATEMENT_FACT: 'Statement of Fact',
  POLICY_WORDING: 'Policy Wording',
}));


describe('changeLoading', () => {
  it('should return loading status when severity is info', () => {
    const result = changeLoading(null, 'info', 'Loading data...');
    expect(result).toEqual({
      severity: 'info',
      message: 'Loading data...',
      type: status.LOADING_STATUS,
    });
  });

  it('should return failure status when severity is error', () => {
    const result = changeLoading(null, 'error', 'Failed to load');
    expect(result).toEqual({
      severity: 'error',
      message: 'Failed to load',
      type: status.FAILURE_STATUS,
    });
  });

  it('should return idle status when severity is false', () => {
    const result = changeLoading(null, false, '');
    expect(result).toEqual({
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    });
  });

  it('should return idle status when severity is not provided', () => {
    const result = changeLoading(null);
    expect(result).toEqual({
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    });
  });

  it('should update state.statusPreq when state is provided and severity is info', () => {
    const mockState = { statusPreq: {} };
    changeLoading(mockState, 'info', 'Processing...');
    expect(mockState.statusPreq).toEqual({
      severity: 'info',
      message: 'Processing...',
      type: status.LOADING_STATUS,
    });
  });

  it('should update state.statusPreq when state is provided and severity is error', () => {
    const mockState = { statusPreq: {} };
    changeLoading(mockState, 'error', 'An error occurred');
    expect(mockState.statusPreq).toEqual({
      severity: 'error',
      message: 'An error occurred',
      type: status.FAILURE_STATUS,
    });
  });

  it('should update state.statusPreq to idle when state is provided and severity is false', () => {
    const mockState = { statusPreq: {} };
    changeLoading(mockState, false, 'Previous message');
    expect(mockState.statusPreq).toEqual({
      severity: false,
      message: 'Previous message',
      type: status.IDLE_STATUS,
    });
  });

  it('should update state.statusPreq to idle and clear message if message is empty string for idle', () => {
    const mockState = { statusPreq: {} };
    changeLoading(mockState, false, '');
    expect(mockState.statusPreq).toEqual({
      severity: false,
      message: '',
      type: status.IDLE_STATUS,
    });
  });
});

describe('getNotLoadedDefaults', () => {
  const defaultItems = [
    { id: 1, label: 'Apple', value: 'fruit_apple' },
    { id: 2, label: 'Banana', value: 'fruit_banana' },
    { id: 3, label: 'Cherry', value: 'fruit_cherry' },
  ];

  it('should return an empty array if defaults is empty', () => {
    expect(getNotLoadedDefaults([], [{ label: 'Apple' }])).toEqual([]);
  });

  it('should return all defaults if loaded is empty', () => {
    expect(getNotLoadedDefaults(defaultItems, [])).toEqual(defaultItems);
  });

  it('should return an empty array if both are empty', () => {
    expect(getNotLoadedDefaults([], [])).toEqual([]);
  });

  it('should return all defaults if no overlap (label matching)', () => {
    const loadedItems = [{ label: 'Durian' }, { label: 'Elderberry' }];
    expect(getNotLoadedDefaults(defaultItems, loadedItems)).toEqual(defaultItems);
  });

  it('should filter out items whose labels are in loaded (case-insensitive)', () => {
    const loadedItems = [{ label: 'apple' }, { label: 'CHERRY' }];
    const expected = [{ id: 2, label: 'Banana', value: 'fruit_banana' }];
    expect(getNotLoadedDefaults(defaultItems, loadedItems)).toEqual(expected);
  });

  it('should filter out items whose values match a label in loaded (case-insensitive)', () => {
    const loadedItems = [{ label: 'fruit_banana' }];
    const expected = [
      { id: 1, label: 'Apple', value: 'fruit_apple' },
      { id: 3, label: 'Cherry', value: 'fruit_cherry' },
    ];
    expect(getNotLoadedDefaults(defaultItems, loadedItems)).toEqual(expected);
  });

  it('should filter correctly if a default item label matches a loaded label AND another default item value matches a loaded label', () => {
    const loadedItems = [{ label: 'Apple' }, { label: 'fruit_cherry' }];
    const expected = [{ id: 2, label: 'Banana', value: 'fruit_banana' }];
    expect(getNotLoadedDefaults(defaultItems, loadedItems)).toEqual(expected);
  });

  it('should return an empty array if all default items are covered by loaded items (either by label or value)', () => {
    const loadedItems = [
      { label: 'Apple' },
      { label: 'fruit_banana' },
      { label: 'CHERRY' },
    ];
    expect(getNotLoadedDefaults(defaultItems, loadedItems)).toEqual([]);
  });
});

describe('initPercentage', () => {
  const basePercentageSection = 100 / 8; // 12.5

  const getInitialMockStateForPercentage = () => ({ // Renamed to avoid conflict
    turnover: [{ year: String(YEAR), value: '0' }],
    company_information: {
      min_order_value: '0',
      max_order_value: '0',
      num_current_employees: 0,
    },
    insurances: [],
    references: [],
    percentage: { finance: 0, documents: 0, references: 0 },
  });

  it('should set all percentages to 0 if no criteria are met', () => {
    const mockState = getInitialMockStateForPercentage();
    initPercentage(mockState);
    expect(mockState.percentage).toEqual({
      finance: 0,
      documents: 0,
      references: 0,
    });
  });

  it('should calculate finance percentage correctly (1/4 criteria)', () => {
    const mockState = getInitialMockStateForPercentage();
    mockState.turnover = [{ year: String(YEAR), value: '1000' }];
    initPercentage(mockState);
    expect(mockState.percentage.finance).toBe(basePercentageSection * 1);
    expect(mockState.percentage.documents).toBe(0);
    expect(mockState.percentage.references).toBe(0);
  });

  it('should calculate finance percentage correctly (4/4 criteria)', () => {
    const mockState = getInitialMockStateForPercentage();
    mockState.turnover = [{ year: String(YEAR), value: '1000' }];
    mockState.company_information.min_order_value = '1';
    mockState.company_information.max_order_value = '100';
    mockState.company_information.num_current_employees = 10;
    initPercentage(mockState);
    expect(mockState.percentage.finance).toBe(basePercentageSection * 4);
  });
  
  it('should calculate documents percentage correctly if valid insurance exists', () => {
    const mockState = getInitialMockStateForPercentage();
    const futureDate = new Date('2025-01-01'); // Fixed future date for mock
    mockState.insurances = [{ date: futureDate.toISOString().split('T')[0] }];
    initPercentage(mockState);
    expect(mockState.percentage.documents).toBe(basePercentageSection * 2);
  });

  it('should set documents percentage to 0 if insurance is expired', () => {
    const mockState = getInitialMockStateForPercentage();
    const pastDate = new Date('2023-01-01'); // Fixed past date for mock
    mockState.insurances = [{ date: pastDate.toISOString().split('T')[0] }];
    initPercentage(mockState);
    expect(mockState.percentage.documents).toBe(0);
  });
  
  it('should calculate references percentage correctly if approved reference exists', () => {
    const mockState = getInitialMockStateForPercentage();
    mockState.references = [{ status: 'approved' }];
    initPercentage(mockState);
    expect(mockState.percentage.references).toBe(basePercentageSection * 2);
  });

  it('should set references percentage to 0 if no approved references', () => {
    const mockState = getInitialMockStateForPercentage();
    mockState.references = [{ status: 'pending' }];
    initPercentage(mockState);
    expect(mockState.percentage.references).toBe(0);
  });

  it('should calculate all percentages correctly when all criteria met', () => {
    const mockState = getInitialMockStateForPercentage();
    mockState.turnover = [{ year: String(YEAR), value: '5000' }];
    mockState.company_information.min_order_value = '100';
    mockState.company_information.max_order_value = '10000';
    mockState.company_information.num_current_employees = 5;
    const futureDate = new Date('2025-01-01');
    mockState.insurances = [{ date: futureDate.toISOString().split('T')[0] }];
    mockState.references = [{ status: 'approved' }];
    
    initPercentage(mockState);
    expect(mockState.percentage).toEqual({
      finance: basePercentageSection * 4, 
      documents: basePercentageSection * 2, 
      references: basePercentageSection * 2, 
    });
  });

  it('should handle missing turnover for current year gracefully', () => {
    const mockState = getInitialMockStateForPercentage();
    mockState.turnover = [{ year: String(YEAR - 1), value: '1000' }]; 
    mockState.company_information.min_order_value = '1'; 
    mockState.company_information.max_order_value = '100';
    mockState.company_information.num_current_employees = 10;
    initPercentage(mockState);
    expect(mockState.percentage.finance).toBe(basePercentageSection * 3); 
  });
});

describe('initPreqState', () => {
  let mockState;

  beforeEach(() => {
    jest.clearAllMocks();
    mockState = {
      statusPreq: {},
      documents: {},
      company_information: {},
      organisation: [],
      turnover: [{...INITIAL_TURNOVER, year: String(YEAR)}], // Ensure current year is present
      references: [],
      percentage: { finance: 0, documents: 0, references: 0 },
      insurances: [], 
      accreditation: [],
      'custom-certificate': [],
    };
  });

  const mockPayloadBase = {
    company_information: {
      name: 'Test Corp',
      avg_order_value: '1,000.00',
      max_order_value: '5,000.00',
      min_order_value: '500.00',
      num_current_employees: 10,
    },
    financials: [
      { year: String(YEAR), value: '100,000.00', active_trading: true, profit_before_tax: '10,000.00' },
      { year: String(YEAR - 1), value: '80,000.00', active_trading: true, profit_before_tax: '8,000.00' },
    ],
    organisation: [
      { title: 'CEO', firstname: 'John', lastname: 'Doe', email: 'john@test.com' },
      { title: 'Manager', firstname: 'Jane', lastname: 'Smith', email: 'jane@test.com' },
    ],
    references: [
      { id: 1, project_name: 'Project Alpha', client_name: 'Client A', status: 'approved', contract_value: '10000' },
      { id: 2, project_name: 'Project Beta', client_name: 'Client B', status: 'pending', contract_value: '20000' },
    ],
    insurances: [
      { id: 101, label: 'Employers Liability', file: 'emp.pdf', price: '1000000', date: '2025-12-31', requests: [] },
    ],
    accreditation: [
      { id: 201, label: 'ISO 9001', file: 'iso.pdf', date: '2023-12-31', requests: [] }, // Expired by mock
    ],
  };

  it('should initialize company_information correctly', () => {
    initPreqState(mockState, mockPayloadBase, {}, {});
    expect(mockState.company_information.name).toBe('Test Corp');
    expect(mockState.company_information.avg_order_value).toBe(1000);
    expect(mockState.company_information.min_order_value).toBe(500);
    expect(mockState.company_information.max_order_value).toBe(5000);
  });

  it('should initialize financials (turnover) correctly', () => {
    initPreqState(mockState, mockPayloadBase, {}, {});
    expect(mockState.turnover).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ year: String(YEAR), value: 100000, initialized: true }),
        expect.objectContaining({ year: String(YEAR - 1), value: 80000, initialized: true }),
      ])
    );
  });

  it('should initialize organisation correctly with role mapping', () => {
    initPreqState(mockState, mockPayloadBase, {}, {});
    expect(mockState.organisation).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: 'CEO', role: 'ceo_role' }),
        expect.objectContaining({ title: 'Manager', role: 'other_role', role_input: 'Manager' }),
      ])
    );
  });
  
  // it('should initialize document sections if documents flag is true', () => {
  //   initPreqState(mockState, mockPayloadBase, mockDefaultDocDefinitions, { documents: true });
  //   expect(mockState.insurances.find(doc => doc.label === 'Employers Liability')).toBeDefined();
  //   expect(mockState.insurances.find(doc => doc.label === 'Public Liability')).toBeDefined(); // From defaults
  //   expect(mockState.accreditation.find(doc => doc.label === 'ISO 9001')).toBeDefined();
  //   expect(mockState.accreditation.find(doc => doc.label === 'CHAS')).toBeDefined(); // From defaults
  // });
  
  // it('should initialize a specific document section if its own flag is true', () => {
  //   initPreqState(mockState, mockPayloadBase, mockDefaultDocDefinitions, { 'custom-certificate': true });
  //   expect(mockState['custom-certificate'].find(doc => doc.label === 'My Custom Cert')).toBeDefined();
  // });

  it('should initialize references if references flag is true', () => {
    // Pass empty mockDefaultDocDefinitions for references to ensure it's not using that
    initPreqState(mockState, mockPayloadBase, { references: [] }, { references: true });
    expect(mockState.references.length).toBe(2);
    expect(mockState.references.find(ref => ref.project_name === 'Project Alpha')).toBeDefined();
  });
  
  it('should initialize references if payload has references and no specific flag is present', () => {
    initPreqState(mockState, { ...mockPayloadBase }, {}, { documents: true }); // No 'references' flag
    expect(mockState.references.length).toBe(2);
  });

  it('should initialize sections from object defaults with requestedBy and extra fallbacks', () => {
    mockState.documents = {
      insurances: {
        options: [
          {
            id: 10,
            name: 'Schedule Professional Indemnity',
            extra: [
              { id: 100, name: 'Statement of Fact' },
              { id: 101, name: 'Policy Wording' },
            ],
          },
          { id: 11, name: 'Employers Liability' },
        ],
      },
    };

    const payload = {
      insurances: [
        {
          id: 501,
          section: 'insurances',
          name: 'Schedule Professional Indemnity',
          label: 'Schedule Professional Indemnity',
          file: 'schedule.pdf',
          price: '1200',
          requested: true,
          requests: [
            {
              label: 'Schedule Professional Indemnity',
              requested_at: '2024-01-01T00:00:00.000Z',
              main_contractor: 'Old Contractor',
            },
            {
              label: 'Schedule Professional Indemnity',
              requested_at: '2024-03-01T00:00:00.000Z',
              main_contractor: 'Latest Contractor',
            },
            {
              label: 'Schedule Professional Indemnity',
              requested_at: '2024-04-01T00:00:00.000Z',
              request_fullfilled_at: '2024-04-02T00:00:00.000Z',
              main_contractor: 'Ignored Contractor',
            },
          ],
          extra: [{ label: 'Statement of Fact', document: 'sof.pdf' }],
        },
        {
          id: 502,
          section: 'insurances',
          name: 'Unknown Insurance',
          label: 'Unknown Insurance',
          file: 'unknown.pdf',
          requests: [],
        },
      ],
    };

    initPreqState(mockState, payload, {}, mockState.documents);

    const schedule = mockState.insurances.find(
      (i) => i.label === 'Schedule Professional Indemnity',
    );
    const unknownInsurance = mockState.insurances.find(
      (i) => i.label === 'Unknown Insurance',
    );
    const defaultInsurance = mockState.insurances.find(
      (i) => i.label === 'Employers Liability',
    );

    expect(schedule).toEqual(
      expect.objectContaining({
        document: 'schedule.pdf',
        custom: false,
        request: true,
        requestedBy: 'Latest Contractor',
        price: 1200,
      }),
    );
    expect(schedule.extra).toEqual([
      { label: 'Statement of Fact', document: 'sof.pdf' },
      { id: 101, label: 'Policy Wording' },
    ]);
    expect(unknownInsurance.requestedBy).toBe('');
    expect(defaultInsurance).toEqual(
      expect.objectContaining({
        id: 11,
        label: 'Employers Liability',
        value: 'Employers Liability',
      }),
    );
  });

  it('should prepend current and previous year turnover when current year is missing', () => {
    const payload = {
      financials: [
        {
          year: String(YEAR - 2),
          value: '3000',
          active_trading: true,
        },
      ],
    };

    initPreqState(mockState, payload, {}, {});

    expect(mockState.turnover[0]).toEqual(
      expect.objectContaining({ year: String(YEAR) }),
    );
    expect(mockState.turnover[1]).toEqual(
      expect.objectContaining({ year: String(YEAR - 1) }),
    );
    expect(mockState.turnover).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ year: String(YEAR - 2), initialized: true }),
      ]),
    );
  });

  // it('should call initPercentage and changeLoading at the end, affecting state', () => {
  //   initPreqState(mockState, mockPayloadBase, mockDefaultDocDefinitions, { documents: true, references: true });
  //   expect(mockState.percentage).toEqual({
  //       finance: 50, // 4 * 12.5
  //       documents: 25, // 1 valid insurance * 2 * 12.5
  //       references: 25, // 1 approved reference * 2 * 12.5
  //   });

  //   expect(mockState.statusPreq).toEqual({
  //     severity: false,
  //     message: '',
  //     type: status.IDLE_STATUS,
  //   });
  // });
  
  // it('should correctly initialize extra documents for SCHEDULE_INDEMNITY in insurances', () => {
  //   const payloadWithScheduleIndemnity = {
  //     ...mockPayloadBase,
  //     insurances: [
  //       { 
  //         id: 102, 
  //         label: 'Schedule Professional Indemnity', 
  //         file: 'schedule.pdf', 
  //         price: '200000', 
  //         date: '2025-12-31', 
  //         requests: [],
  //         extra: [ 
  //           { label: 'Statement of Fact', file: 'sof.pdf', date: '2025-12-01' }
  //         ]
  //       }
  //     ]
  //   };
  //   initPreqState(mockState, payloadWithScheduleIndemnity, mockDefaultDocDefinitions, { documents: true });
  //   const scheduleIndemnity = mockState.insurances.find(ins => ins.label === 'Schedule Professional Indemnity');
  //   expect(scheduleIndemnity).toBeDefined();
  //   expect(scheduleIndemnity.extra).toBeDefined();
  //   expect(scheduleIndemnity.extra.length).toBe(2); 
  //   expect(scheduleIndemnity.extra.find(ex => ex.label === 'Statement of Fact').document).toBe('sof.pdf');
  //   expect(scheduleIndemnity.extra.find(ex => ex.label === 'Policy Wording').document).toBeUndefined();
  // });
});
