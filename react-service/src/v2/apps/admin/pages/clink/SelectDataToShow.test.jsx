import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import SelectDataToShow from './SelectDataToShow';

// Mock the SelectDialog component
jest.mock('v2/apps/shared/components/select', () => {
  return function MockSelectDialog(props) {
    return (
      <div data-testid="select-dialog">
        <div data-testid="dialog-title">{props.title}</div>
        <div data-testid="dialog-options">
          {props.options?.map((option, index) => (
            <div key={index} data-testid="option">{option.label}</div>
          ))}
        </div>
        <div data-testid="dialog-defaults">
          {props.defaultValues?.map((value, index) => (
            <div key={index} data-testid="default-value">{value.label}</div>
          ))}
        </div>
      </div>
    );
  };
});

// Mock the context hook
jest.mock('hooks/context', () => ({
  useContext: () => ({ 
    actions: {
      fetchAccounts: jest.fn(),
      updateAccountFeatures: jest.fn(),
      updateHealthScore: jest.fn()
    }
  })
}));

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => key
}));

const mockStore = configureStore([]);

describe('SelectDataToShow Component', () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    
    const initialState = {
      account: {
        list: [
          { id: 1, name: 'Account 1' },
          { id: 2, name: 'Account 2' }
        ]
      },
      features: {
        status: { message: null },
        list: [
          { id: 1, account: 'Feature 1' },
          { id: 2, account: 'Feature 2' }
        ]
      },
      customerHealthScore: {
        status: { message: null },
        list: [
          { id: 1, account: 'Health 1' },
          { id: 2, account: 'Health 2' }
        ]
      }
    };
    
    store = mockStore(initialState);
  });

  it('renders without crashing', () => {
    render(
      <Provider store={store}>
        <SelectDataToShow model="features" />
      </Provider>
    );
    expect(screen.getByTestId('select-dialog')).toBeInTheDocument();
  });

  it('renders with correct title', () => {
    render(
      <Provider store={store}>
        <SelectDataToShow model="features" />
      </Provider>
    );
    expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
  });

  it('displays options from store', () => {
    render(
      <Provider store={store}>
        <SelectDataToShow model="features" />
      </Provider>
    );
    expect(screen.getByTestId('dialog-options')).toBeInTheDocument();
  });

  it('displays default values', () => {
    render(
      <Provider store={store}>
        <SelectDataToShow model="features" />
      </Provider>
    );
    expect(screen.getByTestId('dialog-defaults')).toBeInTheDocument();
  });

  it('does not render when status has a message', () => {
    const stateWithMessage = {
      account: { list: [] },
      features: {
        status: { message: 'Error occurred' },
        list: []
      },
      customerHealthScore: {
        status: { message: null },
        list: []
      }
    };
    
    const storeWithMessage = mockStore(stateWithMessage);
    
    render(
      <Provider store={storeWithMessage}>
        <SelectDataToShow model="features" />
      </Provider>
    );
    
    expect(screen.queryByTestId('select-dialog')).not.toBeInTheDocument();
  });

  it('handles customerHealthScore model', () => {
    render(
      <Provider store={store}>
        <SelectDataToShow model="customerHealthScore" />
      </Provider>
    );
    expect(screen.getByTestId('select-dialog')).toBeInTheDocument();
  });
});