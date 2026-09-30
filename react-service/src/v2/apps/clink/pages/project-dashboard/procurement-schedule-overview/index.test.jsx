import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import ProcurementScheduleOverview from './index';

// Mock MUI icons
jest.mock('@mui/icons-material', () => ({
  Close: () => <span data-testid="close-icon">×</span>,
  Info: () => <span data-testid="info-icon">ⓘ</span>,
  Settings: () => <span data-testid="settings-icon">⚙</span>,
}));

jest.mock('@mui/icons-material/FileDownloadOutlined', () => () => <span data-testid="download-icon" />);

// Mock MUI material components
jest.mock('@mui/material', () => ({
  Container: ({ children, ...props }) => (
    <div data-testid="container" className="MuiContainer-root" {...props}>
      {children}
    </div>
  ),
  Paper: ({ children, ...props }) => (
    <div data-testid="paper" className="MuiPaper-root" {...props}>
      {children}
    </div>
  ),
  Stack: ({ children, ...props }) => (
    <div data-testid="stack" className="MuiStack-root" {...props}>
      {children}
    </div>
  ),
  Box: ({ children, ...props }) => (
    <div data-testid="box" className="MuiBox-root" {...props}>
      {children}
    </div>
  ),
  Button: ({ children, onClick, disabled, ...props }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
  Typography: ({ children, ...props }) => <span {...props}>{children}</span>,
}));

// Mock MUI DatePicker components
jest.mock('@mui/x-date-pickers', () => ({
  DatePicker: ({ value, onChange, ...props }) => (
    <input
      data-testid="date-picker"
      type="date"
      value={value ? value.format('YYYY-MM-DD') : ''}
      onChange={(e) => onChange && onChange(e.target.value)}
      {...props}
    />
  ),
  LocalizationProvider: ({ children }) => (
    <div data-testid="localization-provider">{children}</div>
  ),
}));

// Mock MUI DateAdapter
jest.mock('@mui/x-date-pickers/AdapterDayjs', () => ({
  AdapterDayjs: jest.fn(),
}));

// Mock the child components
jest.mock('./ProcurementScheduleHeader', () => {
  const MockedComponent = ({
    totalPackages,
    procurementProgress,
    packagesAtRiskCount,
    summary,
  }) => (
    <div
      data-testid="procurement-schedule-header"
      data-total-packages={totalPackages}
      data-procurement-progress={
        typeof procurementProgress === 'object'
          ? JSON.stringify(procurementProgress)
          : procurementProgress
      }
      data-packages-at-risk={packagesAtRiskCount}
      data-summary={summary ? JSON.stringify(summary) : 'null'}
    >
      <span data-testid="total-packages">{totalPackages}</span>
      <span data-testid="procurement-progress">
        {typeof procurementProgress === 'object'
          ? JSON.stringify(procurementProgress)
          : procurementProgress}
      </span>
      <span data-testid="packages-at-risk">{packagesAtRiskCount}</span>
      <span data-testid="summary">
        {summary ? JSON.stringify(summary) : 'null'}
      </span>
    </div>
  );
  MockedComponent.displayName = 'MockedProcurementScheduleHeader';
  return MockedComponent;
});

jest.mock('./ProcurementScheduleFilters', () => {
  const MockedComponent = ({
    searchTerm,
    milestoneStatus,
    tenderStatus,
    variance,
    packagesAtRisk,
  }) => (
    <div
      data-testid="procurement-schedule-filters"
      data-search-term={searchTerm || ''}
      data-milestone-status={milestoneStatus || 'All'}
      data-tender-status={tenderStatus || 'All'}
      data-variance={variance || 'All'}
      data-packages-at-risk={packagesAtRisk || 'All'}
    >
      Mock Filters
    </div>
  );
  MockedComponent.displayName = 'MockedProcurementScheduleFilters';
  return MockedComponent;
});

jest.mock('./ProcurementScheduleTable', () => {
  const MockedComponent = ({ rowData }) => (
    <div data-testid="procurement-schedule-table">
      <span data-testid="row-count">{rowData ? rowData.length : 0}</span>
    </div>
  );
  MockedComponent.displayName = 'MockedProcurementScheduleTable';
  return MockedComponent;
});

jest.mock('./ProcurementScheduleTableV2', () => {
  const MockedComponent = ({ rowData }) => (
    <div data-testid="procurement-schedule-table">
      <span data-testid="row-count">{rowData ? rowData.length : 0}</span>
    </div>
  );
  MockedComponent.displayName = 'MockedProcurementScheduleTableV2';
  return MockedComponent;
});

jest.mock('./settings-modal', () => {
  const MockedComponent = () => (
    <div data-testid="settings-modal">Mock Settings Modal</div>
  );
  MockedComponent.displayName = 'MockedSettingsModal';
  return MockedComponent;
});

// Mock connect as a pass-through so dispatch/project can be injected via props directly
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  connect: () => (Component) => Component,
}));

// Mock hooks used by the component
const mockShowSnackbar = jest.fn();
const mockExportAction = jest.fn();

jest.mock('v2/hooks/useSnackbar', () => ({
  useSnackbar: () => ({ showSnackbar: mockShowSnackbar }),
}));

jest.mock('v2/hooks/context', () => ({
  useContext: () => ({ actions: { exportProcurementSchedule: mockExportAction } }),
}));

// Mock the procurement service functions
jest.mock('./procurementService', () => ({
  generateRows: jest.fn((data) => data || []),
  calculateProcurementProgress: jest.fn(() => 75), // Return just a number to avoid object rendering issues
  countPackagesAtRisk: jest.fn(() => 2),
}));

// Create a test store
const createTestStore = () => {
  return configureStore({
    reducer: {
      root: (state = {}) => state,
    },
  });
};

const theme = createTheme();

const renderWithProviders = (component, store = createTestStore()) => {
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </Provider>,
  );
};

describe('ProcurementScheduleOverview', () => {
  const defaultProps = {
    overview: [
      {
        id: 1,
        name: 'Test Package 1',
        status: 'In Progress',
        issue_order: '2024-01-15',
        start_on_site: '2024-02-01',
      },
      {
        id: 2,
        name: 'Test Package 2',
        status: 'Complete',
        issue_order: '2024-01-10',
        start_on_site: '2024-01-25',
      },
    ],
    summary: {
      budget: 100000,
      profit_loss: 5000,
      forecast: 95000,
    },
    project: {
      data: {
        id: 'test-project-123',
        name: 'Test Project Name',
        version: 1,
      },
    },
    dispatch: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProviders(<ProcurementScheduleOverview {...defaultProps} />);
    expect(
      screen.getByTestId('procurement-schedule-header'),
    ).toBeInTheDocument();
  });

  it('renders all major components', () => {
    renderWithProviders(<ProcurementScheduleOverview {...defaultProps} />);

    expect(
      screen.getByTestId('procurement-schedule-header'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('procurement-schedule-filters'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('procurement-schedule-table'),
    ).toBeInTheDocument();
    expect(screen.getByTestId('settings-modal')).toBeInTheDocument();
  });

  it('handles empty overview data', () => {
    const props = {
      ...defaultProps,
      overview: [],
    };

    renderWithProviders(<ProcurementScheduleOverview {...props} />);
    expect(
      screen.getByTestId('procurement-schedule-header'),
    ).toBeInTheDocument();
  });

  it('handles undefined overview data', () => {
    const props = {
      ...defaultProps,
      overview: undefined,
    };

    renderWithProviders(<ProcurementScheduleOverview {...props} />);
    expect(
      screen.getByTestId('procurement-schedule-header'),
    ).toBeInTheDocument();
  });

  it('handles null summary data', () => {
    const props = {
      ...defaultProps,
      summary: null,
    };

    renderWithProviders(<ProcurementScheduleOverview {...props} />);
    expect(
      screen.getByTestId('procurement-schedule-header'),
    ).toBeInTheDocument();
  });

  it('renders container with correct styling', () => {
    const { container } = renderWithProviders(
      <ProcurementScheduleOverview {...defaultProps} />,
    );
    const containerElement = container.querySelector('.MuiContainer-root');
    expect(containerElement).toBeInTheDocument();
  });

  it('renders paper wrapper for table', () => {
    const { container } = renderWithProviders(
      <ProcurementScheduleOverview {...defaultProps} />,
    );
    const paperElement = container.querySelector('.MuiPaper-root');
    expect(paperElement).toBeInTheDocument();
  });

  it('passes correct props to ProcurementScheduleHeader', () => {
    renderWithProviders(<ProcurementScheduleOverview {...defaultProps} />);

    const headerElement = screen.getByTestId('procurement-schedule-header');
    expect(headerElement).toHaveAttribute('data-total-packages', '2');
    expect(headerElement).toHaveAttribute('data-packages-at-risk', '2');
  });

  it('passes rowData to ProcurementScheduleTable', () => {
    renderWithProviders(<ProcurementScheduleOverview {...defaultProps} />);

    const tableElement = screen.getByTestId('procurement-schedule-table');
    expect(tableElement).toBeInTheDocument();
    // The exact rowData is passed through the mocked component
  });

  it('initializes with default filter values', () => {
    renderWithProviders(<ProcurementScheduleOverview {...defaultProps} />);

    const filtersElement = screen.getByTestId('procurement-schedule-filters');
    expect(filtersElement).toHaveAttribute('data-search-term', '');
    expect(filtersElement).toHaveAttribute('data-milestone-status', 'All');
    expect(filtersElement).toHaveAttribute('data-tender-status', 'All');
    expect(filtersElement).toHaveAttribute('data-variance', 'All');
    expect(filtersElement).toHaveAttribute('data-packages-at-risk', 'All');
  });

  it('renders Stack component for filters layout', () => {
    const { container } = renderWithProviders(
      <ProcurementScheduleOverview {...defaultProps} />,
    );
    const stackElements = container.querySelectorAll('.MuiStack-root');
    expect(stackElements.length).toBeGreaterThan(0);
  });

  it('renders Box component for spacing', () => {
    const { container } = renderWithProviders(
      <ProcurementScheduleOverview {...defaultProps} />,
    );
    const boxElements = container.querySelectorAll('.MuiBox-root');
    expect(boxElements.length).toBeGreaterThan(0);
  });

  describe('handleExport', () => {
    const mockBlob = new Blob(['test'], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const mockObjectUrl = 'blob:mock-url';

    beforeEach(() => {
      mockShowSnackbar.mockClear();
      mockExportAction.mockClear();
      global.URL.createObjectURL = jest.fn(() => mockObjectUrl);
      global.URL.revokeObjectURL = jest.fn();
    });

    it('triggers download on successful export', async () => {
      const mockDispatch = jest.fn().mockReturnValue({
        unwrap: jest.fn().mockResolvedValue({ blob: mockBlob, filename: 'export.xlsx' }),
      });
      const props = {
        ...defaultProps,
        project: { data: { id: 'test-project-123', version: 2 } },
        dispatch: mockDispatch,
      };

      renderWithProviders(<ProcurementScheduleOverview {...props} />);

      fireEvent.click(screen.getByRole('button', { name: /export to excel/i }));

      await waitFor(() => {
        expect(global.URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      });
      expect(global.URL.revokeObjectURL).toHaveBeenCalledWith(mockObjectUrl);
    });

    it('shows error snackbar when export fails', async () => {
      const mockDispatch = jest.fn().mockReturnValue({
        unwrap: jest.fn().mockRejectedValue(new Error('Export failed')),
      });
      const props = {
        ...defaultProps,
        project: { data: { id: 'test-project-123', version: 2 } },
        dispatch: mockDispatch,
      };

      renderWithProviders(<ProcurementScheduleOverview {...props} />);

      fireEvent.click(screen.getByRole('button', { name: /export to excel/i }));

      await waitFor(() => {
        expect(mockShowSnackbar).toHaveBeenCalledWith('Export failed', 'error');
      });
    });

    it('shows error snackbar when project id is missing', async () => {
      const props = {
        ...defaultProps,
        project: { data: { version: 2 } },
        dispatch: jest.fn(),
      };

      renderWithProviders(<ProcurementScheduleOverview {...props} />);

      fireEvent.click(screen.getByRole('button', { name: /export to excel/i }));

      await waitFor(() => {
        expect(mockShowSnackbar).toHaveBeenCalledWith('Project ID is required for export', 'error');
      });
      expect(global.URL.createObjectURL).not.toHaveBeenCalled();
    });

    it('disables export button while exporting', () => {
      const props = {
        ...defaultProps,
        project: { data: { id: 'test-project-123', version: 2 } },
        isExporting: true,
      };

      renderWithProviders(<ProcurementScheduleOverview {...props} />);

      expect(screen.getByRole('button', { name: /export to excel/i })).toBeDisabled();
    });
  });
});
