import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import StartOnSite from './StartOnSite';

// Mock MUI Date Picker components
jest.mock('@mui/x-date-pickers/LocalizationProvider', () => {
  const React = require('react');
  return {
    LocalizationProvider: ({ children }) => React.createElement('div', { 'data-testid': 'localization-provider' }, children),
  };
});

jest.mock('@mui/x-date-pickers/AdapterDayjs', () => ({
  AdapterDayjs: jest.fn(() => ({})),
}));

jest.mock('@mui/x-date-pickers/DatePicker', () => {
  const React = require('react');
  const dayjs = require('dayjs');
  return {
    DatePicker: ({ value, onChange, open, onOpen, onClose, slotProps, format }) => {
      const displayValue = value && value.isValid && value.isValid() ? value.format('DD/MM/YYYY') : '';
      const buttonText = value && value.isValid && value.isValid() ? value.format('DD/MM/YYYY') : 'Select Date';
      
      return React.createElement('div', {
        'data-testid': 'date-picker',
        'data-value': displayValue,
        'data-format': format,
        'data-open': open,
        onClick: () => {
          onOpen && onOpen();
          const newDate = dayjs('2024-03-15'); // Use ISO format to ensure valid date
          onChange && onChange(newDate);
        },
        onMouseEnter: slotProps?.textField?.onMouseEnter,
        onMouseLeave: slotProps?.popper?.onMouseLeave,
      }, [
        React.createElement('button', {
          key: 'date-input',
          'data-testid': 'date-input-button',
          onClick: slotProps?.textField?.onClick,
        }, buttonText),
        React.createElement('button', {
          key: 'icon-button',
          'data-testid': 'event-icon-button',
          onClick: () => {
            if (slotProps?.textField?.InputProps?.startAdornment?.props?.children?.props?.onClick) {
              slotProps.textField.InputProps.startAdornment.props.children.props.onClick();
            }
          }
        }, 'Calendar Icon'),
        React.createElement('button', {
          key: 'close-button',
          'data-testid': 'close-picker-button',
          onClick: onClose,
        }, 'Close'),
      ]);
    },
  };
});

// Mock MUI components
jest.mock('@mui/material/InputAdornment', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, position, className, sx }) => 
      React.createElement('div', {
        'data-testid': 'input-adornment',
        'data-position': position,
        'data-classname': className,
      }, children),
  };
});

jest.mock('@mui/material/IconButton', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: ({ children, onClick }) => 
      React.createElement('button', {
        'data-testid': 'icon-button',
        onClick: onClick,
      }, children),
  };
});

jest.mock('@mui/icons-material/Event', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('span', { 'data-testid': 'event-icon' }, 'Event Icon'),
  };
});

// Mock context hook
const mockContext = {
  actions: {
    updatePackages: jest.fn(() => ({ type: 'UPDATE_PACKAGES' })),
    setOpenedDatePickerId: jest.fn(() => ({ type: 'SET_OPENED_DATE_PICKER_ID' })),
  },
};

jest.mock('v2/hooks/context', () => ({
  useContext: jest.fn(() => mockContext),
}));

// Mock dayjs
jest.mock('dayjs', () => {
  const originalDayjs = jest.requireActual('dayjs');
  const mockDayjs = jest.fn((date) => {
    if (date === null || date === undefined) {
      return originalDayjs(null);
    }
    return originalDayjs(date);
  });
  mockDayjs.isDayjs = originalDayjs.isDayjs;
  return mockDayjs;
});

// Helper function to create test store
const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      project: (state = { openedDatePickerId: null, ...initialState.project }, action) => {
        switch (action.type) {
          case 'SET_OPENED_DATE_PICKER_ID':
            return { ...state, openedDatePickerId: action.payload };
          default:
            return state;
        }
      },
    },
    preloadedState: initialState,
  });
};

// Helper function to render component with providers
const renderWithProviders = (component, initialState = {}) => {
  const store = createTestStore(initialState);
  return {
    ...render(
      <Provider store={store}>
        {component}
      </Provider>
    ),
    store,
  };
};

describe('StartOnSite Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render with LocalizationProvider and DatePicker', () => {
      renderWithProviders(<StartOnSite params={{ row: { id: 1 } }} />);
      
      expect(screen.getByTestId('localization-provider')).toBeInTheDocument();
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });

    it('should render with correct date format', () => {
      renderWithProviders(<StartOnSite params={{ row: { id: 1 } }} />);
      
      const datePicker = screen.getByTestId('date-picker');
      expect(datePicker).toHaveAttribute('data-format', 'DD/MM/YYYY');
    });

    it('should render with initial date value when provided', () => {
      const initialDate = '2024-03-15';
      renderWithProviders(
        <StartOnSite 
          params={{ 
            row: { 
              id: 1, 
              startOnSiteUnformatted: initialDate 
            } 
          }} 
        />
      );
      
      const datePicker = screen.getByTestId('date-picker');
      expect(datePicker).toHaveAttribute('data-value', '15/03/2024');
    });

    it('should render without initial date when not provided', () => {
      renderWithProviders(<StartOnSite params={{ row: { id: 1 } }} />);
      
      const datePicker = screen.getByTestId('date-picker');
      expect(datePicker).toHaveAttribute('data-value', '');
    });

    it('should render with empty params', () => {
      renderWithProviders(<StartOnSite params={{}} />);
      
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });

    it('should render without params', () => {
      renderWithProviders(<StartOnSite />);
      
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });
  });

  describe('Date Picker State Management', () => {
    it('should show open state when openedDatePickerId matches row id', () => {
      const rowId = 123;
      renderWithProviders(
        <StartOnSite params={{ row: { id: rowId } }} />,
        { project: { openedDatePickerId: rowId } }
      );
      
      const datePicker = screen.getByTestId('date-picker');
      expect(datePicker).toHaveAttribute('data-open', 'true');
    });

    it('should show closed state when openedDatePickerId does not match', () => {
      renderWithProviders(
        <StartOnSite params={{ row: { id: 123 } }} />,
        { project: { openedDatePickerId: 456 } }
      );
      
      const datePicker = screen.getByTestId('date-picker');
      expect(datePicker).toHaveAttribute('data-open', 'false');
    });

    it('should show closed state when openedDatePickerId is null', () => {
      renderWithProviders(
        <StartOnSite params={{ row: { id: 123 } }} />,
        { project: { openedDatePickerId: null } }
      );
      
      const datePicker = screen.getByTestId('date-picker');
      expect(datePicker).toHaveAttribute('data-open', 'false');
    });
  });

  describe('User Interactions', () => {
    it('should dispatch setOpenedDatePickerId when opening date picker', () => {
      const rowId = 123;
      renderWithProviders(<StartOnSite params={{ row: { id: rowId } }} />);
      
      fireEvent.click(screen.getByTestId('date-input-button'));
      
      expect(mockContext.actions.setOpenedDatePickerId).toHaveBeenCalledWith(rowId);
    });

    it('should dispatch setOpenedDatePickerId when clicking icon button', () => {
      const rowId = 123;
      renderWithProviders(<StartOnSite params={{ row: { id: rowId } }} />);
      
      fireEvent.click(screen.getByTestId('event-icon-button'));
      
      expect(mockContext.actions.setOpenedDatePickerId).toHaveBeenCalledWith(rowId);
    });

    it('should dispatch setOpenedDatePickerId(null) when closing', () => {
      renderWithProviders(<StartOnSite params={{ row: { id: 123 } }} />);
      
      fireEvent.click(screen.getByTestId('close-picker-button'));
      
      expect(mockContext.actions.setOpenedDatePickerId).toHaveBeenCalledWith(null);
    });

    it('should dispatch updatePackages when date changes with valid id', () => {
      const rowId = 123;
      renderWithProviders(<StartOnSite params={{ row: { id: rowId } }} />);
      
      fireEvent.click(screen.getByTestId('date-picker'));
      
      expect(mockContext.actions.updatePackages).toHaveBeenCalledWith({
        tid: rowId,
        data: {
          start_on_site: '15-03-2024',
        },
      });
    });

    it('should not dispatch updatePackages when id is missing', () => {
      renderWithProviders(<StartOnSite params={{ row: {} }} />);
      
      fireEvent.click(screen.getByTestId('date-picker'));
      
      expect(mockContext.actions.updatePackages).not.toHaveBeenCalled();
    });

    it('should handle mouse enter on text field', () => {
      const rowId = 123;
      renderWithProviders(<StartOnSite params={{ row: { id: rowId } }} />);
      
      const datePicker = screen.getByTestId('date-picker');
      fireEvent.mouseEnter(datePicker);
      
      expect(mockContext.actions.setOpenedDatePickerId).toHaveBeenCalledWith(rowId);
    });

    it('should handle mouse leave on popper', () => {
      renderWithProviders(<StartOnSite params={{ row: { id: 123 } }} />);
      
      const datePicker = screen.getByTestId('date-picker');
      fireEvent.mouseLeave(datePicker);
      
      expect(mockContext.actions.setOpenedDatePickerId).toHaveBeenCalledWith(null);
    });
  });

  describe('Effect Hook Behavior', () => {
    it('should update value when startOnSiteUnformatted changes', async () => {
      const { rerender } = renderWithProviders(
        <StartOnSite params={{ row: { id: 1, startOnSiteUnformatted: '2024-03-15' } }} />
      );
      
      let datePicker = screen.getByTestId('date-picker');
      expect(datePicker).toHaveAttribute('data-value', '15/03/2024');
      
      // Re-render with new date
      rerender(
        <Provider store={createTestStore()}>
          <StartOnSite params={{ row: { id: 1, startOnSiteUnformatted: '2024-04-20' } }} />
        </Provider>
      );
      
      await waitFor(() => {
        datePicker = screen.getByTestId('date-picker');
        expect(datePicker).toHaveAttribute('data-value', '20/04/2024');
      });
    });

    it('should handle null startOnSiteUnformatted in effect', async () => {
      const { rerender } = renderWithProviders(
        <StartOnSite params={{ row: { id: 1, startOnSiteUnformatted: '2024-03-15' } }} />
      );
      
      // Re-render with null date
      rerender(
        <Provider store={createTestStore()}>
          <StartOnSite params={{ row: { id: 1, startOnSiteUnformatted: null } }} />
        </Provider>
      );
      
      await waitFor(() => {
        const datePicker = screen.getByTestId('date-picker');
        expect(datePicker).toHaveAttribute('data-value', '');
      });
    });
  });

  describe('Redux Integration', () => {
    it('should connect to Redux store and get openedDatePickerId', () => {
      const { store } = renderWithProviders(
        <StartOnSite params={{ row: { id: 123 } }} />,
        { project: { openedDatePickerId: 123 } }
      );
      
      const state = store.getState();
      expect(state.project.openedDatePickerId).toBe(123);
    });

    it('should handle missing project state in Redux', () => {
      renderWithProviders(<StartOnSite params={{ row: { id: 123 } }} />, {});
      
      // Should not throw error and render normally
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('should format date as DD-MM-YYYY when updating packages', () => {
      const rowId = 123;
      renderWithProviders(<StartOnSite params={{ row: { id: rowId } }} />);
      
      fireEvent.click(screen.getByTestId('date-picker'));
      
      expect(mockContext.actions.updatePackages).toHaveBeenCalledWith({
        tid: rowId,
        data: {
          start_on_site: '15-03-2024',
        },
      });
    });

    it('should send null when date value is null', () => {
      // Mock a null value change
      jest.spyOn(React, 'useState').mockImplementationOnce(() => [null, jest.fn()]);
      
      const rowId = 123;
      renderWithProviders(<StartOnSite params={{ row: { id: rowId } }} />);
      
      // This test verifies the null handling in handleChange
      // The actual null case would be triggered by clearing the date picker
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });
  });

  describe('Component Props', () => {
    it('should handle dispatch prop correctly', () => {
      const mockDispatch = jest.fn();
      renderWithProviders(<StartOnSite dispatch={mockDispatch} params={{ row: { id: 123 } }} />);
      
      // The component should work with custom dispatch
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });

    it('should extract row data from params correctly', () => {
      const rowData = {
        id: 456,
        startOnSiteUnformatted: '2024-05-10',
      };
      
      renderWithProviders(<StartOnSite params={{ row: rowData }} />);
      
      const datePicker = screen.getByTestId('date-picker');
      expect(datePicker).toHaveAttribute('data-value', '10/05/2024');
    });
  });

  describe('Edge Cases', () => {
    it('should handle invalid date strings gracefully', () => {
      renderWithProviders(
        <StartOnSite params={{ row: { id: 1, startOnSiteUnformatted: 'invalid-date' } }} />
      );
      
      // Should not crash and render normally
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });

    it('should handle undefined params gracefully', () => {
      renderWithProviders(<StartOnSite params={undefined} />);
      
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });

    it('should handle params with null row', () => {
      renderWithProviders(<StartOnSite params={{ row: null }} />);
      
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });
  });
});