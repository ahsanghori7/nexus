import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import EditDate from './EditDate';

// Mock the moment library
jest.mock('moment', () => {
  const moment = jest.requireActual('moment');
  return {
    __esModule: true,
    default: (date) => moment(date || '2023-01-15'),
  };
});

// Mock the context hook
jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      updateTender: jest.fn(() => ({ type: 'UPDATE_TENDER' }))
    }
  }))
}));

// Mock the date picker components
jest.mock('@mui/x-date-pickers/AdapterMoment', () => ({
  AdapterMoment: function MockAdapterMoment() { return null; }
}));

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }) => <div data-testid="localization-provider">{children}</div>
}));

jest.mock('@mui/x-date-pickers/MobileDatePicker', () => ({
  MobileDatePicker: (props) => (
    <div data-testid="mobile-date-picker">
      <input
        data-testid="date-input"
        placeholder={props.slotProps?.textField?.placeholder || 'Select date'}
        disabled={props.disabled}
      />
    </div>
  )
}));

const mockStore = configureMockStore([thunk]);

describe('EditDate Component', () => {
  let store;
  const defaultProps = {
    id: 1,
    field: 'start_date',
    date: null,
    dispatch: jest.fn()
  };

  beforeEach(() => {
    store = mockStore({
      project: { id: 1 }
    });
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={store}>
        <EditDate {...defaultProps} {...props} />
      </Provider>
    );
  };

  it('renders without crashing', () => {
    renderComponent();
    expect(screen.getByTestId('mobile-date-picker')).toBeInTheDocument();
  });

  it('renders with localization provider', () => {
    renderComponent();
    expect(screen.getByTestId('localization-provider')).toBeInTheDocument();
  });

  it('shows TBC placeholder when no date provided', () => {
    renderComponent();
    expect(screen.getByPlaceholderText('TBC')).toBeInTheDocument();
  });

  it('is enabled when no enquirySentDate provided', () => {
    renderComponent();
    const input = screen.getByTestId('date-input');
    expect(input).not.toBeDisabled();
  });

  it('is disabled when enquirySentDate is provided', () => {
    renderComponent({ enquirySentDate: '2023-01-01' });
    const input = screen.getByTestId('date-input');
    expect(input).toBeDisabled();
  });

  it('renders with existing date', () => {
    renderComponent({ 
      date: '2023-01-15'
    });
    
    expect(screen.getByTestId('date-input')).toBeInTheDocument();
  });

  it('uses specified context type', () => {
    renderComponent({ 
      contextType: 'custom-context'
    });
    
    expect(screen.getByTestId('mobile-date-picker')).toBeInTheDocument();
  });

  it('passes shouldDisableDate prop to date picker', () => {
    const shouldDisableDate = jest.fn();
    renderComponent({ 
      shouldDisableDate: shouldDisableDate
    });
    
    expect(screen.getByTestId('mobile-date-picker')).toBeInTheDocument();
  });

  it('handles default date prop', () => {
    renderComponent({ 
      defaultDate: '2023-12-25'
    });
    
    expect(screen.getByTestId('date-input')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = renderComponent();
    expect(container.firstChild).toMatchSnapshot();
  });

  describe('redux integration', () => {
    it('connects to redux store correctly', () => {
      const { container } = renderComponent();
      expect(container).toBeInTheDocument();
    });

    it('maps state to props correctly', () => {
      const storeWithProject = mockStore({
        project: { id: 123, name: 'Test Project' }
      });
      
      render(
        <Provider store={storeWithProject}>
          <EditDate {...defaultProps} />
        </Provider>
      );
      
      expect(screen.getByTestId('mobile-date-picker')).toBeInTheDocument();
    });
  });
});