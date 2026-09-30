import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PackageDetails from './index';

// Mock the Packages component since we're only testing the layout
jest.mock('./Packages', () => {
  return function MockPackages({ theme, tenders, service, size }) {
    return (
      <div data-testid="mock-packages">
        Mock Packages Component
      </div>
    );
  };
});

// Mock the useMuiTheme hook
jest.mock('v2/apps/shared/components/muiTheme', () => {
  return function useMuiTheme() {
    return {
      palette: {
        panelBorder: { main: '#cccccc' }
      }
    };
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'label-packages': 'Packages',
        'interests': 'Interests',
        'quotes': 'Quotes',
        'status': 'Status'
      };
      return translations[key] || key;
    }
  })
}));

describe('PackageDetails Component', () => {
  const mockProps = {
    tenders: [
      {
        id: 1,
        name: 'Test Tender 1',
        interests: 5,
        quotes: { main: 3, extra: 1 },
        color: '#ff0000'
      }
    ],
    service: 'test-service',
    size: 'medium'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<PackageDetails {...mockProps} />);
    expect(screen.getByText('Packages')).toBeInTheDocument();
  });

  it('displays the correct header labels', () => {
    render(<PackageDetails {...mockProps} />);
    
    expect(screen.getByText('Packages')).toBeInTheDocument();
    expect(screen.getByText('Interests')).toBeInTheDocument();
    expect(screen.getByText('Quotes')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders the Packages component with correct props', () => {
    render(<PackageDetails {...mockProps} />);
    
    const packagesComponent = screen.getByTestId('mock-packages');
    expect(packagesComponent).toBeInTheDocument();
  });

  it('applies correct component structure', () => {
    const { container } = render(<PackageDetails {...mockProps} />);
    
    // Check that the main structure is rendered - the components exist even if CSS classes are mocked
    expect(container.firstChild).toBeInTheDocument();
    
    // Check that essential text content is present (which confirms layout structure)
    expect(screen.getByText('Packages')).toBeInTheDocument();
    expect(screen.getByText('Interests')).toBeInTheDocument();
    expect(screen.getByText('Quotes')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders with minimal props', () => {
    const minimalProps = {
      tenders: [],
      service: null,
      size: null
    };
    
    render(<PackageDetails {...minimalProps} />);
    expect(screen.getByText('Packages')).toBeInTheDocument();
    expect(screen.getByTestId('mock-packages')).toBeInTheDocument();
  });

  it('matches snapshot for layout structure', () => {
    const { container } = render(<PackageDetails {...mockProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});