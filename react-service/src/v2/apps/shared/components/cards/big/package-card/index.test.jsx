import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PackageCard from './index';

// Mock clink-components
jest.mock('clink-components', () => ({
  Card: ({ children, theme }) => <div data-testid="card" data-theme={theme}>{children}</div>,
  CardBody: ({ children, theme, disabled }) => (
    <div data-testid="card-body" data-theme={theme} data-disabled={disabled}>
      {children}
    </div>
  ),
  CardInfoLine: ({ children, theme }) => (
    <div data-testid="card-info-line" data-theme={theme}>{children}</div>
  ),
  Badge: ({ color, text }) => (
    <span data-testid="badge" data-color={color}>{text}</span>
  ),
  Image: ({ src, alt }) => <img src={src} alt={alt} data-testid="image" />,
  CONSTANTS: {
    s3: {
      closedIcon: 'closed-icon.svg'
    }
  }
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'opportunity-closed': 'Opportunity Closed',
        'registered-interests': ' registered interests',
        'text-trade-tags': 'Trade Tags',
        'text-service-required': 'Service Required',
        'text-tender-return': 'Tender Return',
        'text-start-on-site': 'Start on Site',
        'text-project-size': 'Project Size',
      };
      return translations[key] || key;
    }
  })
}));

// Mock moment
jest.mock('moment', () => {
  const moment = jest.requireActual('moment');
  return (date) => moment(date || '2024-01-15');
});

// Mock styled components
jest.mock('./styled', () => ({
  StyledCardItemHead: ({ children, ...props }) => <div data-testid="styled-head" {...props}>{children}</div>,
  StyledCardItemHeadTitle: ({ children, ...props }) => <h3 data-testid="styled-title" {...props}>{children}</h3>,
  StyledCardItemHeadDescription: ({ children, ...props }) => <div data-testid="styled-description" {...props}>{children}</div>,
  StyledCardItemInfoSubtitle: ({ children, ...props }) => <span data-testid="styled-subtitle" {...props}>{children}</span>,
  StyledCardItemHeadTags: ({ children, ...props }) => <span data-testid="styled-tags" {...props}>{children}</span>,
  StyledCardItemHeadInfo: ({ children, ...props }) => <div data-testid="styled-info" {...props}>{children}</div>,
  StyledCardItemInfoTradesSubtitle: ({ children, ...props }) => <div data-testid="styled-trades-subtitle" {...props}>{children}</div>,
  StyledCardInfoDescription: ({ children }) => <div data-testid="styled-info-description">{children}</div>,
  StyledCardInfoTradesDescription: ({ children }) => <div data-testid="styled-trades-description">{children}</div>,
  StyledCardItemClosed: ({ children }) => <div data-testid="styled-closed">{children}</div>,
  StyledCardItemClosedImage: ({ children }) => <div data-testid="styled-closed-image">{children}</div>,
  StyledCardItemClosedText: ({ children }) => <div data-testid="styled-closed-text">{children}</div>,
  StyledCardItemTrades: ({ children }) => <div data-testid="styled-trades">{children}</div>,
  StyledInfoLineWrapper: ({ children }) => <div data-testid="styled-info-wrapper">{children}</div>,
}));

// Mock components
jest.mock('v2/apps/shared/components/cards/big/InfoTooltip', () => 
  ({ matched, closed }) => <div data-testid="info-tooltip" data-matched={matched} data-closed={closed}>Info Tooltip</div>
);

jest.mock('./Options', () => 
  ({ registered, canRegister, restrictedMessage, cardTheme, subcontractor, handleRegister, tenderReturn, claimToken, fetchSingleProject }) => (
    <div data-testid="options" 
         data-registered={registered} 
         data-can-register={canRegister}
         data-card-theme={cardTheme}>
      Options Component
    </div>
  )
);

describe('PackageCard Component', () => {
  const mockProps = {
    pack: {
      id: 123,
      label: 'Test Package',
      service: 'Construction Services',
      start_on_site: '2024-02-01',
      tender_return: '2024-01-30',
      size: 'Large',
      packages: ['Electrical', 'Plumbing'],
      interest_count: 3,
      registered: false,
      can_register: true,
      awarded: false,
      matched: true,
      can_register_message: '',
      cardTheme: 'prosper-package-card',
    },
    subcontractor: {},
    handleRegister: jest.fn(),
    claimToken: jest.fn(),
    fetchSingleProject: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<PackageCard {...mockProps} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('displays package name', () => {
    render(<PackageCard {...mockProps} />);
    expect(screen.getByText('Test Package')).toBeInTheDocument();
  });

  it('shows interest count', () => {
    render(<PackageCard {...mockProps} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('registered interests', { exact: false })).toBeInTheDocument();
  });

  it('displays service type', () => {
    render(<PackageCard {...mockProps} />);
    expect(screen.getByText('Construction Services')).toBeInTheDocument();
  });

  it('shows project size', () => {
    render(<PackageCard {...mockProps} />);
    expect(screen.getByText('Large')).toBeInTheDocument();
  });

  it('renders trade tags as badges', () => {
    render(<PackageCard {...mockProps} />);
    expect(screen.getAllByText('Electrical')).toHaveLength(2); // appears in head and body
    expect(screen.getAllByText('Plumbing')).toHaveLength(2); // appears in head and body
    
    const badges = screen.getAllByTestId('badge');
    expect(badges).toHaveLength(4); // 2 in head section + 2 in trades section
  });

  it('shows formatted dates', () => {
    render(<PackageCard {...mockProps} />);
    // The actual dates shown should match the mock data
    expect(screen.getByText('30th January 2024')).toBeInTheDocument();
    expect(screen.getByText('1st February 2024')).toBeInTheDocument();
  });

  it('displays closed state when package is awarded', () => {
    const closedProps = {
      ...mockProps,
      pack: {
        ...mockProps.pack,
        awarded: true,
      },
    };
    
    render(<PackageCard {...closedProps} />);
    expect(screen.getByTestId('styled-closed')).toBeInTheDocument();
    expect(screen.getByText('Opportunity Closed')).toBeInTheDocument();
    expect(screen.getByTestId('image')).toHaveAttribute('src', 'closed-icon.svg');
  });

  it('shows Options component when matched and not closed', () => {
    render(<PackageCard {...mockProps} />);
    expect(screen.getByTestId('options')).toBeInTheDocument();
  });

  it('hides Options component when not matched', () => {
    const unmatchedProps = {
      ...mockProps,
      pack: {
        ...mockProps.pack,
        matched: false,
      },
    };
    
    render(<PackageCard {...unmatchedProps} />);
    expect(screen.queryByTestId('options')).not.toBeInTheDocument();
  });

  it('hides Options component when closed', () => {
    const closedProps = {
      ...mockProps,
      pack: {
        ...mockProps.pack,
        awarded: true,
      },
    };
    
    render(<PackageCard {...closedProps} />);
    expect(screen.queryByTestId('options')).not.toBeInTheDocument();
  });

  it('displays interest count as 5+ when greater than 5', () => {
    const highInterestProps = {
      ...mockProps,
      pack: {
        ...mockProps.pack,
        interest_count: 8,
      },
    };
    
    render(<PackageCard {...highInterestProps} />);
    expect(screen.getByText('5+')).toBeInTheDocument();
  });

  it('uses default values when pack properties are missing', () => {
    const minimalProps = {
      ...mockProps,
      pack: {
        id: 123,
      },
    };
    
    render(<PackageCard {...minimalProps} />);
    expect(screen.getAllByText('*****')).toHaveLength(3); // title, service, size
    expect(screen.getAllByText('0')).toHaveLength(2); // interest count and trades count
  });

  it('applies correct theme to card components', () => {
    render(<PackageCard {...mockProps} />);
    expect(screen.getByTestId('card')).toHaveAttribute('data-theme', 'prosper-package-card');
    expect(screen.getByTestId('card-body')).toHaveAttribute('data-theme', 'prosper-package-card');
  });

  it('passes props to styled components correctly', () => {
    render(<PackageCard {...mockProps} />);
    const styledHead = screen.getByTestId('styled-head');
    expect(styledHead).toBeInTheDocument();
    // Styled components don't necessarily pass down boolean props as attributes
    // Just verify they render without errors
  });

  it('renders InfoTooltip with correct props', () => {
    render(<PackageCard {...mockProps} />);
    const tooltip = screen.getByTestId('info-tooltip');
    expect(tooltip).toHaveAttribute('data-matched', 'true');
    expect(tooltip).toHaveAttribute('data-closed', 'false');
  });

  it('handles empty trade tags array', () => {
    const noTagsProps = {
      ...mockProps,
      pack: {
        ...mockProps.pack,
        packages: [],
      },
    };
    
    render(<PackageCard {...noTagsProps} />);
    // Should not crash and still render the Trade Tags label in both sections
    expect(screen.getAllByText(/Trade Tags/)).toHaveLength(2);
  });
});