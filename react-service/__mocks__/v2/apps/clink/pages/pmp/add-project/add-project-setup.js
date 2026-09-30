// Shared mock setup for add-project page components
// Provides reusable context-aware mocks for PMP add-project tests

export const mockConstants = {
  project: {
    type: {
      residential: 'Residential',
      commercial: 'Commercial',
      infrastructure: 'Infrastructure',
      industrial: 'Industrial'
    }
  }
};

export const mockAttributes = {
  regions: [
    { id: '1', label: 'North Region' },
    { id: '2', label: 'South Region' },
    { id: '3', label: 'East Region' },
    { id: '4', label: 'West Region' }
  ]
};

export const mockAccount = {
  groups: [
    { id: '1', label: 'Group 1' },
    { id: '2', label: 'Group 2' }
  ]
};

export const mockState = {
  constants: mockConstants,
  attributes: mockAttributes,
  account: mockAccount
};

export const mockDispatch = jest.fn();

export const mockNavigate = jest.fn();

export const mockContext = {
  actions: {
    fetchAttrRegions: jest.fn(),
    fetchConstants: jest.fn(),
    fetchAsiteFolders: jest.fn(),
    fetchIfsProjects: jest.fn(),
    resetIfsProjects: jest.fn(),
    fetchGroups: jest.fn(),
    addProject: jest.fn(() => Promise.resolve({ payload: { id: '123' } }))
  }
};

export const mockContextHook = jest.fn(() => mockContext);

// Mock postData function
export const mockPostData = jest.fn(() => Promise.resolve());

// Mock i18next
export const mockI18next = {
  t: jest.fn((key) => key)
};

// Redux connect mock helper
export const createMockConnectedComponent = (Component) => {
  return (props) => (
    <Component
      constants={mockConstants}
      attributes={mockAttributes}
      account={mockAccount}
      dispatch={mockDispatch}
      {...props}
    />
  );
};
