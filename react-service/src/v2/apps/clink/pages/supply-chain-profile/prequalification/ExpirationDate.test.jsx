import React from 'react';
import { render, screen } from '@testing-library/react';
import ExpirationDate from './ExpirationDate';

// Mock dependencies
jest.mock('moment', () => {
  return (date) => ({
    format: (pattern) => {
      const d = new Date(date);
      if (pattern === 'DD/MM/YYYY') {
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      }
      return date;
    }
  });
});

jest.mock('v2/helpers/i18n', () => ({
  t: (key) => {
    const translations = {
      'expired-since': 'Expired since',
      'expires-on': 'Expires on',
      'not-provided': 'Not provided'
    };
    return translations[key] || key;
  }
}));

jest.mock('v2/helpers/date', () => ({
  expiredDate: (date) => {
    // Mock expiredDate to return true if date is before today
    return date < new Date();
  }
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        bostonRed: '#FF0000',
        darkCharcoal: '#333333'
      }
    }
  }
}));

// Mock MUI components
jest.mock('@mui/material/Typography', () => {
  return function MockTypography({ component, sx, children }) {
    return (
      <div 
        data-testid="typography"
        data-component={component}
        style={sx}
      >
        {children}
      </div>
    );
  };
});

jest.mock('@mui/material/Box', () => {
  return function MockBox({ children }) {
    return <div data-testid="box">{children}</div>;
  };
});

describe('ExpirationDate', () => {
  const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  it('should render with future date (not expired)', () => {
    render(<ExpirationDate date={futureDate.toISOString()} />);
    
    expect(screen.getByText('Expires on')).toBeInTheDocument();
    expect(screen.getByText(/\d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument();
  });

  it('should render with past date (expired)', () => {
    render(<ExpirationDate date={pastDate.toISOString()} />);
    
    expect(screen.getByText('Expired since')).toBeInTheDocument();
    expect(screen.getByText(/\d{2}\/\d{2}\/\d{4}/)).toBeInTheDocument();
  });

  it('should render with no date provided', () => {
    render(<ExpirationDate />);
    
    expect(screen.getByText('Not provided')).toBeInTheDocument();
  });

  it('should render with label when provided', () => {
    render(<ExpirationDate label="Expiration Date" date={futureDate.toISOString()} />);
    
    const box = screen.getByTestId('box');
    expect(box).toBeInTheDocument();
    expect(screen.getByText('Expiration Date')).toBeInTheDocument();
    expect(screen.getByText('Expires on')).toBeInTheDocument();
  });

  it('should render without label when label is false', () => {
    render(<ExpirationDate label={false} date={futureDate.toISOString()} />);
    
    const boxes = screen.queryAllByTestId('box');
    expect(boxes).toHaveLength(0);
    expect(screen.getByText('Expires on')).toBeInTheDocument();
  });

  it('should use custom labels when provided', () => {
    render(
      <ExpirationDate 
        date={pastDate.toISOString()}
        expiredLabel="Custom Expired"
        expiresOnLabel="Custom Expires"
      />
    );
    
    expect(screen.getByText('Custom Expired')).toBeInTheDocument();
  });

  it('should render formatted date correctly', () => {
    const testDate = new Date('2023-12-25');
    render(<ExpirationDate date={testDate.toISOString()} />);
    
    expect(screen.getByText('25/12/2023')).toBeInTheDocument();
  });

  it('should handle null date', () => {
    render(<ExpirationDate date={null} />);
    
    expect(screen.getByText('Not provided')).toBeInTheDocument();
  });

  it('should handle empty string date', () => {
    render(<ExpirationDate date="" />);
    
    expect(screen.getByText('Not provided')).toBeInTheDocument();
  });

  it('should apply correct styling for expired dates', () => {
    render(<ExpirationDate date={pastDate.toISOString()} />);
    
    const typographies = screen.getAllByTestId('typography');
    const expiredLabel = typographies.find(t => t.textContent === 'Expired since');
    expect(expiredLabel).toHaveStyle({ color: '#FF0000' });
  });

  it('should apply correct styling for non-expired dates', () => {
    render(<ExpirationDate date={futureDate.toISOString()} />);
    
    const typographies = screen.getAllByTestId('typography');
    const expiresLabel = typographies.find(t => t.textContent === 'Expires on');
    expect(expiresLabel).toHaveStyle({ color: '#333333' });
  });
});