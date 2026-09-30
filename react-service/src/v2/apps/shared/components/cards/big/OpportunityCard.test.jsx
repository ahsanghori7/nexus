import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OpportunityCard from './OpportunityCard';

// Mock clink-components
jest.mock('clink-components', () => ({
  Card: ({ children, theme }) => <div data-testid="card" data-theme={theme}>{children}</div>,
  CardBody: ({ children, theme, disabled }) => (
    <div data-testid="card-body" data-theme={theme} data-disabled={disabled}>
      {children}
    </div>
  ),
  CardImage: ({ theme, src, alt }) => (
    <img data-testid="card-image" data-theme={theme} src={src} alt={alt} />
  ),
  CardLink: ({ children, theme, disabled, href }) => (
    <a data-testid="card-link" data-theme={theme} data-disabled={disabled} href={href}>
      {children}
    </a>
  ),
  CardTitle: ({ children, theme }) => <h2 data-testid="card-title" data-theme={theme}>{children}</h2>,
  CardInfoLine: ({ children, theme }) => <div data-testid="card-info-line" data-theme={theme}>{children}</div>,
  Image: ({ src }) => <img data-testid="image" src={src} alt="" />,
  CONSTANTS: {
    s3: {
      locationLogo: 'location-logo.svg',
      infoLogo: 'info-logo.svg',
      rocketLogo: 'rocket-logo.svg',
      calendarLogo: 'calendar-logo.svg',
      statusLogo: 'status-logo.svg',
      prosperPackagesDefault: 'default-package.jpg',
      distancePurple: 'distance-purple.svg'
    },
    colors: {
      general: {
        blueMagentaViolet: '#6b46c1'
      }
    }
  }
}));

// Mock MUI components
jest.mock('@mui/material/Grid', () => {
  return ({ children, container, item, justifyContent, flexDirection, sx, ...props }) => (
    <div 
      data-testid="grid" 
      data-container={container} 
      data-item={item}
      data-justify-content={justifyContent}
      data-flex-direction={flexDirection}
      style={sx}
      {...props}
    >
      {children}
    </div>
  );
});

jest.mock('@mui/material/Typography', () => {
  return ({ children, sx, ...props }) => (
    <span data-testid="typography" style={sx} {...props}>
      {children}
    </span>
  );
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'new-opportunity': 'New Opportunity',
        'text-project-region': 'Region',
        'text-project-type': 'Type',
        'text-start-on-site': 'Start on site',
        'text-pc-date': 'PC Date',
        'status': 'Status',
        'away': 'away',
        'from-your-address': 'from your address',
        'View details': 'View details'
      };
      return translations[key] || key;
    }
  })
}));

// Mock moment
jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  return (date) => ({
    format: (format) => {
      if (date === '2024-01-15') {
        return '15/01/2024';
      }
      if (date === '2024-02-15') {
        return '15/02/2024';
      }
      return actualMoment(date).format(format);
    }
  });
});

// Mock styled components
jest.mock('v2/apps/shared/components/cards/big/styled', () => ({
  MuiNewOpportunityBanner: ({ children }) => (
    <div data-testid="new-opportunity-banner">{children}</div>
  )
}));

// Mock helpers
jest.mock('v2/helpers/url', () => ({
  checkIfImageExists: jest.fn((url, callback) => {
    // Mock that the image exists by default
    callback(true);
  })
}));

jest.mock('v2/helpers/date', () => ({
  DEFAULT_DATE_FORMAT: 'DD/MM/YYYY'
}));

describe('OpportunityCard', () => {
  const mockItem = {
    id: 1,
    projectName: 'Test Project',
    projectImage: 'https://example.com/project.jpg',
    region: 'Test Region',
    type: 'Construction',
    start: '2024-01-15',
    end: '2024-02-15',
    phase: 'Planning',
    restricted: false,
    viewProject: '/project/1',
    isNew: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<OpportunityCard item={mockItem} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('displays project information correctly', () => {
    render(<OpportunityCard item={mockItem} />);
    
    expect(screen.getByTestId('card-title')).toHaveTextContent('Test Project');
    expect(screen.getByText('Region:')).toBeInTheDocument();
    expect(screen.getByText('Test Region')).toBeInTheDocument();
    expect(screen.getByText('Type:')).toBeInTheDocument();
    expect(screen.getByText('Construction')).toBeInTheDocument();
    expect(screen.getByText('Status:')).toBeInTheDocument();
    expect(screen.getByText('Planning')).toBeInTheDocument();
  });

  it('displays formatted dates correctly', () => {
    render(<OpportunityCard item={mockItem} />);
    
    expect(screen.getByText('15/01/2024')).toBeInTheDocument();
    expect(screen.getByText('15/02/2024')).toBeInTheDocument();
  });

  it('shows new opportunity banner when isNew is true', () => {
    const newItem = { ...mockItem, isNew: true };
    render(<OpportunityCard item={newItem} />);
    
    expect(screen.getByTestId('new-opportunity-banner')).toBeInTheDocument();
    expect(screen.getByText('New Opportunity')).toBeInTheDocument();
  });

  it('does not show new opportunity banner when isNew is false', () => {
    render(<OpportunityCard item={mockItem} />);
    
    expect(screen.queryByTestId('new-opportunity-banner')).not.toBeInTheDocument();
  });

  it('uses custom card theme', () => {
    const customTheme = 'custom-theme';
    render(<OpportunityCard item={mockItem} cardTheme={customTheme} />);
    
    expect(screen.getByTestId('card')).toHaveAttribute('data-theme', customTheme);
  });

  it('uses default card theme when not provided', () => {
    render(<OpportunityCard item={mockItem} />);
    
    expect(screen.getByTestId('card')).toHaveAttribute('data-theme', 'prosper-big-card');
  });

  it('displays distance information when provided', () => {
    const distanceData = {
      distance: {
        text: '5.2 km'
      }
    };
    
    render(<OpportunityCard item={mockItem} distanceData={distanceData} />);
    
    expect(screen.getByText('5.2 km away')).toBeInTheDocument();
    expect(screen.getByText('from your address')).toBeInTheDocument();
  });

  it('does not display distance information when not provided', () => {
    render(<OpportunityCard item={mockItem} />);
    
    expect(screen.queryByText('away')).not.toBeInTheDocument();
    expect(screen.queryByText('from your address')).not.toBeInTheDocument();
  });

  it('renders view details link correctly', () => {
    render(<OpportunityCard item={mockItem} />);
    
    const link = screen.getByTestId('card-link');
    expect(link).toHaveTextContent('View details');
    expect(link).toHaveAttribute('href', '/project/1');
    expect(link).toHaveAttribute('data-disabled', 'false');
  });

  it('handles restricted projects correctly', () => {
    const restrictedItem = { ...mockItem, restricted: true };
    render(<OpportunityCard item={restrictedItem} />);
    
    const cardBody = screen.getByTestId('card-body');
    const link = screen.getByTestId('card-link');
    
    expect(cardBody).toHaveAttribute('data-disabled', 'true');
    expect(link).toHaveAttribute('data-disabled', 'true');
  });

  it('handles empty dates gracefully', () => {
    const itemWithoutDates = { ...mockItem, start: null, end: null };
    render(<OpportunityCard item={itemWithoutDates} />);
    
    // Should still render the date lines but with empty values
    expect(screen.getByText('Start on site:')).toBeInTheDocument();
    expect(screen.getByText('PC Date:')).toBeInTheDocument();
  });

  it('uses default image when project image check fails', async () => {
    const { checkIfImageExists } = require('v2/helpers/url');
    checkIfImageExists.mockImplementation((url, callback) => {
      callback(false); // Image doesn't exist
    });

    render(<OpportunityCard item={mockItem} />);
    
    await waitFor(() => {
      const cardImage = screen.getByTestId('card-image');
      expect(cardImage).toHaveAttribute('src', 'default-package.jpg');
    });
  });

  it('uses project image when it exists', async () => {
    const { checkIfImageExists } = require('v2/helpers/url');
    checkIfImageExists.mockImplementation((url, callback) => {
      callback(true); // Image exists
    });

    render(<OpportunityCard item={mockItem} />);
    
    await waitFor(() => {
      const cardImage = screen.getByTestId('card-image');
      expect(cardImage).toHaveAttribute('src', 'https://example.com/project.jpg');
    });
  });
});