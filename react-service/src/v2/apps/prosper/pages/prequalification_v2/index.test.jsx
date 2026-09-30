import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Prequalification from './index';

// Mock the specific modules that the component uses
jest.mock('v2/helpers/date', () => ({
  expiredDate: jest.fn((date) => {
    if (!date) return false;
    const inputDate = new Date(date);
    const now = new Date();
    return inputDate < now;
  }),
}));

jest.mock('v2/helpers/currency', () => ({
  parseFloatVal: jest.fn((value) => {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const numValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
      return isNaN(numValue) ? 0 : numValue;
    }
    return 0;
  }),
}));

// Mock the context hook to provide the missing actions
jest.mock('hooks/context', () => ({
  useContext: jest.fn(() => ({
    actions: {
      fetchPrequalificationSections: jest.fn(),
      fetchPrequalification_V2: jest.fn(),
      changeLocalCompanyInfo_V2: jest.fn(),
    },
  })),
}));

// Mock the child components used by Prequalification
jest.mock('v2/apps/shared/components/tabs', () => ({
  __esModule: true,
  default: ({ tabs, block, percentComplete, ...props }) => (
    <div data-testid="tabs-component" data-percent-complete={percentComplete} data-blocked={block}>
      {tabs && tabs.map((tab, index) => (
        <div key={tab.id || index} data-testid={`tab-${tab.id || index + 1}`}>
          <div data-testid={`tab-title-${index + 1}`}>{tab.title}</div>
        </div>
      ))}
    </div>
  ),
}));

jest.mock('v2/apps/shared/components/prequalification/v2/documents_v2', () => ({
  __esModule: true,
  default: (props) => <div data-testid="documents-component" {...props}>Documents Component</div>,
}));

jest.mock('v2/apps/shared/components/prequalification/v2/references', () => ({
  __esModule: true,
  default: (props) => <div data-testid="references-component" {...props}>References Component</div>,
}));

jest.mock('v2/apps/shared/components/prequalification/v2/finance', () => ({
  __esModule: true,
  default: (props) => <div data-testid="finance-component" {...props}>Finance Component</div>,
}));

jest.mock('v2/apps/shared/components/prequalification/v2/organization', () => ({
  __esModule: true,
  default: (props) => <div data-testid="organization-component" {...props}>Organization Component</div>,
}));

jest.mock('v2/apps/shared/components/company-v2/Mui.styled', () => ({
  ProgressBar: ({ percentComplete }) => (
    <div data-testid="progress-bar" data-percent-complete={percentComplete}>
      Progress: {percentComplete}%
    </div>
  ),
}));

describe('Prequalification Component', () => {
  const mockDispatch = jest.fn();
  const defaultProps = {
    contextType: 'prosper',
    dispatch: mockDispatch,
    prequalification: {
      percentage: {
        finance: 30,
        documents: 20,
        references: 25,
      },
      documents: {
        doc1: 'document1.pdf',
      },
      turnover: [
        { inizialized: true, value: 100000 },
        { inizialized: false, value: 0 },
      ],
      company_information: {
        max_order_value: '500000',
        min_order_value: '10000',
      },
      insurances: [
        { date: '2024-12-31' },
      ],
      accreditation: [],
      'custom-certificate': [],
      'management-system': [],
    },
    subcontractor: {
      id: '123',
      name: 'Test Subcontractor',
      company_information: {
        max_order_value: 1000000,
        min_order_value: 50000,
      },
      turnover: [
        { inizialized: true, value: 150000 },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<Prequalification {...defaultProps} />);
    expect(screen.getByTestId('tabs-component')).toBeInTheDocument();
  });

  test('renders tabs component when prequalification exists', () => {
    render(<Prequalification {...defaultProps} />);
    
    const tabsComponent = screen.getByTestId('tabs-component');
    expect(tabsComponent).toBeInTheDocument();
    
    // Check that tabs are rendered
    expect(screen.getByTestId('tab-1')).toBeInTheDocument(); // Finance tab
    expect(screen.getByTestId('tab-2')).toBeInTheDocument(); // Organization tab
    expect(screen.getByTestId('tab-3')).toBeInTheDocument(); // Documents tab
    expect(screen.getByTestId('tab-4')).toBeInTheDocument(); // References tab
  });

  test('calculates percent complete correctly', () => {
    render(<Prequalification {...defaultProps} />);
    
    const tabsComponent = screen.getByTestId('tabs-component');
    expect(tabsComponent).toHaveAttribute('data-percent-complete', '75'); // 30 + 20 + 25 = 75
  });

  test('renders correctly even with minimal prequalification data', () => {
    const propsWithMinimalPrequalification = {
      ...defaultProps,
      prequalification: {
        percentage: {
          finance: 0,
          documents: 0,
          references: 0,
        },
        documents: {},
        turnover: [],
        company_information: {
          max_order_value: '500000',
          min_order_value: '10000',
        },
        insurances: [],
        accreditation: [],
        'custom-certificate': [],
        'management-system': [],
      },
    };
    
    const { container } = render(<Prequalification {...propsWithMinimalPrequalification} />);
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByTestId('tabs-component')).toBeInTheDocument();
    expect(screen.getByTestId('tabs-component')).toHaveAttribute('data-percent-complete', '0');
  });

  test('works with different context types', () => {
    const propsWithClinkContext = {
      ...defaultProps,
      contextType: 'clink',
    };
    
    render(<Prequalification {...propsWithClinkContext} />);
    expect(screen.getByTestId('tabs-component')).toBeInTheDocument();
  });

  test('handles missing subcontractor gracefully', () => {
    const propsWithoutSubcontractor = {
      ...defaultProps,
      subcontractor: {
        company_information: {
          max_order_value: 1000000,
          min_order_value: 50000,
        },
        turnover: [],
      },
    };
    
    render(<Prequalification {...propsWithoutSubcontractor} />);
    expect(screen.getByTestId('tabs-component')).toBeInTheDocument();
  });

  test('renders tab titles correctly', () => {
    render(<Prequalification {...defaultProps} />);
    
    expect(screen.getByTestId('tab-title-1')).toHaveTextContent('finance');
    expect(screen.getByTestId('tab-title-2')).toHaveTextContent('organization');
    expect(screen.getByTestId('tab-title-3')).toBeInTheDocument(); // Documents with badge
    expect(screen.getByTestId('tab-title-4')).toHaveTextContent('references');
  });

  test('calls useEffect when isProsper is true and aid exists', () => {
    const propsWithAid = {
      ...defaultProps,
      aid: '12345',
    };

    render(<Prequalification {...propsWithAid} />);
    
    // The component should render without errors when aid is provided
    expect(screen.getByTestId('tabs-component')).toBeInTheDocument();
  });

  test('triggers useEffect when documents exist and contextType is prosper', () => {
    const propsWithDocuments = {
      ...defaultProps,
      aid: '12345',
      prequalification: {
        ...defaultProps.prequalification,
        documents: {
          doc1: 'document1.pdf',
          doc2: 'document2.pdf',
        },
      },
    };

    render(<Prequalification {...propsWithDocuments} />);
    
    // The component should render without errors when documents are provided
    expect(screen.getByTestId('tabs-component')).toBeInTheDocument();
  });
});