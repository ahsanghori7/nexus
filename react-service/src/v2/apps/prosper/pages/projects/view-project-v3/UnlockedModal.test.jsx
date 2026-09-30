import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import UnlockedModal from './UnlockedModal';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'enquiries-quotes': 'Enquiries & Quotes',
        'project-unlocked': 'Project Unlocked',
        'project-unlocked-text': 'Project has been unlocked successfully',
        'close': 'Close'
      };
      return translations[key] || key;
    }
  })
}));

// Mock url helper
jest.mock('v2/helpers/url', () => ({
  getUrl: (app, path) => `/${app}${path}`
}));

describe('UnlockedModal', () => {
  const defaultProps = {
    open: true,
    setOpen: jest.fn(),
    reduceInfoToken: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing when open', () => {
    render(<UnlockedModal {...defaultProps} />);
    
    expect(screen.getByText('Project Unlocked')).toBeInTheDocument();
    expect(screen.getByText('Project has been unlocked successfully')).toBeInTheDocument();
    expect(screen.getByText('Close')).toBeInTheDocument();
  });

  it('does not render modal content when closed', () => {
    render(<UnlockedModal {...defaultProps} open={false} />);
    
    // Modal content should not be visible when closed
    expect(screen.queryByText('Project Unlocked')).not.toBeInTheDocument();
  });

  it('renders the enquiries link correctly', () => {
    render(<UnlockedModal {...defaultProps} />);
    
    const link = screen.getByText('enquiries & quotes');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/prosper/resources');
  });

  it('calls setOpen when modal is closed', () => {
    const mockSetOpen = jest.fn();
    render(<UnlockedModal {...defaultProps} setOpen={mockSetOpen} />);
    
    // Find and click the close button
    const closeButton = screen.getByText('Close');
    fireEvent.click(closeButton);
    
    expect(mockSetOpen).toHaveBeenCalled();
  });

  it('calls reduceInfoToken and setOpen when confirm button is clicked', () => {
    const mockSetOpen = jest.fn();
    const mockReduceInfoToken = jest.fn();
    
    render(
      <UnlockedModal 
        {...defaultProps} 
        setOpen={mockSetOpen} 
        reduceInfoToken={mockReduceInfoToken} 
      />
    );
    
    // Find and click the confirm button (close button in this case)
    const confirmButton = screen.getByText('Close');
    fireEvent.click(confirmButton);
    
    expect(mockReduceInfoToken).toHaveBeenCalled();
    expect(mockSetOpen).toHaveBeenCalled();
  });

  it('handles default props correctly', () => {
    // Test with minimal props to ensure defaults work
    render(<UnlockedModal reduceInfoToken={jest.fn()} />);
    
    // Should not crash and should handle defaults
    expect(screen.queryByText('Project Unlocked')).not.toBeInTheDocument();
  });
});