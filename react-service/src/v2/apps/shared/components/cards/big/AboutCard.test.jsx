import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AboutCard from './AboutCard';

// Mock clink-components
jest.mock('clink-components', () => ({
  Card: ({ children, theme }) => <div data-testid="card" data-theme={theme}>{children}</div>,
  CardBody: ({ children, theme, disabled }) => (
    <div data-testid="card-body" data-theme={theme} data-disabled={disabled}>
      {children}
    </div>
  ),
  CardInfoLine: ({ children, theme }) => (
    <div data-testid="card-info-line" data-theme={theme}>
      {children}
    </div>
  ),
  Image: ({ src, alt }) => <img src={src} alt={alt || ''} data-testid="image" />,
  CONSTANTS: {
    s3: {
      locationLogo: 'location-logo.svg',
      infoLogo: 'info-logo.svg', 
      rocketLogo: 'rocket-logo.svg',
      calendarLogo: 'calendar-logo.svg',
      statusLogo: 'status-logo.svg'
    }
  }
}));

// Mock v2/helpers/i18n
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => {
    const translations = {
      'text-project-location': 'Project Location',
      'text-project-type': 'Project Type',
      'text-start-on-site': 'Project Start',
      'text-pc-date': 'Project End',
      'status': 'Project Phase'
    };
    return translations[key] || key;
  }
}));

// Mock moment
jest.mock('moment', () => {
  const mockMoment = () => ({
    format: (format) => {
      if (format === 'Do MMMM YYYY') return '4th December 2021';
      return '2021-12-04';
    }
  });
  return mockMoment;
});

describe('AboutCard Component', () => {
  const defaultProps = {
    restricted: false,
    region: 'North America',
    type: 'Construction',
    start: '4th December 2021',
    end: '19th November 2022',
    phase: 'Phase 1',
    cardTheme: 'prosper-about-card'
  };

  it('renders without crashing', () => {
    render(<AboutCard {...defaultProps} />);
    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('applies the correct theme to components', () => {
    render(<AboutCard {...defaultProps} />);
    
    expect(screen.getByTestId('card')).toHaveAttribute('data-theme', 'prosper-about-card');
    expect(screen.getByTestId('card-body')).toHaveAttribute('data-theme', 'prosper-about-card');
    expect(screen.getAllByTestId('card-info-line')[0]).toHaveAttribute('data-theme', 'prosper-about-card');
  });

  it('displays project location information', () => {
    render(<AboutCard {...defaultProps} />);
    
    expect(screen.getByText('Project Location:')).toBeInTheDocument();
    expect(screen.getByText('North America')).toBeInTheDocument();
  });

  it('displays project type information', () => {
    render(<AboutCard {...defaultProps} />);
    
    expect(screen.getByText('Project Type:')).toBeInTheDocument();
    expect(screen.getByText('Construction')).toBeInTheDocument();
  });

  it('displays project start date', () => {
    render(<AboutCard {...defaultProps} />);
    
    expect(screen.getByText(/Project Start/)).toBeInTheDocument();
    expect(screen.getAllByText('4th December 2021')[0]).toBeInTheDocument();
  });

  it('displays project end date', () => {
    render(<AboutCard {...defaultProps} />);
    
    expect(screen.getByText(/Project End/)).toBeInTheDocument();
    // Both dates will show the same value due to moment mock
    expect(screen.getAllByText('4th December 2021')[1]).toBeInTheDocument();
  });

  it('displays project phase information', () => {
    render(<AboutCard {...defaultProps} />);
    
    expect(screen.getByText(/Project Phase/)).toBeInTheDocument();
    expect(screen.getByText('Phase 1')).toBeInTheDocument();
  });

  it('handles restricted state correctly', () => {
    render(<AboutCard {...defaultProps} restricted={true} />);
    
    expect(screen.getByTestId('card-body')).toHaveAttribute('data-disabled', 'true');
  });

  it('handles non-restricted state correctly', () => {
    render(<AboutCard {...defaultProps} restricted={false} />);
    
    expect(screen.getByTestId('card-body')).toHaveAttribute('data-disabled', 'false');
  });

  it('uses default values when props are not provided', () => {
    render(<AboutCard />);
    
    const asteriskElements = screen.getAllByText('*****');
    expect(asteriskElements).toHaveLength(3); // Should have 3 asterisk elements
    expect(screen.getByTestId('card')).toHaveAttribute('data-theme', 'prosper-about-card');
    expect(screen.getByTestId('card-body')).toHaveAttribute('data-disabled', 'false');
  });

  it('displays correct number of images for each info line', () => {
    render(<AboutCard {...defaultProps} />);
    
    // Should have 5 images (one for each info line: location, type, start, end, phase)
    const images = screen.getAllByTestId('image');
    expect(images).toHaveLength(5);
  });

  it('renders images with correct sources', () => {
    render(<AboutCard {...defaultProps} />);
    
    const images = screen.getAllByTestId('image');
    expect(images[0]).toHaveAttribute('src', 'location-logo.svg');
    expect(images[1]).toHaveAttribute('src', 'info-logo.svg');
    expect(images[2]).toHaveAttribute('src', 'rocket-logo.svg');
    expect(images[3]).toHaveAttribute('src', 'calendar-logo.svg');
    expect(images[4]).toHaveAttribute('src', 'status-logo.svg');
  });

  it('applies custom theme when provided', () => {
    const customTheme = 'custom-theme';
    render(<AboutCard {...defaultProps} cardTheme={customTheme} />);
    
    expect(screen.getByTestId('card')).toHaveAttribute('data-theme', customTheme);
    expect(screen.getByTestId('card-body')).toHaveAttribute('data-theme', customTheme);
  });

  it('handles asterisk values correctly', () => {
    const propsWithAsterisks = {
      region: '*****',
      type: '*****',
      phase: '*****'
    };
    
    render(<AboutCard {...propsWithAsterisks} />);
    
    const asteriskElements = screen.getAllByText('*****');
    expect(asteriskElements).toHaveLength(3); // region, type, and phase
  });

  it('handles empty values correctly', () => {
    const propsWithEmpty = {
      region: '',
      type: '',
      phase: ''
    };
    
    render(<AboutCard {...propsWithEmpty} />);
    
    // Should still render the labels
    expect(screen.getByText(/Project Location/)).toBeInTheDocument();
    expect(screen.getByText(/Project Type/)).toBeInTheDocument();
    expect(screen.getByText(/Project Phase/)).toBeInTheDocument();
  });

  it('has proper structure with all card info lines', () => {
    render(<AboutCard {...defaultProps} />);
    
    const cardInfoLines = screen.getAllByTestId('card-info-line');
    expect(cardInfoLines).toHaveLength(5); // location, type, start, end, phase
  });
});