// Mock for store/configureStore
const mockStore = {
  getState: jest.fn(() => ({
    subcontractor: {
      id: 'test-subcontractor-id',
      accountId: 'test-account-id'
    },
    opportunityViewer: {
      opportunity: {
        opportunities: 5
      }
    },
    attributes: {
      regions: [
        { id: 1, name: 'London' },
        { id: 2, name: 'Manchester' }
      ],
      trades: [
        { id: 1, name: 'Electrical' },
        { id: 2, name: 'Plumbing' }
      ],
      loading1: false,
      loading2: false
    }
  })),
  dispatch: jest.fn(),
  subscribe: jest.fn(),
  replaceReducer: jest.fn()
};

const configureStore = jest.fn(() => mockStore);

export default configureStore;
export { mockStore };
