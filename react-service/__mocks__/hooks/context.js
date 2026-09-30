// Mock for hooks/context
const mockUseContext = jest.fn();

// Mock BASE_DIRS constant
global.BASE_DIRS = {
  V2: {
    PROSPER: 'prosper',
    ADMIN: 'admin',
    CLINK: 'clink'
  }
};

// Default mock context return value
const defaultContext = {
  actions: {
    fetchActivities: jest.fn(() => ({ type: 'FETCH_ACTIVITIES' })),
    fetchOpportunitiesByAccount: jest.fn(() => ({ type: 'FETCH_OPPORTUNITIES' })),
    fetchEngagement: jest.fn(() => ({ type: 'FETCH_ENGAGEMENT' })),
    fetchAdminSupplyChain: jest.fn(() => ({ type: 'FETCH_SUPPLY_CHAIN' })),
    fetchTokens: jest.fn(() => ({ type: 'FETCH_TOKENS' })),
    fetchSupplyChainAnalytics: jest.fn(() => ({ type: 'FETCH_ANALYTICS' })),
    fetchUsers: jest.fn((params) => ({ type: 'FETCH_USERS', payload: params })),
    changeSubscription: jest.fn((params) => {
      const action = { type: 'CHANGE_SUBSCRIPTION', payload: params };
      action.then = jest.fn((callback) => {
        if (callback) callback();
        return Promise.resolve();
      });
      return action;
    }),
    updateUsers: jest.fn((users) => ({ type: 'UPDATE_USERS', payload: users })),
    fetchFeatures: jest.fn(() => ({ type: 'FETCH_FEATURES' })),
    fetchAccountFeatures: jest.fn(() => ({ type: 'FETCH_ACCOUNT_FEATURES' })),
    fetchAccountEnvelopes: jest.fn((aid) => ({ type: 'FETCH_ACCOUNT_ENVELOPES', payload: aid })),
    updateAccountEnvelopes: jest.fn((data) => ({ type: 'UPDATE_ACCOUNT_ENVELOPES', payload: data })),
    fetchLogs: jest.fn(() => ({ type: 'FETCH_LOGS' })),
    // Add submit-quote specific actions
    setSubmitQuoteVars: jest.fn(() => Promise.resolve()),
    fetchBoQByTenderId: jest.fn(() => Promise.resolve()),
    fetchUnits: jest.fn(() => Promise.resolve()),
    fetchProjectStatuses: jest.fn(() => Promise.resolve()),
    fetchBoQQuotes: jest.fn(() => Promise.resolve()),
    quoteItems: jest.fn(() => Promise.resolve()),
    quoteItemsDocs: jest.fn(() => Promise.resolve()),
    publishQuote: jest.fn(() => Promise.resolve()),
    republishQuote: jest.fn(() => Promise.resolve()),
    setEditingQuoteMode: jest.fn(() => Promise.resolve()),
    setSelectedEntries: jest.fn(() => Promise.resolve()),
    // Add prosper-specific actions
    claimToken: jest.fn(() => Promise.resolve()),
    // Add social activation action
    activateTeamAccount: jest.fn(() => ({
      unwrap: jest.fn(() => Promise.resolve({
        data: {
          success: true,
          message: 'Account activated successfully'
        }
      }))
    })),
    // Add prosper interests actions
    fetchInterests: jest.fn(() => ({ type: 'FETCH_INTERESTS' })),
    initFilter: jest.fn(() => ({ type: 'INIT_FILTER' })),
    changeFilter: jest.fn(() => ({ type: 'CHANGE_FILTER' })),
    increaseLoaded: jest.fn(() => ({ type: 'INCREASE_LOADED' })),
    // Add quote creation actions
    createQuote: jest.fn((params) => ({
      type: 'CREATE_QUOTE',
      payload: params,
      then: jest.fn((callback) => {
        if (callback) callback();
        return Promise.resolve();
      })
    })),
    enableProsperProBanner: jest.fn((params) => ({
      type: 'ENABLE_PROSPER_PRO_BANNER',
      payload: params
    })),
  },
  account: {
    activity: [
      { field: 'id', headerName: 'ID', width: 90 },
      { field: 'name', headerName: 'Name', width: 150 },
    ],
    opportunities: [
      { field: 'id', headerName: 'ID', width: 90 },
      { field: 'title', headerName: 'Title', width: 200 },
    ],
    engagement: [
      { field: 'id', headerName: 'ID', width: 90 },
      { field: 'type', headerName: 'Type', width: 120 },
    ],
    engagement_projects: [
      { field: 'id', headerName: 'ID', width: 90 },
      { field: 'project', headerName: 'Project', width: 150 },
    ],
    supply_chain: [
      { field: 'id', headerName: 'ID', width: 90 },
      { field: 'supplier', headerName: 'Supplier', width: 180 },
    ],
  },
  config: {
    typeAccount: 'contractor'
  },
  pages: {
    search: {
      acceptedModels: ['projects', 'users', 'accounts', 'accountsProsper', 'accountsProsperSupplyChain']
    },
    users: {
      actions: [
        {
          id: 1,
          text: 'Change Subscription',
          align: 'left',
          children: true
        }
      ],
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'company', label: 'Company' },
        { key: 'subscription', label: 'Subscription' },
        { key: 'frequency', label: 'Frequency' },
      ],
      actionColumn: {
        config: {
          key: 'actions',
          align: 'center'
        }
      }
    },
    features: {
      actions: [
        { id: 2, text: 'Settings' },
        { id: 10, text: 'Update features' }
      ],
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Feature Name' },
        { key: 'enabled', label: 'Enabled' },
      ],
      actionColumn: {
        config: {
          key: 'actions',
          align: 'center'
        }
      }
    },
    logs: {
      columns: [
        { key: 'id', label: 'ID' },
        { key: 'action_date', label: 'Date' },
        { key: 'action', label: 'Action' },
        { key: 'user_id', label: 'User ID' },
        { key: 'description', label: 'Description' },
        { key: 'ip_address', label: 'IP Address' },
        { key: 'user_agent', label: 'User Agent' }
      ]
    }
  }
};

// Set default return value
mockUseContext.mockReturnValue(defaultContext);

module.exports = {
  useContext: mockUseContext,
  __esModule: true,
  default: {
    useContext: mockUseContext,
  },
};
