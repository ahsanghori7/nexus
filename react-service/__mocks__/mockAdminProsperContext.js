// Mock context specifically for admin prosper pages
const mockAdminProsperContext = {
  logo: {
    src: '/mock-logo.png',
    alt: 'Mock Logo',
    width: 100,
    height: 50,
  },
  pages: {
    home: {
      title: 'Home',
      keyTitle: 'home-title',
      url: '/admin/prosper',
    },
    dashboard: {
      title: 'Dashboard',
      keyTitle: 'dashboard-title',
      url: '/admin/prosper/dashboard',
    },
    accountsProsper: {
      title: 'Accounts',
      keyTitle: 'accounts-title',
      url: '/admin/prosper/accounts',
    },
    accountsProsperSupplyChain: {
      title: 'Supply Chain',
      keyTitle: 'supply-chain-title',
      url: '/admin/prosper/accounts/supply-chain',
    },
    search: {
      title: 'Search',
      keyTitle: 'search-title',
      url: '/admin/prosper/search',
    },
  },
  actions: {
    fetchDashboardData: jest.fn(),
    fetchAccounts: jest.fn(),
    fetchSupplyChain: jest.fn(),
  },
};

module.exports = {
  mockAdminProsperContext,
  __esModule: true,
  default: mockAdminProsperContext,
};
