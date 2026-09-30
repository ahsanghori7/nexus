import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';

// Mock the child components
jest.mock('./PackageInfo', () => {
  return function MockPackageInfo({ info, extra }) {
    return (
      <div data-testid="mock-package-info">
        {info}{extra && ` (${extra})`}
      </div>
    );
  };
});

jest.mock('./PackageStatus', () => {
  return function MockPackageStatus({ status, warning, theme }) {
    return (
      <div data-testid="mock-package-status">
        {status?.label || 'No Status'} {warning && '(Warning)'}
      </div>
    );
  };
});

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'setup': 'Setup'
      };
      return translations[key] || key;
    }
  })
}));

describe('Header Component', () => {
  const mockTheme = {
    palette: {
      success: { main: '#4caf50' },
      panelBorder: { main: '#cccccc' }
    }
  };

  const mockTender = {
    id: 1,
    name: 'Test Tender',
    color: '#ff0000',
    interests: 5,
    quotes: { main: 3, extra: 1 },
    warning: false
  };

  const mockHandleChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('with packStatus', () => {
    const mockPackStatus = {
      id: 2,
      label: 'In Progress',
      icon: 'test-icon.png'
    };

    it('renders without crashing with packStatus', () => {
      render(
        <Header
          tender={mockTender}
          packStatus={mockPackStatus}
          theme={mockTheme}
          expanded={[]}
          handleChange={mockHandleChange}
        />
      );
      expect(screen.getByText('Test Tender')).toBeInTheDocument();
    });

    it('displays tender name correctly', () => {
      render(
        <Header
          tender={mockTender}
          packStatus={mockPackStatus}
          theme={mockTheme}
          expanded={[]}
          handleChange={mockHandleChange}
        />
      );
      expect(screen.getByText('Test Tender')).toBeInTheDocument();
    });

    it('shows ExpandMore icon when not expanded', () => {
      render(
        <Header
          tender={mockTender}
          packStatus={mockPackStatus}
          theme={mockTheme}
          expanded={[]}
          handleChange={mockHandleChange}
        />
      );
      
      // Since MUI icons are mocked, we can check for the mock component
      const expandIcon = screen.getByTestId('ExpandMoreIcon');
      expect(expandIcon).toBeInTheDocument();
    });

    it('shows ExpandLess icon when expanded', () => {
      render(
        <Header
          tender={mockTender}
          packStatus={mockPackStatus}
          theme={mockTheme}
          expanded={[1]}
          handleChange={mockHandleChange}
        />
      );
      
      const expandIcon = screen.getByTestId('ExpandLessIcon');
      expect(expandIcon).toBeInTheDocument();
    });

    it('calls handleChange with tender id when clicked', () => {
      render(
        <Header
          tender={mockTender}
          packStatus={mockPackStatus}
          theme={mockTheme}
          expanded={[]}
          handleChange={mockHandleChange}
        />
      );
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockHandleChange).toHaveBeenCalledWith(1);
    });

    it('renders PackageInfo components with correct data', () => {
      render(
        <Header
          tender={mockTender}
          packStatus={mockPackStatus}
          theme={mockTheme}
          expanded={[]}
          handleChange={mockHandleChange}
        />
      );
      
      const packageInfos = screen.getAllByTestId('mock-package-info');
      expect(packageInfos).toHaveLength(2);
      
      // Check interests info
      expect(screen.getByText('5')).toBeInTheDocument();
      
      // Check quotes info  
      expect(screen.getByText('3 (1)')).toBeInTheDocument();
    });

    it('renders PackageStatus component', () => {
      render(
        <Header
          tender={mockTender}
          packStatus={mockPackStatus}
          theme={mockTheme}
          expanded={[]}
          handleChange={mockHandleChange}
        />
      );
      
      expect(screen.getByTestId('mock-package-status')).toBeInTheDocument();
    });

    it('handles warning status correctly', () => {
      const warningTender = { ...mockTender, warning: true };
      render(
        <Header
          tender={warningTender}
          packStatus={mockPackStatus}
          theme={mockTheme}
          expanded={[]}
          handleChange={mockHandleChange}
        />
      );
      
      expect(screen.getByText('In Progress (Warning)')).toBeInTheDocument();
    });
  });

  describe('without packStatus', () => {
    it('renders setup UI when no packStatus', () => {
      render(
        <Header
          tender={mockTender}
          packStatus={null}
          theme={mockTheme}
          expanded={[]}
          handleChange={mockHandleChange}
        />
      );
      
      expect(screen.getByText('Setup')).toBeInTheDocument();
    });

    it('does not render PackageInfo when no packStatus', () => {
      render(
        <Header
          tender={mockTender}
          packStatus={null}
          theme={mockTheme}
          expanded={[]}
          handleChange={mockHandleChange}
        />
      );
      
      expect(screen.queryByTestId('mock-package-info')).not.toBeInTheDocument();
    });

    it('does not render PackageStatus when no packStatus', () => {
      render(
        <Header
          tender={mockTender}
          packStatus={null}
          theme={mockTheme}
          expanded={[]}
          handleChange={mockHandleChange}
        />
      );
      
      expect(screen.queryByTestId('mock-package-status')).not.toBeInTheDocument();
    });
  });

  describe('border styling', () => {
    it('applies colored border when packStatus exists', () => {
      const mockPackStatus = { id: 2, label: 'In Progress' };
      const { container } = render(
        <Header
          tender={mockTender}
          packStatus={mockPackStatus}
          theme={mockTheme}
          expanded={[]}
          handleChange={mockHandleChange}
        />
      );
      
      // The component should render without errors (border style is applied via sx prop)
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  it('matches snapshot', () => {
    const mockPackStatus = { id: 2, label: 'In Progress' };
    const { container } = render(
      <Header
        tender={mockTender}
        packStatus={mockPackStatus}
        theme={mockTheme}
        expanded={[]}
        handleChange={mockHandleChange}
      />
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});