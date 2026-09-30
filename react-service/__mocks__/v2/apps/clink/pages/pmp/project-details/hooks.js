// Mock for useUpdateProject hook
export default function useUpdateProject() {
  return {
    // Site details refs
    siteDetailsRef: { current: null },
    clientDetailsRef: { current: null },
    insuranceRequirementsRef: { current: null },

    // Site details state
    useAddressOne: ['123 Mock Street', jest.fn()],
    useAddressTwo: ['Apt 1', jest.fn()],
    useCity: ['Mock City', jest.fn()],
    usePostcode: ['M1 1AA', jest.fn()],
    useOpeningHoursWeekdays: ['9-5', jest.fn()],
    useOpeningHoursWeekends: ['10-4', jest.fn()],

    // Client details state
    useClientAddressOne: ['456 Client St', jest.fn()],
    useClientAddressTwo: ['Suite 2', jest.fn()],
    useClientCity: ['Client City', jest.fn()],
    useClientPostcode: ['C1 1BB', jest.fn()],
    useClientName: ['Mock Client', jest.fn()],
    useClientRegNumber: ['12345678', jest.fn()],

    // Insurance state
    useWorkInsurance: ['2', jest.fn()],
    useProductInsurance: ['1', jest.fn()],
    useProfessionalIndemnityInsurance: ['3', jest.fn()],
    useGia: ['500', jest.fn()],

    // Error handling
    useErrorsOne: [[], jest.fn()],
    useErrorsTwo: [[], jest.fn()],

    // Actions
    handleUpdateProject: jest.fn(),
    handleSearch: jest.fn(),
  };
}
