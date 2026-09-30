import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ActionsDropdown from './ActionsDropdown';

// Mock content for testing
const mockContent = (
  <div data-testid="dropdown-test-content">
    <button>Action 1</button>
    <button>Action 2</button>
  </div>
);

describe('ActionsDropdown', () => {
  it('renders without crashing', () => {
    render(<ActionsDropdown content={mockContent} />);
    
    expect(screen.getByTestId('justify')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
  });

  it('renders with default props', () => {
    render(<ActionsDropdown content={mockContent} />);
    
    const dropdown = screen.getByTestId('dropdown');
    expect(dropdown).toHaveClass('dropdown');
    
    // Check that default icons are used
    const openDropdown = screen.getByTestId('open-dropdown');
    expect(openDropdown).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    const customClass = 'custom-dropdown-class';
    render(<ActionsDropdown content={mockContent} className={customClass} />);
    
    const dropdown = screen.getByTestId('dropdown');
    expect(dropdown).toHaveClass('dropdown', customClass);
  });

  it('renders with custom icons', () => {
    const customDownIcon = 'custom-down-icon.svg';
    const customUpIcon = 'custom-up-icon.svg';
    
    render(
      <ActionsDropdown 
        content={mockContent}
        downIcon={customDownIcon}
        upIcon={customUpIcon}
      />
    );
    
    const openDropdown = screen.getByTestId('open-dropdown');
    expect(openDropdown).toBeInTheDocument();
  });

  it('handles dropdown toggle interaction', () => {
    render(<ActionsDropdown content={mockContent} />);
    
    const openDropdown = screen.getByTestId('open-dropdown');
    
    // Initially dropdown should be closed
    expect(screen.queryByTestId('dropdown-content')).not.toBeInTheDocument();
    
    // Click to open dropdown
    fireEvent.click(openDropdown);
    expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-test-content')).toBeInTheDocument();
    
    // Click again to close dropdown
    fireEvent.click(openDropdown);
    expect(screen.queryByTestId('dropdown-content')).not.toBeInTheDocument();
  });

  it('passes xOffset prop to Dropdown component', () => {
    render(<ActionsDropdown content={mockContent} />);
    
    const dropdown = screen.getByTestId('dropdown');
    expect(dropdown).toBeInTheDocument();
  });

  it('renders complex content correctly', () => {
    const complexContent = (
      <div data-testid="complex-content">
        <ul>
          <li><button>Edit</button></li>
          <li><button>Delete</button></li>
          <li><button>Share</button></li>
        </ul>
      </div>
    );
    
    render(<ActionsDropdown content={complexContent} />);
    
    const openDropdown = screen.getByTestId('open-dropdown');
    fireEvent.click(openDropdown);
    
    expect(screen.getByTestId('complex-content')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  it('maintains proper structure with Justify wrapper', () => {
    render(<ActionsDropdown content={mockContent} />);
    
    const justify = screen.getByTestId('justify');
    const dropdown = screen.getByTestId('dropdown');
    
    expect(justify).toContainElement(dropdown);
  });

  it('handles empty content gracefully', () => {
    const emptyContent = <div data-testid="empty-content"></div>;
    render(<ActionsDropdown content={emptyContent} />);
    
    expect(screen.getByTestId('justify')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
  });

  it('snapshot test for default rendering', () => {
    const { container } = render(<ActionsDropdown content={mockContent} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});