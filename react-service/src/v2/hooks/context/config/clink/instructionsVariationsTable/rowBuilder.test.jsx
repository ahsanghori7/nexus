import React from 'react';
import { render, screen } from '@testing-library/react';
import rowBuilder from './rowBuilder';

// Mock dependencies
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => {
    if (key === 'currency') return 'GBP';
    return key;
  }),
}));

jest.mock('@mui/material/Box', () => {
  return function MockedBox({ children, sx, ...props }) {
    return <div data-testid="mui-box" {...props}>{children}</div>;
  };
});

jest.mock('clink-components', () => ({
  Badge: ({ text, color }) => (
    <span data-testid="mock-badge" data-color={color}>
      {text}
    </span>
  ),
}));

jest.mock('v2/helpers/currency', () => ({
  __esModule: true,
  default: jest.fn((value, config) => `£${value}`),
  currencyConfig: {
    GBP: { symbol: '£' },
    USD: { symbol: '$' },
    EUR: { symbol: '€' },
  },
}));

jest.mock('v2/apps/shared/components/clink-dropdown', () => {
  return function MockCLinkDropdown({ dropdownItems, dropdownCssClass, xOffset }) {
    return (
      <div 
        data-testid="mock-clink-dropdown"
        data-css-class={dropdownCssClass}
        data-offset={xOffset}
      >
        {dropdownItems.map((item, index) => (
          <div key={index} data-testid={`dropdown-item-${item.id}`}>
            {item.label}
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('v2/apps/clink/helpers', () => ({
  getEditUrl: jest.fn((slug, typeUid, id) => `/edit/${slug}/${typeUid}/${id}`),
  getPreviewLink: jest.fn((typeUid, id) => `/preview/${typeUid}/${id}`),
}));

jest.mock('./styled', () => ({
  StyledContentSubcontractorName: ({ children, className }) => (
    <div data-testid="styled-subcontractor-name" className={className}>
      {children}
    </div>
  ),
}));

describe('instructionsVariationsTable rowBuilder', () => {
  const mockDeleteAction = jest.fn();
  
  const baseData = {
    id: 'instruction-123',
    nr: 'INS-001',
    status: { id: 2, label: 'Draft' },
    date: '2023-12-01',
    subcontractor: { name: 'Test Subcontractor' },
    description: 'Test instruction description',
    price: 1500,
    type: { uid: 'instruction' },
    tender: { label: 'Test Package' },
  };

  const baseProps = {
    data: baseData,
    deleteAction: mockDeleteAction,
    slug: 'test-project',
    dropdownOffset: 10,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return object with correct structure', () => {
    const result = rowBuilder(baseProps);
    
    expect(result).toHaveProperty('id', 'instruction-123');
    expect(result).toHaveProperty('instruction');
    expect(result).toHaveProperty('date', '2023-12-01');
    expect(result).toHaveProperty('subcontractor');
    expect(result).toHaveProperty('description', 'Test instruction description');
    expect(result).toHaveProperty('price');
    expect(result).toHaveProperty('actions');
  });

  it('should format price with currency', () => {
    const result = rowBuilder(baseProps);
    
    expect(result.price).toBe('£1500');
  });

  it('should render instruction content with number and badge', () => {
    const result = rowBuilder(baseProps);
    
    render(<div>{result.instruction}</div>);
    
    expect(screen.getByText('INS-001')).toBeInTheDocument();
    expect(screen.getByTestId('mock-badge')).toBeInTheDocument();
    expect(screen.getByTestId('mock-badge')).toHaveAttribute('data-color', 'gray');
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('should render sent status with orange badge', () => {
    const sentData = {
      ...baseData,
      status: { id: 1, label: 'Sent' },
    };
    
    const result = rowBuilder({ ...baseProps, data: sentData });
    
    render(<div>{result.instruction}</div>);
    
    expect(screen.getByTestId('mock-badge')).toHaveAttribute('data-color', 'orange');
    expect(screen.getByText('Sent')).toBeInTheDocument();
  });

  it('should render subcontractor content with name and package', () => {
    const result = rowBuilder(baseProps);
    
    render(<div>{result.subcontractor}</div>);
    
    expect(screen.getByTestId('styled-subcontractor-name')).toBeInTheDocument();
    expect(screen.getByText('Test Subcontractor')).toBeInTheDocument();
    expect(screen.getByText('Test Package')).toBeInTheDocument();
  });

  it('should handle missing subcontractor name', () => {
    const noSubData = {
      ...baseData,
      subcontractor: null,
    };
    
    const result = rowBuilder({ ...baseProps, data: noSubData });
    
    render(<div>{result.subcontractor}</div>);
    
    expect(screen.getByTestId('styled-subcontractor-name')).toBeInTheDocument();
  });

  it('should handle missing tender label', () => {
    const noTenderData = {
      ...baseData,
      tender: null,
    };
    
    const result = rowBuilder({ ...baseProps, data: noTenderData });
    
    render(<div>{result.subcontractor}</div>);
    
    expect(screen.getByTestId('styled-subcontractor-name')).toBeInTheDocument();
    expect(screen.getByText('Test Subcontractor')).toBeInTheDocument();
  });

  it('should render actions dropdown with correct items for draft status', () => {
    const result = rowBuilder(baseProps);
    
    render(<div>{result.actions}</div>);
    
    expect(screen.getByTestId('mock-clink-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-item-1')).toBeInTheDocument(); // Edit
    expect(screen.getByTestId('dropdown-item-2')).toBeInTheDocument(); // Delete
    expect(screen.getByTestId('dropdown-item-3')).toBeInTheDocument(); // View Document
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('View Document')).toBeInTheDocument();
  });

  it('should render actions dropdown without edit/delete for sent status', () => {
    const sentData = {
      ...baseData,
      status: { id: 1, label: 'Sent' },
    };
    
    const result = rowBuilder({ ...baseProps, data: sentData });
    
    render(<div>{result.actions}</div>);
    
    expect(screen.getByTestId('mock-clink-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-item-3')).toBeInTheDocument(); // View Document only
    expect(screen.getByText('View Document')).toBeInTheDocument();
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('should pass correct dropdown properties', () => {
    const result = rowBuilder(baseProps);
    
    render(<div>{result.actions}</div>);
    
    const dropdown = screen.getByTestId('mock-clink-dropdown');
    expect(dropdown).toHaveAttribute('data-css-class', 'left-align');
    expect(dropdown).toHaveAttribute('data-offset', '10');
  });

  it('should render MUI Box with correct styling', () => {
    const result = rowBuilder(baseProps);
    
    render(<div>{result.actions}</div>);
    
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
  });

  it('should handle different currency configurations', () => {
    require('v2/helpers/i18n').t.mockImplementation((key) => {
      if (key === 'currency') return 'USD';
      return key;
    });
    
    const result = rowBuilder(baseProps);
    
    expect(result.price).toBe('£1500');
  });

  it('should generate correct edit and preview URLs', () => {
    const getEditUrl = require('v2/apps/clink/helpers').getEditUrl;
    const getPreviewLink = require('v2/apps/clink/helpers').getPreviewLink;
    
    rowBuilder(baseProps);
    
    expect(getEditUrl).toHaveBeenCalledWith('test-project', 'instruction', 'instruction-123');
    expect(getPreviewLink).toHaveBeenCalledWith('instruction', 'instruction-123');
  });

  it('should handle missing status label gracefully', () => {
    const noStatusLabelData = {
      ...baseData,
      status: { id: 2 },
    };
    
    const result = rowBuilder({ ...baseProps, data: noStatusLabelData });
    
    render(<div>{result.instruction}</div>);
    
    expect(screen.getByTestId('mock-badge')).toBeInTheDocument();
    expect(screen.getByTestId('mock-badge')).toHaveTextContent('');
  });

  it('should handle zero price value', () => {
    const zeroPriceData = {
      ...baseData,
      price: 0,
    };
    
    const result = rowBuilder({ ...baseProps, data: zeroPriceData });
    
    expect(result.price).toBe('£0');
  });
});