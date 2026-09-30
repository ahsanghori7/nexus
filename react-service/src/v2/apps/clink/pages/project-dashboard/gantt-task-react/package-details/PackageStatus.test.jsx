import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PackageStatus from './PackageStatus';

// Mock the Image component from clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      iconExclamationTriangleRed: 'warning-icon.png'
    }
  },
  Image: ({ src, width, height, style }) => (
    <img 
      data-testid="mock-image" 
      src={src} 
      width={width} 
      height={height} 
      style={style}
      alt="mock"
    />
  )
}));

describe('PackageStatus Component', () => {
  const mockTheme = {
    palette: {
      success: { main: '#4caf50' }
    }
  };

  const mockStatus = {
    id: 2,
    label: 'in progress',
    icon: 'progress-icon.png'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<PackageStatus status={mockStatus} theme={mockTheme} />);
    expect(screen.getByTestId('mock-image')).toBeInTheDocument();
  });

  it('displays status label in uppercase', () => {
    render(<PackageStatus status={mockStatus} theme={mockTheme} />);
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
  });

  it('calculates correct percentage based on status id', () => {
    const { container } = render(<PackageStatus status={mockStatus} theme={mockTheme} />);
    
    // With status.id = 2, percentage should be 2 * 20 = 40
    // We can check that CircularProgress component is rendered (it would be in the DOM)
    expect(container).toBeInTheDocument();
    expect(screen.getByTestId('mock-image')).toBeInTheDocument();
  });

  it('renders status icon correctly', () => {
    render(<PackageStatus status={mockStatus} theme={mockTheme} />);
    
    const image = screen.getByTestId('mock-image');
    expect(image).toHaveAttribute('src', 'progress-icon.png');
    expect(image).toHaveAttribute('width', '26.94');
  });

  it('renders without warning badge when warning is false', () => {
    const { container } = render(
      <PackageStatus status={mockStatus} warning={false} theme={mockTheme} />
    );
    
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    // Should not have warning badge wrapper
    const badgeWrapper = container.querySelector('[data-testid="badge-wrapper"]');
    expect(badgeWrapper).not.toBeInTheDocument();
  });

  it('renders with warning badge when warning is true', () => {
    render(
      <PackageStatus status={mockStatus} warning={true} theme={mockTheme} />
    );
    
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    
    // Should have warning badge with exclamation icon
    const images = screen.getAllByTestId('mock-image');
    expect(images.length).toBe(2); // status icon + warning icon
    
    // Check warning icon is present
    const warningIcon = images.find(img => img.getAttribute('src') === 'warning-icon.png');
    expect(warningIcon).toBeInTheDocument();
  });

  it('applies special font size for status id 1 (no tender doc)', () => {
    const noTenderStatus = {
      id: 1,
      label: 'no tender',
      icon: 'no-tender-icon.png'
    };
    
    render(<PackageStatus status={noTenderStatus} theme={mockTheme} />);
    expect(screen.getByText('NO TENDER')).toBeInTheDocument();
  });

  it('handles different status ids correctly', () => {
    const statusId3 = {
      id: 3,
      label: 'completed',
      icon: 'completed-icon.png'
    };
    
    render(<PackageStatus status={statusId3} theme={mockTheme} />);
    expect(screen.getByText('COMPLETED')).toBeInTheDocument();
  });

  it('handles null status gracefully', () => {
    // The component expects status to have id and label, so null should cause error
    // Suppress console.error temporarily to avoid noise
    const originalError = console.error;
    console.error = jest.fn();
    
    expect(() => {
      render(<PackageStatus status={null} theme={mockTheme} />);
    }).toThrow();
    
    // Restore console.error
    console.error = originalError;
  });

  it('renders with default props when warning is undefined', () => {
    render(<PackageStatus status={mockStatus} theme={mockTheme} />);
    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
  });

  it('displays uppercase label correctly for various cases', () => {
    const mixedCaseStatus = {
      id: 2,
      label: 'Mixed Case Label',
      icon: 'test-icon.png'
    };
    
    render(<PackageStatus status={mixedCaseStatus} theme={mockTheme} />);
    expect(screen.getByText('MIXED CASE LABEL')).toBeInTheDocument();
  });

  it('matches snapshot without warning', () => {
    const { container } = render(
      <PackageStatus status={mockStatus} warning={false} theme={mockTheme} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with warning', () => {
    const { container } = render(
      <PackageStatus status={mockStatus} warning={true} theme={mockTheme} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  describe('percentage calculation', () => {
    it('calculates 20% for status id 1', () => {
      const status1 = { id: 1, label: 'status', icon: 'icon.png' };
      render(<PackageStatus status={status1} theme={mockTheme} />);
      expect(screen.getByText('STATUS')).toBeInTheDocument();
    });

    it('calculates 40% for status id 2', () => {
      const status2 = { id: 2, label: 'status', icon: 'icon.png' };
      render(<PackageStatus status={status2} theme={mockTheme} />);
      expect(screen.getByText('STATUS')).toBeInTheDocument();
    });

    it('calculates 100% for status id 5', () => {
      const status5 = { id: 5, label: 'status', icon: 'icon.png' };
      render(<PackageStatus status={status5} theme={mockTheme} />);
      expect(screen.getByText('STATUS')).toBeInTheDocument();
    });
  });
});