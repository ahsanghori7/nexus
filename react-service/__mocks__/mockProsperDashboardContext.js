// Mock context specifically for prosper dashboard components
const mockProsperDashboardContext = {
  actions: {
    fetchTokens: jest.fn(),
    fetchSupplyChainAnalytics: jest.fn(),
  },
};

const mockUseContext = jest.fn(() => mockProsperDashboardContext);

module.exports = {
  useContext: mockUseContext,
  mockProsperDashboardContext,
  __esModule: true,
  default: {
    useContext: mockUseContext,
  },
};
