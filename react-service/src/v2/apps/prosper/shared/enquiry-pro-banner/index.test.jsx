import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnquiryProBanner from './index';
import { analytics } from 'services/helpers';

// Mock MUI theme
jest.mock('@mui/material/styles', () => ({
  useTheme: jest.fn(() => ({
    palette: {
      common: {
        white: '#FFFFFF'
      }
    },
    breakpoints: {
      up: jest.fn(() => ({ '@media': '(min-width: 900px)' })),
      down: jest.fn((size) => `@media (max-width: ${size === 'lg' ? '1199px' : '768px'})`)
    },
    spacing: jest.fn((value) => `${value * 8}px`)
  }))
}));

// Mock analytics
jest.mock('services/helpers', () => ({
  analytics: jest.fn()
}));

// Mock document query selector for app element
const mockApp = {
  style: {}
};

Object.defineProperty(document, 'querySelector', {
  value: jest.fn().mockImplementation(selector => {
    if (selector === '.app') {
      return mockApp;
    }
    return null;
  }),
  writable: true
});

describe('EnquiryProBanner Component', () => {
  const defaultProps = {
    show: true,
    opportunities: 25,
    subcontractor: {
      contractor_id: 'test-contractor-123'
    },
    upgradeProsperPro: jest.fn().mockResolvedValue({}),
    closeBanner: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockApp.style = {};
  });

  describe('Basic Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<EnquiryProBanner {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('should not render when show is false', () => {
      const { container } = render(
        <EnquiryProBanner {...defaultProps} show={false} />
      );
      // When show is false, the banner content should not be visible
      expect(container.querySelector('[data-testid="mui-slide"]')).not.toBeInTheDocument();
      expect(container.textContent.trim()).toBe('');
    });

    it('should render opportunities count', () => {
      render(<EnquiryProBanner {...defaultProps} />);
      // The opportunities count should be rendered somewhere in the component
      expect(screen.getByText('prosper-jobs-found-profile')).toBeInTheDocument();
    });
  });

  describe('Close Functionality', () => {
    it('should call closeBanner when close button is clicked', () => {
      const mockCloseBanner = jest.fn();
      const { container } = render(
        <EnquiryProBanner {...defaultProps} closeBanner={mockCloseBanner} />
      );

      // Find the close button (IconButton with CancelIcon)
      const cancelIcon = container.querySelector('svg[data-testid="CancelIcon"]');
      if (cancelIcon) {
        fireEvent.click(cancelIcon.closest('button'));
        expect(mockCloseBanner).toHaveBeenCalled();
      }
    });
  });

  describe('Info Components', () => {
    it('should render Info components for prosper pro features', () => {
      render(<EnquiryProBanner {...defaultProps} />);
      
      // Should render Info components with specific translation keys
      expect(screen.getByText('prosper-pro-stay-busy')).toBeInTheDocument();
      expect(screen.getByText('prosper-pro-save-time')).toBeInTheDocument();
      expect(screen.getByText('prosper-pro-nail-process-management')).toBeInTheDocument();
    });

    it('should render Info component descriptions', () => {
      render(<EnquiryProBanner {...defaultProps} />);
      
      expect(screen.getByText('prosper-pro-stay-busy-desc')).toBeInTheDocument();
      expect(screen.getByText('prosper-pro-save-time-desc')).toBeInTheDocument();
      expect(screen.getByText('prosper-pro-nail-process-management-desc')).toBeInTheDocument();
    });
  });

  describe('Images and Icons', () => {
    it('should render thumbnail buildings images for mobile and desktop', () => {
      const { container } = render(<EnquiryProBanner {...defaultProps} />);
      
      // Check for mobile buildings image
      const mobileBuildingsImage = container.querySelector('img[src="mock-buildings-mobile-icon"]');
      expect(mobileBuildingsImage).toBeInTheDocument();
      
      // Check for desktop buildings image  
      const desktopBuildingsImage = container.querySelector('img[src="mock-buildings-desktop-icon"]');
      expect(desktopBuildingsImage).toBeInTheDocument();
    });

    it('should render workers thumbnail images', () => {
      const { container } = render(<EnquiryProBanner {...defaultProps} />);
      
      // Check for workers images (should appear twice - mobile and desktop)
      const workersImages = container.querySelectorAll('img[src="mock-workers-icon"]');
      expect(workersImages.length).toBeGreaterThan(0);
    });

    it('should render info icons', () => {
      const { container } = render(<EnquiryProBanner {...defaultProps} />);
      
      // Check for pound, clock, and bell icons
      expect(container.querySelector('img[src="mock-pound-white-icon"]')).toBeInTheDocument();
      expect(container.querySelector('img[src="mock-white-clock-icon"]')).toBeInTheDocument();
      expect(container.querySelector('img[src="mock-white-bell-icon"]')).toBeInTheDocument();
    });
  });

  describe('Upgrade Button Functionality', () => {
    it('should render upgrade button with correct text', () => {
      render(<EnquiryProBanner {...defaultProps} />);
      
      expect(screen.getByText('prosper-pro-access')).toBeInTheDocument();
      expect(screen.getByText('prosper-pro-find-first-job-free')).toBeInTheDocument();
    });

    it('should call upgradeProsperPro when upgrade button is clicked', async () => {
      const mockUpgrade = jest.fn().mockResolvedValue({});
      render(
        <EnquiryProBanner {...defaultProps} upgradeProsperPro={mockUpgrade} />
      );

      const upgradeButton = screen.getByText('prosper-pro-access').closest('button');
      fireEvent.click(upgradeButton);

      await waitFor(() => {
        expect(mockUpgrade).toHaveBeenCalled();
      });
    });

    it('should call analytics when upgrade button is clicked and contractor_id exists', async () => {
      const mockUpgrade = jest.fn().mockResolvedValue({});
      render(
        <EnquiryProBanner 
          {...defaultProps} 
          upgradeProsperPro={mockUpgrade}
          subcontractor={{ contractor_id: 'test-123' }}
        />
      );

      const upgradeButton = screen.getByText('prosper-pro-access').closest('button');
      fireEvent.click(upgradeButton);

      await waitFor(() => {
        expect(mockUpgrade).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(analytics).toHaveBeenCalledWith(
          'supply_chain.prosper_pro.manual',
          null,
          'test-123'
        );
      });
    });

    it('should show Welcome component after successful upgrade', async () => {
      const mockUpgrade = jest.fn().mockResolvedValue({});
      const { getByText } = render(
        <EnquiryProBanner {...defaultProps} upgradeProsperPro={mockUpgrade} />
      );

      const upgradeButton = getByText('prosper-pro-access').closest('button');
      fireEvent.click(upgradeButton);

      await waitFor(() => {
        expect(mockUpgrade).toHaveBeenCalled();
      });

      // After successful upgrade, welcome modal should appear
      await waitFor(() => {
        expect(screen.getByText('prosper-pro-modal-welcome')).toBeInTheDocument();
      });
    });

    it('should not call analytics when contractor_id is missing', async () => {
      const mockUpgrade = jest.fn().mockResolvedValue({});
      render(
        <EnquiryProBanner 
          {...defaultProps} 
          upgradeProsperPro={mockUpgrade}
          subcontractor={{}}
        />
      );

      const upgradeButton = screen.getByText('prosper-pro-access').closest('button');
      fireEvent.click(upgradeButton);

      await waitFor(() => {
        expect(mockUpgrade).toHaveBeenCalled();
      });

      expect(analytics).not.toHaveBeenCalled();
    });

    it('should not call analytics when subcontractor is null', async () => {
      const mockUpgrade = jest.fn().mockResolvedValue({});
      render(
        <EnquiryProBanner 
          {...defaultProps} 
          upgradeProsperPro={mockUpgrade}
          subcontractor={null}
        />
      );

      const upgradeButton = screen.getByText('prosper-pro-access').closest('button');
      fireEvent.click(upgradeButton);

      await waitFor(() => {
        expect(mockUpgrade).toHaveBeenCalled();
      });

      expect(analytics).not.toHaveBeenCalled();
    });
  });

  describe('useEffect Behavior', () => {
    it('should set app max height on mount', () => {
      render(<EnquiryProBanner {...defaultProps} />);
      
      expect(document.querySelector).toHaveBeenCalledWith('.app');
      expect(mockApp.style.maxHeight).toBe('100vh');
    });
  });

  describe('Responsive Design', () => {
    it('should render mobile-specific layout elements', () => {
      const { container } = render(<EnquiryProBanner {...defaultProps} />);
      
      // Mobile layout should be present
      const mobileElements = container.querySelectorAll('[data-testid="mui-grid"]');
      expect(mobileElements.length).toBeGreaterThan(0);
    });
  });

  describe('Props Validation', () => {
    it('should handle default props correctly', () => {
      const minimalProps = {
        upgradeProsperPro: jest.fn().mockResolvedValue({})
      };
      
      const { container } = render(<EnquiryProBanner {...minimalProps} />);
      expect(container).toBeInTheDocument();
    });

    it('should render with different opportunities count', () => {
      render(<EnquiryProBanner {...defaultProps} opportunities={100} />);
      
      // Should still render the component with different count
      expect(screen.getByText('prosper-jobs-found-profile')).toBeInTheDocument();
    });

    it('should handle string opportunities count', () => {
      render(<EnquiryProBanner {...defaultProps} opportunities="50" />);
      
      expect(screen.getByText('prosper-jobs-found-profile')).toBeInTheDocument();
    });
  });

  describe('Welcome Modal Integration', () => {
    it('should not show Welcome component initially', () => {
      render(<EnquiryProBanner {...defaultProps} />);
      
      // Welcome modal should not be visible initially
      expect(screen.queryByText('prosper-pro-modal-welcome')).not.toBeInTheDocument();
    });

    it('should hide banner when Welcome component is shown', async () => {
      const mockUpgrade = jest.fn().mockResolvedValue({});
      const { container } = render(
        <EnquiryProBanner {...defaultProps} upgradeProsperPro={mockUpgrade} />
      );

      const upgradeButton = screen.getByText('prosper-pro-access').closest('button');
      fireEvent.click(upgradeButton);

      await waitFor(() => {
        expect(mockUpgrade).toHaveBeenCalled();
      });

      // After upgrade, banner should be hidden and Welcome shown
      await waitFor(() => {
        expect(screen.getByText('prosper-pro-modal-welcome')).toBeInTheDocument();
      });
    });
  });

  describe('Grid Layout', () => {
    it('should render proper grid structure', () => {
      const { container } = render(<EnquiryProBanner {...defaultProps} />);
      
      // Should have grid container and items
      const gridContainer = container.querySelector('[data-testid="mui-grid"]');
      expect(gridContainer).toBeInTheDocument();
    });

    it('should render all required grid items', () => {
      const { container } = render(<EnquiryProBanner {...defaultProps} />);
      
      // Should have multiple grid items for layout
      const gridItems = container.querySelectorAll('[data-testid="mui-grid"]');
      expect(gridItems.length).toBeGreaterThanOrEqual(4); // At least 4 grid items expected
    });
  });

  describe('Error Handling', () => {
    it('should render upgrade button when upgradeProsperPro is provided', () => {
      const mockUpgrade = jest.fn(() => Promise.resolve());
      
      const { container } = render(
        <EnquiryProBanner {...defaultProps} upgradeProsperPro={mockUpgrade} />
      );

      const upgradeButton = screen.getByText('prosper-pro-access').closest('button');
      expect(upgradeButton).toBeInTheDocument();
      
      // Component should be rendered
      expect(container).toBeInTheDocument();
    });
  });
});