import { renderHook, act } from '@testing-library/react-hooks';
import { BrowserRouter } from 'react-router-dom';
import useUpdateProject from './hooks';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock context hook
const mockContextActions = {
  updateProject: jest.fn(),
};

jest.mock('hooks/context', () => ({
  useContext: () => ({
    actions: mockContextActions,
  }),
}));

describe('useUpdateProject Hook', () => {
  const mockDispatch = jest.fn();
  const mockProjectData = {
    site_address_one: '123 Test Street',
    site_address_two: 'Apt 1',
    site_address_city: 'Test City',
    site_address_postcode: 'T1 1AA',
    opening_hours_weekdays: '9-5',
    opening_hours_weekends: '10-4',
    client_address_one: '456 Client St',
    client_address_two: 'Suite 2',
    client_address_city: 'Client City',
    client_address_postcode: 'C1 1BB',
    client_name: 'Test Client',
    client_reg_number: '12345678',
    employer_liabilty_insurance: 2,
    public_product_insurance: 1,
    professional_indemnity_insurance: 3,
    gia: 500,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderHookWithRouter = (projectData = {}) => {
    return renderHook(() => useUpdateProject(mockDispatch, projectData), {
      wrapper: ({ children }) => <BrowserRouter>{children}</BrowserRouter>,
    });
  };

  it('initializes with empty values when no project data provided', () => {
    const { result } = renderHookWithRouter();

    expect(result.current.useAddressOne[0]).toBe('');
    expect(result.current.useCity[0]).toBe('');
    expect(result.current.usePostcode[0]).toBe('');
    expect(result.current.useClientName[0]).toBe('');
  });

  it('initializes with project data when provided', () => {
    const { result } = renderHookWithRouter(mockProjectData);

    expect(result.current.useAddressOne[0]).toBe('123 Test Street');
    expect(result.current.useAddressTwo[0]).toBe('Apt 1');
    expect(result.current.useCity[0]).toBe('Test City');
    expect(result.current.usePostcode[0]).toBe('T1 1AA');
    expect(result.current.useClientName[0]).toBe('Test Client');
    expect(result.current.useClientRegNumber[0]).toBe('12345678');
    expect(result.current.useWorkInsurance[0]).toBe(2);
    expect(result.current.useProductInsurance[0]).toBe(1);
    expect(result.current.useGia[0]).toBe(500);
  });

  it('provides setter functions for all state values', () => {
    const { result } = renderHookWithRouter();

    act(() => {
      result.current.useAddressOne[1]('New Address');
    });

    expect(result.current.useAddressOne[0]).toBe('New Address');
  });

  it('provides refs for sections', () => {
    const { result } = renderHookWithRouter();

    expect(result.current.siteDetailsRef).toBeDefined();
    expect(result.current.clientDetailsRef).toBeDefined();
    expect(result.current.insuranceRequirementsRef).toBeDefined();
  });

  it('provides error state management', () => {
    const { result } = renderHookWithRouter();

    expect(result.current.useErrorsOne[0]).toEqual([]);
    expect(result.current.useErrorsTwo[0]).toEqual([]);

    act(() => {
      result.current.useErrorsOne[1](['test error']);
    });

    expect(result.current.useErrorsOne[0]).toEqual(['test error']);
  });

  it('provides handleUpdateProject function', () => {
    const { result } = renderHookWithRouter();

    expect(typeof result.current.handleUpdateProject).toBe('function');
  });

  it('updates multiple state values independently', () => {
    const { result } = renderHookWithRouter();

    act(() => {
      result.current.useAddressOne[1]('Address 1');
      result.current.useAddressTwo[1]('Address 2');
      result.current.useCity[1]('New City');
    });

    expect(result.current.useAddressOne[0]).toBe('Address 1');
    expect(result.current.useAddressTwo[0]).toBe('Address 2');
    expect(result.current.useCity[0]).toBe('New City');
  });

  it('handles insurance values correctly', () => {
    const { result } = renderHookWithRouter();

    act(() => {
      result.current.useWorkInsurance[1](5);
      result.current.useProductInsurance[1](3);
      result.current.useProfessionalIndemnityInsurance[1](2);
    });

    expect(result.current.useWorkInsurance[0]).toBe(5);
    expect(result.current.useProductInsurance[0]).toBe(3);
    expect(result.current.useProfessionalIndemnityInsurance[0]).toBe(2);
  });

  it('handles GIA value correctly', () => {
    const { result } = renderHookWithRouter();

    act(() => {
      result.current.useGia[1]('750');
    });

    expect(result.current.useGia[0]).toBe('750');
  });

  it('handles opening hours state', () => {
    const { result } = renderHookWithRouter();

    act(() => {
      result.current.useWeekdays[1]('8-6');
      result.current.useWeekends[1]('9-3');
    });

    expect(result.current.useWeekdays[0]).toBe('8-6');
    expect(result.current.useWeekends[0]).toBe('9-3');
  });

  it('handles client details state', () => {
    const { result } = renderHookWithRouter();

    act(() => {
      result.current.useClientAddressOne[1]('New Client Address');
      result.current.useClientCity[1]('New Client City');
      result.current.useClientPostcode[1]('NC1 1CC');
    });

    expect(result.current.useClientAddressOne[0]).toBe('New Client Address');
    expect(result.current.useClientCity[0]).toBe('New Client City');
    expect(result.current.useClientPostcode[0]).toBe('NC1 1CC');
  });
});