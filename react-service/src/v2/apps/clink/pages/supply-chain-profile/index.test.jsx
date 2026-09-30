import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import SupplyChain from './index';

// Mock the container component
jest.mock('./container', () => {
  return function MockSupplyChainContainer(props) {
    return (
      <div data-testid="supply-chain-container">
        <div data-testid="aid">{props.aid}</div>
        <div data-testid="id">{props.id}</div>
        <div data-testid="context-type">{props.contextType}</div>
      </div>
    );
  };
});

// Mock the context hook
jest.mock('v2/hooks/context', () => ({
  useContext: jest.fn(),
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

const mockStore = configureStore([thunk]);

describe('SupplyChain', () => {
  let store;
  let mockUseParams;
  let mockUseContext;

  beforeEach(() => {
    store = mockStore({
      company: { id: 1, name: 'Test Company' },
      prequalificationV2: { 
        documents: { doc1: 'test' },
        sections: []
      },
      subcontractor: { accountId: 'test-account-id' },
    });

    mockUseParams = require('react-router-dom').useParams;
    mockUseContext = require('v2/hooks/context').useContext;

    mockUseParams.mockReturnValue({ id: 'test-id' });
    mockUseContext.mockReturnValue({
      actions: {
        getPrequalification_V2: jest.fn(() => ({ type: 'MOCK_ACTION' })),
        getCompanyProfile: jest.fn(() => ({ type: 'MOCK_ACTION' })),
        getPrequalificationSections: jest.fn(() => ({ type: 'MOCK_ACTION' })),
        fetchPrequalification_V2: jest.fn(() => ({ type: 'MOCK_ACTION' })),
        fetchCompany: jest.fn(() => ({ type: 'MOCK_ACTION' })),
        fetchPrequalificationSections: jest.fn(() => ({ type: 'MOCK_ACTION' })),
      },
    });

    store.dispatch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      contextType: 'clink',
      ...props,
    };

    return render(
      <Provider store={store}>
        <BrowserRouter>
          <SupplyChain {...defaultProps} />
        </BrowserRouter>
      </Provider>
    );
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByTestId('supply-chain-container')).toBeInTheDocument();
  });

  it('renders with correct props passed to container', () => {
    renderComponent();
    
    expect(screen.getByTestId('aid')).toHaveTextContent('test-id');
    expect(screen.getByTestId('id')).toHaveTextContent('test-id');
    expect(screen.getByTestId('context-type')).toHaveTextContent('clink');
  });

  it('renders with prosper context type', () => {
    renderComponent({ contextType: 'prosper' });
    
    expect(screen.getByTestId('context-type')).toHaveTextContent('prosper');
  });

  it('handles empty documents in prequalificationV2', () => {
    store = mockStore({
      company: { id: 1, name: 'Test Company' },
      prequalificationV2: { 
        documents: {},
        sections: []
      },
      subcontractor: { accountId: 'test-account-id' },
    });

    renderComponent();
    expect(screen.getByTestId('supply-chain-container')).toBeInTheDocument();
  });

  it('uses subcontractor accountId when no id param', () => {
    mockUseParams.mockReturnValue({ id: undefined });
    
    renderComponent();
    expect(screen.getByTestId('supply-chain-container')).toBeInTheDocument();
  });
});