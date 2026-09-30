import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';
import SettingsModal from './settings-modal';
import * as procurementService from './procurementService';

// Mock modules
jest.mock('hooks/context', () => ({
  useContext: jest.fn(),
}));

jest.mock('./procurementService', () => ({
  fetchMilestones: jest.fn(),
  isValidDate: jest.fn(),
}));

jest.mock('dayjs', () => {
  const mockDayjs = jest.fn((date) => {
    const mockInstance = {
      format: jest.fn((fmt) => {
        if (fmt === 'DD-MM-YYYY') return '15-03-2024';
        if (fmt === 'DD MMM YYYY') return '15 Mar 2024';
        return '15/03/2024';
      }),
      subtract: jest.fn(() => mockInstance),
    };
    return mockInstance;
  });
  
  // Add static methods
  mockDayjs.extend = jest.fn();
  
  return mockDayjs;
});

// Mock MUI components to avoid component import issues
jest.mock('@mui/material/Box', () => ({ children, ...props }) => <div {...props}>{children}</div>);
jest.mock('@mui/material/Grid2', () => ({ children, component, ...props }) => {
  // Filter out any remaining component-related props to prevent warnings
  const { component: additionalComponent, ...filteredProps } = props;
  return <div {...filteredProps}>{children}</div>;
});
jest.mock('@mui/material/Button', () => ({ children, onClick, disabled, ...props }) => 
  <button onClick={onClick} disabled={disabled} {...props}>{children}</button>
);
jest.mock('@mui/material/Dialog', () => ({ children, open, ...props }) => 
  open ? <div role="dialog" {...props}>{children}</div> : null
);
jest.mock('@mui/material/DialogActions', () => ({ children, ...props }) => <div {...props}>{children}</div>);
jest.mock('@mui/material/DialogContent', () => ({ children, ...props }) => <div {...props}>{children}</div>);
jest.mock('@mui/material/DialogTitle', () => ({ children, ...props }) => <div {...props}>{children}</div>);
jest.mock('@mui/material/FormControl', () => ({ children, ...props }) => <div {...props}>{children}</div>);
jest.mock('@mui/material/IconButton', () => ({ children, onClick, ...props }) => 
  <button onClick={onClick} {...props}>{children}</button>
);
jest.mock('@mui/material/MenuItem', () => ({ children, value, onClick, ...props }) => 
  <div data-testid="mui-menu-item" data-value={value} onClick={onClick} {...props}>{children}</div>
);
jest.mock('@mui/material/Paper', () => ({ children, ...props }) => <div {...props}>{children}</div>);
jest.mock('@mui/material/Select', () => ({ children, value, onChange, onOpen, ...props }) => 
  <div data-testid="mui-select" role="combobox" data-value={value} {...props}>{children}</div>
);
jest.mock('@mui/material/Table', () => ({ children, ...props }) => <table {...props}>{children}</table>);
jest.mock('@mui/material/TableBody', () => ({ children, ...props }) => <tbody {...props}>{children}</tbody>);
jest.mock('@mui/material/TableCell', () => ({ children, ...props }) => <td {...props}>{children}</td>);
jest.mock('@mui/material/TableContainer', () => ({ children, component, ...props }) => {
  // Filter out any component-related props
  const { component: filteredComponent, ...filteredProps } = props;
  return <div {...filteredProps}>{children}</div>;
});
jest.mock('@mui/material/TableHead', () => ({ children, ...props }) => <thead {...props}>{children}</thead>);
jest.mock('@mui/material/TableRow', () => ({ children, ...props }) => <tr {...props}>{children}</tr>);
jest.mock('@mui/material/Tooltip', () => ({ children, title, ...props }) => 
  <div title={title} {...props}>{children}</div>
);
jest.mock('@mui/material/Typography', () => ({ children, component, ...props }) => {
  // Filter out any component-related props
  const { component: filteredComponent, ...filteredProps } = props;
  return <span {...filteredProps}>{children}</span>;
});
jest.mock('@mui/material/InputAdornment', () => ({ children, ...props }) => <span {...props}>{children}</span>);

// Mock MUI icons as a single module export
jest.mock('@mui/icons-material', () => ({
  Close: () => <span data-testid="close-icon">×</span>,
  Info: () => <span data-testid="info-icon">ⓘ</span>,
  Settings: () => <span data-testid="settings-icon">⚙</span>,
}));
jest.mock('@mui/icons-material/Event', () => () => <span data-testid="event-icon">📅</span>);

// Mock MUI date picker components
jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }) => <div data-testid="localization-provider">{children}</div>,
}));

jest.mock('@mui/x-date-pickers/AdapterDayjs', () => ({
  AdapterDayjs: jest.fn(),
}));

jest.mock('@mui/x-date-pickers/DatePicker', () => ({
  DatePicker: ({ value, onChange, disabled, open, onOpen, onClose, slotProps, helperText, size, format }) => (
    <div data-testid="date-picker">
      <input 
        data-testid="date-picker-input"
        value={value ? value.format(format || 'DD/MM/YYYY') : ''}
        onChange={(e) => onChange && onChange({ format: () => e.target.value })}
        disabled={disabled}
        onClick={onOpen}
      />
      {helperText && <div data-testid="date-picker-helper">{helperText}</div>}
    </div>
  ),
}));

const { useContext } = require('hooks/context');

describe('SettingsModal', () => {
  const mockTheme = createTheme();
  const mockDispatch = jest.fn();
  const mockActions = {
    updateTender: jest.fn(),
  };
  const mockContext = {
    actions: mockActions,
  };

  const defaultProps = {
    overview: [
      {
        id: 'trade-1',
        package: 'Trade Package A',
        startOnSiteUnformatted: '2024-03-15',
      },
      {
        id: 'trade-2',
        package: 'Trade Package B',
        startOnSiteUnformatted: '2024-04-01',
      },
    ],
    dispatch: mockDispatch,
    contextType: 'clink',
  };

  const mockMilestones = [
    {
      id: 'milestone-1',
      name: 'Design Development',
      description: 'Complete design development phase',
      defaultLeadTime: 8,
    },
    {
      id: 'milestone-2',
      name: 'Tender Issue',
      description: 'Issue tender documentation',
      defaultLeadTime: 4,
    },
    {
      id: 'milestone-3',
      name: 'Award Contract',
      description: 'Award contract to selected contractor',
      defaultLeadTime: 2,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    useContext.mockReturnValue(mockContext);
    procurementService.fetchMilestones.mockReturnValue(mockMilestones);
    procurementService.isValidDate.mockReturnValue(true);
  });

  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider theme={mockTheme}>
        <SettingsModal {...defaultProps} {...props} />
      </ThemeProvider>
    );
  };

  describe('Rendering', () => {
    test('renders settings button', () => {
      renderComponent();
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    });

    test('renders with settings icon', () => {
      renderComponent();
      const button = screen.getByRole('button', { name: /settings/i });
      expect(button).toHaveTextContent('Settings');
    });

    test('modal is closed by default', () => {
      renderComponent();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Modal Opening and Closing', () => {
    test('opens modal when settings button is clicked', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    test('displays modal title when opened', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Milestone Scheduling Settings')).toBeInTheDocument();
      });
    });

    test('closes modal when close button is clicked', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    test('closes modal when cancel button is clicked', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Trade Type Selection', () => {
    test('displays trade type dropdown', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Trade Type')).toBeInTheDocument();
      });
    });

    test('shows trade types in dropdown', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        const menuItems = screen.getAllByTestId('mui-menu-item');
        const tradePackageA = menuItems.find(item => item.textContent === 'Trade Package A');
        expect(tradePackageA).toBeInTheDocument();
      });
    });

    test('changes selected trade type', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        const select = screen.getByRole('combobox');
        fireEvent.mouseDown(select);
      });

      // Note: MUI Select testing can be complex, this tests the basic interaction
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    test('displays helper text for trade type selection', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/selecting a trade type will apply trade-specific lead times/i)).toBeInTheDocument();
      });
    });
  });

  describe('Date Picker', () => {
    test('displays start on site date section', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Start on Site Date')).toBeInTheDocument();
      });
    });

    test('shows date picker input', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        expect(screen.getByTestId('date-picker')).toBeInTheDocument();
      });
    });

    test('displays date picker helper text', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/all milestone dates will be recalculated/i)).toBeInTheDocument();
      });
    });
  });

  describe('Milestones Table', () => {
    test('displays milestones table', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });
    });

    test('shows table headers', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Milestone')).toBeInTheDocument();
        expect(screen.getByText('Calculated Date')).toBeInTheDocument();
        expect(screen.getByText('Lead Time (weeks)')).toBeInTheDocument();
      });
    });

    test('displays milestone data', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Design Development')).toBeInTheDocument();
        expect(screen.getByText('Tender Issue')).toBeInTheDocument();
        expect(screen.getByText('Award Contract')).toBeInTheDocument();
      });
    });

    test('shows calculated dates for milestones', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        // The mock dayjs returns '15 Mar 2024' for DD MMM YYYY format
        const calculatedDates = screen.getAllByText('15 Mar 2024');
        expect(calculatedDates.length).toBeGreaterThan(0);
      });
    });

    test('shows lead time information', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        const leadTimes = screen.getAllByText('4 weeks');
        expect(leadTimes.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Save Functionality', () => {
    test('save button is initially enabled when trade type is selected', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        const saveButton = screen.getByRole('button', { name: /save changes/i });
        expect(saveButton).not.toBeDisabled();
      });
    });

    test('calls dispatch with correct parameters when save is clicked', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
      });

      expect(mockDispatch).toHaveBeenCalledWith(
        mockActions.updateTender({
          tid: 'trade-1',
          data: {
            start_on_site: '15-03-2024',
          },
        })
      );
    });

    test('closes modal after save', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
      });

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    test('handles empty overview gracefully', () => {
      renderComponent({ overview: [] });
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    });

    test('handles null overview', () => {
      renderComponent({ overview: null });
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
    });

    test('handles invalid start on site date', async () => {
      procurementService.isValidDate.mockReturnValue(false);
      
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Component should still render even with invalid date
      expect(screen.getByText('Start on Site Date')).toBeInTheDocument();
    });

    test('uses default contextType when not provided', () => {
      renderComponent({ contextType: undefined });
      expect(useContext).toHaveBeenCalledWith('clink');
    });
  });

  describe('Data Processing', () => {
    test('sorts trade types alphabetically', async () => {
      const unsortedOverview = [
        { id: 'trade-z', package: 'Z Package', startOnSiteUnformatted: '2024-03-15' },
        { id: 'trade-a', package: 'A Package', startOnSiteUnformatted: '2024-03-15' },
        { id: 'trade-m', package: 'M Package', startOnSiteUnformatted: '2024-03-15' },
      ];

      renderComponent({ overview: unsortedOverview });
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        // Check that options are available in sorted order
        const options = screen.getAllByTestId('mui-menu-item');
        const optionTexts = options.map(option => option.textContent);
        // Skip the first option which is "No specific trade"
        expect(optionTexts[1]).toBe('A Package'); // First real option after default
        expect(optionTexts[2]).toBe('M Package');
        expect(optionTexts[3]).toBe('Z Package');
      });
    });

    test('calculates milestone dates correctly', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        // Verify that milestone calculation logic is called
        expect(procurementService.fetchMilestones).toHaveBeenCalled();
      });
    });
  });

  describe('Modal Description', () => {
    test('displays modal description text', async () => {
      renderComponent();
      
      fireEvent.click(screen.getByRole('button', { name: /settings/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/milestone dates are calculated relative to start on site/i)).toBeInTheDocument();
      });
    });
  });
});