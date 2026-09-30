import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import thunk from 'redux-thunk';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';
import Packages from './Packages';

// Mock the child components
jest.mock('./Header', () => {
  return function MockHeader({ tender, expanded, handleChange, ...props }) {
    const isExpanded = expanded.includes(tender.id);
    return (
      <div 
        data-testid="header" 
        onClick={() => handleChange(tender.id)}
        style={{ cursor: 'pointer' }}
      >
        {`Header for tender ${tender.id} - ${isExpanded ? 'expanded' : 'collapsed'}`}
      </div>
    );
  };
});

jest.mock('./EditDate', () => {
  return function MockEditDate({ date, id, field, ...props }) {
    return (
      <div data-testid={`edit-date-${field}`}>
        EditDate - ID: {id}, Field: {field}, Date: {date}
      </div>
    );
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock MUI components
jest.mock('@mui/material/Box', () => {
  return function MockBox({ children, ...props }) {
    return <div data-testid="box" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/List', () => {
  return function MockList({ children, ...props }) {
    return <div data-testid="list" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/ListItem', () => {
  return function MockListItem({ children, ...props }) {
    return <div data-testid="list-item" {...props}>{children}</div>;
  };
});

jest.mock('@mui/material/Collapse', () => {
  return function MockCollapse({ in: inProp, children, ...props }) {
    return inProp ? <div data-testid="collapse" {...props}>{children}</div> : null;
  };
});

jest.mock('@mui/material/Typography', () => {
  return function MockTypography({ children, variant, color, ...props }) {
    return (
      <span data-testid="typography" data-variant={variant} {...props}>
        {children}
      </span>
    );
  };
});

jest.mock('@mui/material/Grid', () => {
  return function MockGrid({ children, size, ...props }) {
    return (
      <div data-testid="grid" data-size={size} {...props}>
        {children}
      </div>
    );
  };
});

// Mock the statuses helper
jest.mock('v2/store/reducers/clink/project/helper', () => ({
  statuses: {
    service: {
      '1': 'Service 1',
      '2': 'Service 2',
    },
    size: {
      '1': 'Small',
      '2': 'Large',
    },
  },
}));

// Mock the theme palette
const mockPalette = {
  secondaryBlack: {
    main: '#000000',
  },
};

jest.mock('@mui/material/styles', () => ({
  ...jest.requireActual('@mui/material/styles'),
  useTheme: () => ({
    palette: mockPalette,
  }),
}));

// Create a mock store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      root: (state = initialState) => state,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(thunk),
  });
};

// Create a mock theme
const theme = createTheme();

const renderWithProviders = (component, { store = createMockStore(), ...options } = {}) => {
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        {component}
      </ThemeProvider>
    </Provider>,
    options
  );
};

describe('Packages', () => {
  const mockTenders = [
    {
      id: 1,
      name: 'Package 1',
      service: '1',
      size: '1',
      start: '2023-01-01',
      tenderReturn: '2023-01-15',
      decisionDate: '2023-01-20',
      startOnSite: '2023-02-01',
      subcontractWorkFinish: '2023-03-01',
    },
    {
      id: 2,
      name: 'Package 2',
      service: '2',
      size: '2',
      start: '2023-02-01',
      tenderReturn: '2023-02-15',
      decisionDate: '2023-02-20',
      startOnSite: '2023-03-01',
      subcontractWorkFinish: '2023-04-01',
    },
  ];

  const defaultProps = {
    tenders: mockTenders,
    id: 'test-id',
    enquirySentDate: false,
    theme: {
      palette: mockPalette,
    },
    service: {
      '1': 'Service 1',
      '2': 'Service 2',
    },
    size: {
      '1': 'Small',
      '2': 'Large',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithProviders(<Packages {...defaultProps} />);
    expect(screen.getAllByTestId('header')).toHaveLength(2);
  });

  it('renders all tenders with headers', () => {
    renderWithProviders(<Packages {...defaultProps} />);
    
    // With 2 tenders, both should be collapsed initially
    expect(screen.getByText('Header for tender 1 - collapsed')).toBeInTheDocument();
    expect(screen.getByText('Header for tender 2 - collapsed')).toBeInTheDocument();
  });

  it('expands and collapses tenders when header is clicked', () => {
    renderWithProviders(<Packages {...defaultProps} />);
    
    // Initially collapsed
    expect(screen.getByText('Header for tender 1 - collapsed')).toBeInTheDocument();
    expect(screen.queryByTestId('collapse')).not.toBeInTheDocument();
    
    // Click to expand
    fireEvent.click(screen.getByText('Header for tender 1 - collapsed'));
    
    // Should be expanded
    expect(screen.getByText('Header for tender 1 - expanded')).toBeInTheDocument();
    expect(screen.getByTestId('collapse')).toBeInTheDocument();
    
    // Click to collapse
    fireEvent.click(screen.getByText('Header for tender 1 - expanded'));
    
    // Should be collapsed again
    expect(screen.getByText('Header for tender 1 - collapsed')).toBeInTheDocument();
    expect(screen.queryByTestId('collapse')).not.toBeInTheDocument();
  });

  it('can expand multiple tenders independently', () => {
    renderWithProviders(<Packages {...defaultProps} />);
    
    // Expand first tender
    fireEvent.click(screen.getByText('Header for tender 1 - collapsed'));
    expect(screen.getByText('Header for tender 1 - expanded')).toBeInTheDocument();
    expect(screen.getByText('Header for tender 2 - collapsed')).toBeInTheDocument();
    
    // Expand second tender
    fireEvent.click(screen.getByText('Header for tender 2 - collapsed'));
    expect(screen.getByText('Header for tender 1 - expanded')).toBeInTheDocument();
    expect(screen.getByText('Header for tender 2 - expanded')).toBeInTheDocument();
  });

  it('renders EditDate components when expanded', () => {
    renderWithProviders(<Packages {...defaultProps} />);
    
    // Expand first tender
    fireEvent.click(screen.getByText('Header for tender 1 - collapsed'));
    
    // Should render all EditDate components
    expect(screen.getByTestId('edit-date-send_date')).toBeInTheDocument();
    expect(screen.getByTestId('edit-date-tender_return')).toBeInTheDocument();
    expect(screen.getByTestId('edit-date-decision_date')).toBeInTheDocument();
    expect(screen.getByTestId('edit-date-start_on_site')).toBeInTheDocument();
    expect(screen.getByTestId('edit-date-subcontract_work_finish')).toBeInTheDocument();
  });

  it('displays service and size information when expanded', () => {
    renderWithProviders(<Packages {...defaultProps} />);
    
    // Expand first tender
    fireEvent.click(screen.getByText('Header for tender 1 - collapsed'));
    
    // Should display service and size
    expect(screen.getByText('service')).toBeInTheDocument();
    expect(screen.getByText('Service 1')).toBeInTheDocument();
    expect(screen.getByText('size')).toBeInTheDocument();
    expect(screen.getByText('Small')).toBeInTheDocument();
  });

  it('handles enquirySentDate prop correctly', () => {
    const tendersWithEnquirySentDate = [
      {
        ...mockTenders[0],
        enquirySentDate: true,
      },
    ];
    
    renderWithProviders(<Packages {...defaultProps} tenders={tendersWithEnquirySentDate} />);
    
    // Single tender is expanded by default
    expect(screen.getByText('Header for tender 1 - expanded')).toBeInTheDocument();
    
    // Should show "sent-date" when enquirySentDate is true
    expect(screen.getByText('sent-date')).toBeInTheDocument();
  });

  it('shows recommended-send-date when enquirySentDate is false', () => {
    renderWithProviders(<Packages {...defaultProps} enquirySentDate={false} />);
    
    // Expand first tender
    fireEvent.click(screen.getByText('Header for tender 1 - collapsed'));
    
    // Should show "recommended-send-date" when enquirySentDate is false
    expect(screen.getByText('recommended-send-date')).toBeInTheDocument();
  });

  it('renders with empty tenders array', () => {
    renderWithProviders(<Packages {...defaultProps} tenders={[]} />);
    
    // Should not render any headers
    expect(screen.queryByTestId('header')).not.toBeInTheDocument();
  });

  it('renders with single tender', () => {
    const singleTender = [mockTenders[0]];
    renderWithProviders(<Packages {...defaultProps} tenders={singleTender} />);
    
    // Should render one header
    expect(screen.getAllByTestId('header')).toHaveLength(1);
    // Single tender should be expanded by default
    expect(screen.getByText('Header for tender 1 - expanded')).toBeInTheDocument();
  });

  it('handles missing service and size values gracefully', () => {
    const tendersWithMissingData = [
      {
        ...mockTenders[0],
        service: '99', // Non-existent service
        size: '99', // Non-existent size
      },
    ];
    
    renderWithProviders(<Packages {...defaultProps} tenders={tendersWithMissingData} />);
    
    // Single tender is expanded by default, so it should show expanded
    expect(screen.getByText('Header for tender 1 - expanded')).toBeInTheDocument();
    
    // Should still render the labels
    expect(screen.getByText('service')).toBeInTheDocument();
    expect(screen.getByText('size')).toBeInTheDocument();
  });

  it('passes correct props to EditDate components', () => {
    renderWithProviders(<Packages {...defaultProps} />);
    
    // Expand first tender
    fireEvent.click(screen.getByText('Header for tender 1 - collapsed'));
    
    // Check EditDate components have correct props (id comes from tender.id, which is 1)
    expect(screen.getByText('EditDate - ID: 1, Field: send_date, Date: 2023-01-01')).toBeInTheDocument();
    expect(screen.getByText('EditDate - ID: 1, Field: tender_return, Date: 2023-01-15')).toBeInTheDocument();
    expect(screen.getByText('EditDate - ID: 1, Field: decision_date, Date: 2023-01-20')).toBeInTheDocument();
    expect(screen.getByText('EditDate - ID: 1, Field: start_on_site, Date: 2023-02-01')).toBeInTheDocument();
    expect(screen.getByText('EditDate - ID: 1, Field: subcontract_work_finish, Date: 2023-03-01')).toBeInTheDocument();
  });
});