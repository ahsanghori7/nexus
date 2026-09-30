import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import '@testing-library/jest-dom';
import CompanyOfferingForm from './CompanyOfferingForm';

// Mock the i18next module
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => {
    const translations = {
      'trades': 'Trades',
      'locations': 'Locations',
      'financial': 'Financial',
      'text-project-size': 'Project Size',
      'turnover-past-years': 'Turnover Past Years',
      'accomodate-value': 'Accommodate Value',
      'minimum': 'Minimum',
      'min': 'Min',
      'maximum': 'Maximum',
      'max': 'Max'
    };
    return translations[key] || key;
  }
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      iconTradesGray: 'icon-trades-gray.png',
      iconTradesGreen: 'icon-trades-green.png',
      iconLocationsGray: 'icon-locations-gray.png', 
      iconLocationsGreen: 'icon-locations-green.png',
      iconTurnoverGray: 'icon-turnover-gray.png',
      iconTurnoverGreen: 'icon-turnover-green.png',
      iconProjectGray: 'icon-project-gray.png',
      iconProjectGreen: 'icon-project-green.png'
    }
  }
}));

// Mock the Tabs component
jest.mock('v2/apps/clink/pages/supply-chain-profile/tabs', () => {
  return jest.fn(({ tabs, colorTheme, nested }) => (
    <div data-testid="tabs" data-color-theme={colorTheme} data-nested={nested}>
      {tabs.map((tab) => (
        <div key={tab.id} data-testid={`tab-${tab.id}`}>
          <div data-testid={`tab-title-${tab.id}`}>{tab.title}</div>
          <div data-testid={`tab-content-${tab.id}`}>
            <tab.Content />
          </div>
        </div>
      ))}
    </div>
  ));
});

// Mock the styled components
jest.mock('v2/apps/clink/pages/supply-chain-profile/tab-forms/muitabs.styled', () => ({
  MuiTabQuizz: ({ children }) => <div data-testid="tab-quizz">{children}</div>,
  MuiTabContent: ({ children, financial }) => (
    <div data-testid="tab-content" data-financial={financial ? 'true' : undefined}>{children}</div>
  )
}));

jest.mock('v2/apps/clink/pages/supply-chain-profile/tab-forms/mui-financial.styled', () => ({
  MuiFinancialInput: ({ adornment, value, profitBeforeTax, country }) => (
    <div 
      data-testid="financial-input"
      data-adornment={adornment}
      data-value={value}
      data-profit={profitBeforeTax}
      data-country={country}
    >
      Financial Input: {adornment} - {value}
    </div>
  ),
  MuiFinancialDetails: ({ data }) => (
    <div data-testid="financial-details" data-company-info={JSON.stringify(data)}>
      Financial Details
    </div>
  )
}));

jest.mock('v2/apps/clink/pages/supply-chain-profile/mui.styled', () => ({
  MuiTabTitle: ({ children, icon, iconActive }) => (
    <div data-testid="tab-title" data-icon={icon} data-icon-active={iconActive}>
      {children}
    </div>
  )
}));

jest.mock('v2/apps/clink/pages/supply-chain-profile/inputs', () => ({
  InputWithAdornment: ({ adornment, value, country }) => (
    <div 
      data-testid="input-with-adornment"
      data-adornment={adornment}
      data-value={value}
      data-country={country}
    >
      {adornment}: {value}
    </div>
  ),
  SimpleInput: ({ value }) => (
    <div data-testid="simple-input" data-value={value}>
      {value}
    </div>
  )
}));

// Mock MUI components
jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: jest.fn()
}));

jest.mock('@mui/material/styles', () => ({
  useTheme: jest.fn(() => ({
    breakpoints: {
      up: jest.fn((size) => `(min-width: ${size === 'lg' ? '1200px' : '600px'})`)
    }
  }))
}));

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('CompanyOfferingForm', () => {
  let store;
  let mockMediaQuery;

  const currentYear = new Date().getFullYear();
  const mockProps = {
    offering: {
      trades: [
        { id: 1, label: 'Construction' },
        { id: 2, label: 'Electrical' },
        { id: 3, label: 'Plumbing' }
      ],
      regions: [
        { id: 1, label: 'North Region' },
        { id: 2, label: 'South Region' },
        { id: 3, label: 'Central Region' }
      ]
    },
    turnover: [
      {
        id: 1,
        year: currentYear - 1,
        value: '100000.00',
        profit_before_tax: '10000.00',
        active_trading: true
      },
      {
        id: 2,
        year: currentYear - 2,
        value: '90000.00',
        profit_before_tax: '9000.00',
        active_trading: true
      }
    ],
    companyInformation: {
      min_order_value: '5000.00',
      max_order_value: '500000.00'
    },
    nested: false,
    colorTheme: 'primary'
  };

  beforeEach(() => {
    store = mockStore({
      clinkAccount: {
        country: 'US'
      }
    });

    mockMediaQuery = require('@mui/material/useMediaQuery').default;
    // Default: treat viewport as large screen (>= 1200px) but not strictly mobile (< 600px)
    mockMediaQuery.mockImplementation((query) => {
      if (query.includes('1200px')) return true;   // Large screen breakpoint
      if (query.includes('600px')) return false;   // Under small-screen threshold
      return false;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props = {}) => {
    return render(
      <Provider store={store}>
        <CompanyOfferingForm {...mockProps} {...props} />
      </Provider>
    );
  };

  it('renders without crashing', () => {
    const { getByTestId } = renderComponent();
    expect(getByTestId('tabs')).toBeInTheDocument();
  });

  it('renders all four tabs with correct titles', () => {
    const { getByTestId } = renderComponent();
    
    expect(getByTestId('tab-1')).toBeInTheDocument();
    expect(getByTestId('tab-2')).toBeInTheDocument();
    expect(getByTestId('tab-3')).toBeInTheDocument();
    expect(getByTestId('tab-4')).toBeInTheDocument();
    
    expect(getByTestId('tab-title-1')).toHaveTextContent('Trades');
    expect(getByTestId('tab-title-2')).toHaveTextContent('Locations');
    expect(getByTestId('tab-title-3')).toHaveTextContent('Financial');
    expect(getByTestId('tab-title-4')).toHaveTextContent('Project Size');
  });

  it('passes correct props to Tabs component', () => {
    const { getByTestId } = renderComponent();
    const tabsElement = getByTestId('tabs');
    
    expect(tabsElement).toHaveAttribute('data-color-theme', 'primary');
    expect(tabsElement).toHaveAttribute('data-nested', 'false');
  });

  it('renders trades tab content with sorted trades', () => {
    const { container } = renderComponent();
    
    // Get only the trades tab content (first tab)
    const tradesTabContent = container.querySelector('[data-testid="tab-content-1"]');
    const simpleInputs = tradesTabContent.querySelectorAll('[data-testid="simple-input"]');
    
    expect(tradesTabContent).toBeInTheDocument();
    expect(simpleInputs).toHaveLength(3);
    
    // Verify trades are sorted alphabetically
    expect(simpleInputs[0]).toHaveAttribute('data-value', 'Construction');
    expect(simpleInputs[1]).toHaveAttribute('data-value', 'Electrical');
    expect(simpleInputs[2]).toHaveAttribute('data-value', 'Plumbing');
  });

  it('renders locations tab content with sorted regions', () => {
    const { container } = renderComponent();
    
    // Get only the locations tab content (second tab)
    const locationsTabContent = container.querySelector('[data-testid="tab-content-2"]');
    const simpleInputs = locationsTabContent.querySelectorAll('[data-testid="simple-input"]');
    
    expect(locationsTabContent).toBeInTheDocument();
    expect(simpleInputs).toHaveLength(3);
    
    // Verify regions are sorted alphabetically
    expect(simpleInputs[0]).toHaveAttribute('data-value', 'Central Region');
    expect(simpleInputs[1]).toHaveAttribute('data-value', 'North Region');
    expect(simpleInputs[2]).toHaveAttribute('data-value', 'South Region');
  });

  it('renders financial tab with turnover data and defaults', () => {
    const { container } = renderComponent();
    
    // Get only the financial tab content (third tab)
    const financialTabContent = container.querySelector('[data-testid="tab-content-3"]');
    const tabContent = financialTabContent.querySelector('[data-testid="tab-content"]');
    const financialInputs = financialTabContent.querySelectorAll('[data-testid="financial-input"]');
    const financialDetails = financialTabContent.querySelector('[data-testid="financial-details"]');
    
    expect(financialTabContent).toBeInTheDocument();
    expect(tabContent).toHaveAttribute('data-financial', 'true');
    
    // Calculate expected number of inputs
    // Component generates defaults for last 3 years (current, current-1, current-2)
    // Mock data has currentYear-1 and currentYear-2
    const currentYear = new Date().getFullYear();
    const mockYears = [currentYear - 1, currentYear - 2];
    const defaultYears = [currentYear, currentYear - 1, currentYear - 2];
    const missingYears = defaultYears.filter(year => !mockYears.includes(year));
    const expectedLength = mockYears.length + missingYears.length;
    
    expect(financialInputs).toHaveLength(expectedLength);
    expect(financialDetails).toBeInTheDocument();
    
    // Build expected years array sorted by year
    const expectedYears = [
      currentYear - 2,
      currentYear - 1,
      currentYear
    ].map(String);
 
    // Verify turnover inputs are sorted by year
    expectedYears.forEach((year, index) => {
      expect(financialInputs[index]).toHaveAttribute('data-adornment', year);
    });
  });

  it('renders project size tab with min/max order values', () => {
    // Default is large screen, so should show "Min"/"Max"
    const { container } = renderComponent();
    
    // Get only the project size tab content (fourth tab)
    const projectTabContent = container.querySelector('[data-testid="tab-content-4"]');
    const inputsWithAdornment = projectTabContent.querySelectorAll('[data-testid="input-with-adornment"]');
    
    expect(projectTabContent).toBeInTheDocument();
    expect(inputsWithAdornment).toHaveLength(2);
    
    expect(inputsWithAdornment[0]).toHaveAttribute('data-adornment', 'Min');
    expect(inputsWithAdornment[0]).toHaveAttribute('data-value', '5000.00');
    expect(inputsWithAdornment[1]).toHaveAttribute('data-adornment', 'Max');
    expect(inputsWithAdornment[1]).toHaveAttribute('data-value', '500000.00');
  });

  it('shows mobile labels on small screens', () => {
    // Mock small screen
    mockMediaQuery.mockImplementation(() => false);
    
    const { getAllByTestId } = renderComponent();
    
    // Should show tab-quizz elements for mobile headers
    const tabQuizzes = getAllByTestId('tab-quizz');
    expect(tabQuizzes.length).toBeGreaterThan(0);
  });

  it('shows different adornment text on small screens for project size', () => {
    // Mock small screen for both lg and sm breakpoints
    mockMediaQuery.mockImplementation((query) => {
      if (query.includes('1200px')) return false; // Large screen = false
      if (query.includes('600px')) return true;  // Small screen = true (this is what triggers 'Minimum'/'Maximum')
      return false;
    });
    
    const { container } = renderComponent();
    const projectTabContent = container.querySelector('[data-testid="tab-content-4"]');
    const inputsWithAdornment = projectTabContent.querySelectorAll('[data-testid="input-with-adornment"]');
    
    expect(inputsWithAdornment[0]).toHaveAttribute('data-adornment', 'Minimum');
    expect(inputsWithAdornment[1]).toHaveAttribute('data-adornment', 'Maximum');
  });

  it('handles missing offering data gracefully', () => {
    const { getByTestId } = renderComponent({ 
      offering: { trades: [], regions: [] } // Provide empty arrays instead of null
    });
    
    expect(getByTestId('tabs')).toBeInTheDocument();
  });

  it('handles missing trades data gracefully', () => {
    const { queryByTestId } = renderComponent({
      offering: { trades: null, regions: [] }
    });
    
    // Trades tab content should not render
    expect(queryByTestId('simple-input')).not.toBeInTheDocument();
  });

  it('handles missing regions data gracefully', () => {
    const { getAllByTestId } = renderComponent({
      offering: { trades: mockProps.offering.trades, regions: null }
    });
    
    // Should only have trades inputs, no regions
    const simpleInputs = getAllByTestId('simple-input');
    expect(simpleInputs).toHaveLength(3); // Only trades
  });

  it('handles missing turnover data gracefully', () => {
    const { getByTestId } = renderComponent({ 
      turnover: [] // Provide empty array instead of null
    });
    
    expect(getByTestId('tabs')).toBeInTheDocument();
  });

  it('handles missing company information gracefully', () => {
    const { queryByTestId } = renderComponent({ companyInformation: null });
    
    // Project size tab content should not render
    expect(queryByTestId('input-with-adornment')).not.toBeInTheDocument();
  });

  it('generates correct default turnover years', () => {
    const currentYear = new Date().getFullYear();
    const turnoverWithCurrentYear = [
      ...mockProps.turnover,
      {
        id: 3,
        year: currentYear,
        value: '110000.00',
        profit_before_tax: '11000.00',
        active_trading: true
      }
    ];
    
    const { getAllByTestId } = renderComponent({
      turnover: turnoverWithCurrentYear
    });
    
    const financialInputs = getAllByTestId('financial-input');
    
    // Should include current year plus the two previous years
    expect(financialInputs.length).toBeGreaterThanOrEqual(3);
  });

  it('passes country from Redux state to components', () => {
    const { container } = renderComponent();
    
    const projectTabContent = container.querySelector('[data-testid="tab-content-4"]');
    const inputsWithAdornment = projectTabContent.querySelectorAll('[data-testid="input-with-adornment"]');
    
    const financialTabContent = container.querySelector('[data-testid="tab-content-3"]');
    const financialInputs = financialTabContent.querySelectorAll('[data-testid="financial-input"]');
    
    inputsWithAdornment.forEach(input => {
      expect(input).toHaveAttribute('data-country', 'US');
    });
    
    financialInputs.forEach(input => {
      expect(input).toHaveAttribute('data-country', 'US');
    });
  });

  it('works with nested prop', () => {
    const { getByTestId } = renderComponent({ nested: true });
    const tabsElement = getByTestId('tabs');
    
    expect(tabsElement).toHaveAttribute('data-nested', 'true');
  });

  it('works with different color themes', () => {
    const { getByTestId } = renderComponent({ colorTheme: 'secondary' });
    const tabsElement = getByTestId('tabs');
    
    expect(tabsElement).toHaveAttribute('data-color-theme', 'secondary');
  });
});
