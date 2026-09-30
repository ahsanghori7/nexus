// Mock setup for project-details components testing
export const mockProject = {
  data: {
    id: 1,
    slug: 'mock-project',
    site_address_one: '123 Mock Street',
    site_address_two: 'Apt 1',
    site_address_city: 'Mock City',
    site_address_postcode: 'M1 1AA',
    opening_hours_weekdays: '9-5',
    opening_hours_weekends: '10-4',
    client_address_one: '456 Client St',
    client_address_two: 'Suite 2',
    client_address_city: 'Client City',
    client_address_postcode: 'C1 1BB',
    client_name: 'Mock Client',
    client_reg_number: '12345678',
    employer_liabilty_insurance: 2,
    public_product_insurance: 1,
    professional_indemnity_insurance: 3,
    gia: 500,
  },
  loading: false,
  error: null,
};

export const mockConstants = {
  project: {
    insurances: {
      '1': '£1M',
      '2': '£2M',
      '3': '£5M',
      '4': '£10M',
    },
    type: {
      '1': 'Commercial',
      '2': 'Residential',
    },
  },
  loading: false,
  error: null,
};

export const mockClinkAccount = {
  country: {
    code: 'UK',
    name: 'United Kingdom',
  },
  id: 1,
  name: 'Mock Account',
};

export const mockReduxState = {
  project: mockProject,
  constants: mockConstants,
  clinkAccount: mockClinkAccount,
};

export const mockDispatch = jest.fn();

export const mockNavigate = jest.fn();

// Mock for useUpdateProject hook
export const mockUseUpdateProject = {
  useGia: ['500', jest.fn()],
  useProductInsurance: ['1', jest.fn()],
  useWorkInsurance: ['2', jest.fn()],
  useProfessionalIndemnityInsurance: ['3', jest.fn()],
  useErrorsTwo: [[]],
  handleUpdateProject: jest.fn(),
};

// Mock context for clink
export const mockContext = {
  actions: {
    fetchConstants: jest.fn(),
    updateProject: jest.fn(),
  },
};
