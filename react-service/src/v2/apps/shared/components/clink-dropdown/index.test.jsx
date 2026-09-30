import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import CLinkDropdown from './index';

// Mock the clink-components
jest.mock('clink-components', () => ({
  Dropdown: ({ children, content, renderOpenDropdown }) => (
    <div data-testid="dropdown">
      {renderOpenDropdown && renderOpenDropdown({ 
        isOpen: false, 
        align: 'left', 
        handleClick: jest.fn() 
      })}
      {content}
    </div>
  ),
  OpenDropdown: ({ open, handleClick, downIcon, upIcon }) => (
    <button 
      data-testid="open-dropdown" 
      onClick={handleClick}
      aria-label={open ? "Close dropdown" : "Open dropdown"}
    >
      {open ? upIcon : downIcon}
    </button>
  ),
  Image: ({ src, alt }) => <img src={src} alt={alt || "image"} />,
  CONSTANTS: {
    s3: {
      expand: 'test-expand-icon.png'
    },
    colors: {
      general: {
        darkCharcoal: '#333333'
      }
    },
    fonts: {
      proxima: 'Proxima Nova'
    }
  }
}));

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('CLinkDropdown', () => {
  const mockDropdownItems = [
    {
      id: '1',
      label: 'Action Item',
      action: jest.fn()
    },
    {
      id: '2',
      label: 'Link Item',
      link: '/test-link'
    },
    {
      id: '3',
      label: 'New Tab Link',
      link: '/external-link',
      newTab: true
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <TestWrapper>
        <CLinkDropdown />
      </TestWrapper>
    );
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
  });

  it('renders with default props', () => {
    render(
      <TestWrapper>
        <CLinkDropdown />
      </TestWrapper>
    );
    const dropdown = screen.getByTestId('dropdown');
    expect(dropdown).toBeInTheDocument();
    expect(screen.getByTestId('open-dropdown')).toBeInTheDocument();
  });

  it('renders dropdown items correctly', () => {
    render(
      <TestWrapper>
        <CLinkDropdown dropdownItems={mockDropdownItems} />
      </TestWrapper>
    );

    expect(screen.getByText('Action Item')).toBeInTheDocument();
    expect(screen.getByText('Link Item')).toBeInTheDocument();
    expect(screen.getByText('New Tab Link')).toBeInTheDocument();
  });

  it('handles action item clicks', () => {
    render(
      <TestWrapper>
        <CLinkDropdown dropdownItems={mockDropdownItems} />
      </TestWrapper>
    );

    const actionButton = screen.getByText('Action Item');
    fireEvent.click(actionButton);
    
    expect(mockDropdownItems[0].action).toHaveBeenCalledWith('1');
  });

  it('renders with custom props', () => {
    const customProps = {
      xOffset: -100,
      yOffset: 20,
      dropdownContentWidth: 300,
      dropdownImage: 'custom-icon.png',
      dropdownOpenImage: 'custom-open-icon.png',
      alignOptions: 'right',
      dropdownCssClass: 'custom-dropdown'
    };

    render(
      <TestWrapper>
        <CLinkDropdown {...customProps} dropdownItems={mockDropdownItems} />
      </TestWrapper>
    );

    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    // Check if custom CSS class is applied
    const dropdownContent = screen.getByText('Action Item').closest('.dropdown-content');
    expect(dropdownContent).toHaveClass('custom-dropdown');
  });

  it('handles empty dropdown items', () => {
    render(
      <TestWrapper>
        <CLinkDropdown dropdownItems={[]} />
      </TestWrapper>
    );

    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    // Should not render any buttons for items
    const buttons = screen.queryAllByRole('button');
    expect(buttons).toHaveLength(1); // Only the open dropdown button
  });

  it('handles undefined dropdown items', () => {
    render(
      <TestWrapper>
        <CLinkDropdown dropdownItems={undefined} />
      </TestWrapper>
    );

    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
  });

  it('renders buttons for dropdown items with correct structure', () => {
    render(
      <TestWrapper>
        <CLinkDropdown dropdownItems={mockDropdownItems} />
      </TestWrapper>
    );

    const actionButton = screen.getByText('Action Item');
    expect(actionButton).toBeInTheDocument();
    expect(actionButton.tagName).toBe('BUTTON');
  });
});