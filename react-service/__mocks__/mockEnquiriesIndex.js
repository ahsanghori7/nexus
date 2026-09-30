// Mock setup for EnquiriesV2 index component testing
export const mockEnquiriesState = {
  latest: [
    { id: 1, project: 'Test Project 1', package: 'Package 1' },
    { id: 2, project: 'Test Project 2', package: 'Package 2' },
  ],
  current: [
    {
      id: 1,
      project: 'Test Project 1',
      package: 'Package 1',
      contractor: 'Test Contractor',
      trades: 'Construction',
      period_start: '2024-01-15',
      period_end: '2024-06-15',
      period_amount: 100000,
      tender_amount: 1000000,
      author_id: 'author1',
      group_id: 1,
      project_id: 1,
      slug: 'test-project',
      document: {
        enquiry: {
          has_boq: true,
        },
      },
    },
    {
      id: 2,
      project: 'Test Project 2',
      package: 'Package 2',
      contractor: 'Test Contractor 2',
      trades: 'Electrical',
      period_start: '2024-02-15',
      period_end: '2024-07-15',
      period_amount: 200000,
      tender_amount: 2000000,
      author_id: 'author2',
      group_id: 2,
      project_id: 2,
      slug: 'test-project-2',
      document: {
        enquiry: {
          has_boq: false,
        },
      },
    },
  ],
  status: false,
  documents: [],
};

export const mockSubcontractor = {
  id: 1,
  subscription_id: 1,
  country: {
    code: 'UK',
  },
};

export const mockContext = {
  actions: {
    fetchEnquiries: jest.fn(),
    fetchDocumentsHistory: jest.fn(),
    nextBatch: jest.fn(),
    tenderIsDownloaded: jest.fn(),
    patchEnquiriesStatus: jest.fn(),
  },
};

export const mockDispatch = jest.fn();

export const mockUseExpanded = {
  expanded: [1],
  handleChangeExpanded: jest.fn(),
};

// Mock query string variables
export const mockQueryStringVars = {
  enquiry_id: '1',
};

// Mock analytics function
export const mockAnalytics = jest.fn((event, authorId, groupId, callback) => {
  if (callback) callback();
});

// Mock getStatus function
export const mockGetStatus = jest.fn((data) => ({
  status: data?.status || 'TENDER_RECEIVED',
}));
