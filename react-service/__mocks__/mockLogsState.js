// Mock for logs state used in admin Logs component
const mockLogsState = {
  list: [
    {
      id: 1,
      action_date: '2024-10-30T10:00:00Z',
      action: 'User Login',
      user_id: 123,
      description: 'User logged into system',
      ip_address: '192.168.1.1',
      user_agent: 'Mozilla/5.0 Chrome/129.0'
    },
    {
      id: 2,
      action_date: '2024-10-30T11:30:00Z',
      action: 'Data Export',
      user_id: 456,
      description: 'Exported user data',
      ip_address: '192.168.1.2',
      user_agent: 'Mozilla/5.0 Firefox/128.0'
    },
    {
      id: 3,
      action_date: '2024-10-30T12:15:00Z',
      action: 'Settings Update',
      user_id: 789,
      description: 'Updated account settings',
      ip_address: '192.168.1.3',
      user_agent: 'Mozilla/5.0 Safari/17.0'
    }
  ],
  listCount: 3
};

const mockLogsActions = {
  fetchLogs: jest.fn(() => ({ type: 'FETCH_LOGS' }))
};

const mockLogsColumns = [
  { key: 'id', label: 'ID' },
  { key: 'action_date', label: 'Date' },
  { key: 'action', label: 'Action' },
  { key: 'user_id', label: 'User ID' },
  { key: 'description', label: 'Description' },
  { key: 'ip_address', label: 'IP Address' },
  { key: 'user_agent', label: 'User Agent' }
];

module.exports = {
  mockLogsState,
  mockLogsActions,
  mockLogsColumns,
  __esModule: true,
  default: {
    mockLogsState,
    mockLogsActions,
    mockLogsColumns
  }
};
