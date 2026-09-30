/**
 * Page-specific mock setup for general-info page testing
 * This file contains mock configurations specific to the general-info page components
 */

// Mock constants data for general-info testing
export const mockConstants = {
  project: {
    type: {
      residential: 'Residential',
      commercial: 'Commercial',
      industrial: 'Industrial',
      infrastructure: 'Infrastructure'
    },
    phase: {
      planning: 'Planning',
      design: 'Design',
      construction: 'Construction',
      active: 'Active',
      completed: 'Completed',
      suspended: 'Suspended'
    }
  }
};

// Mock attributes data for general-info testing
export const mockAttributes = {
  regions: [
    { id: '1', label: 'North Region' },
    { id: '2', label: 'South Region' },
    { id: '3', label: 'East Region' },
    { id: '4', label: 'West Region' }
  ]
};

// Mock Redux store state for general-info testing
export const createMockStoreState = (overrides = {}) => ({
  constants: { ...mockConstants, ...overrides.constants },
  attributes: { ...mockAttributes, ...overrides.attributes },
  ...overrides
});

// Mock context for general-info testing
export const mockContext = {
  actions: {
    fetchConstants: jest.fn(),
    fetchAttrRegions: jest.fn(),
    updateProject: jest.fn()
  }
};

// Mock add project hooks data
export const mockAddProjectHooks = {
  useProjectName: ['Test Project', jest.fn()],
  useProjectReference: ['REF123', jest.fn()],
  useDescription: ['Test Description', jest.fn()],
  useLocation: ['1', jest.fn()],
  useType: ['residential', jest.fn()]
};

// Mock update project hooks data
export const mockUpdateProjectHooks = {
  useProjectStatus: ['active', jest.fn()],
  useStartDate: ['2024-01-01', jest.fn()],
  useCompletitionDate: ['2024-12-31', jest.fn()],
  useErrors: [[], jest.fn()]
};

// Helper function to create component props for testing
export const createMockProps = (overrides = {}) => ({
  constants: mockConstants,
  dispatch: jest.fn(),
  useAddProject: mockAddProjectHooks,
  useUpdateProject: mockUpdateProjectHooks,
  attributes: mockAttributes,
  ...overrides
});
