import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import CLinkDropdown from './index';

// Mock the URL helpers
const mockGoTo = jest.fn();
const mockGoToNewTab = jest.fn();

// Import and get reference to the mocked functions
import * as urlHelpers from 'v2/helpers/url';
urlHelpers.goTo = mockGoTo;
urlHelpers.goToNewTab = mockGoToNewTab;

// Mock styled components
jest.mock('./styled', () => ({
  StyledDropdownContent: ({ children, className }) => (
    <div data-testid="styled-dropdown-content" className={className}>
      {children}
    </div>
  ),
  StyledDropdownInterfaceDesktop: ({ children }) => (
    <div data-testid="styled-dropdown-interface">
      {children}
    </div>
  ),
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  Dropdown: ({ children, renderOpenDropdown, content, ...props }) => (
    <div data-testid="dropdown" {...props}>
      {renderOpenDropdown && renderOpenDropdown({ 
        isOpen: false, 
        align: 'left', 
        handleClick: jest.fn(),
        handleOnMouseOver: jest.fn()
      })}
      <div data-testid="dropdown-content">{content}</div>
    </div>
  ),
  OpenDropdown: ({ downIcon, upIcon }) => (
    <div data-testid="open-dropdown">
      <div data-testid="down-icon">{downIcon}</div>
      <div data-testid="up-icon">{upIcon}</div>
    </div>
  ),
  Button: ({ children, handleClick, ...props }) => (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  ),
}));

describe('CLinkDropdown', () => {
  beforeEach(() => {
    mockGoTo.mockClear();
    mockGoToNewTab.mockClear();
  });
  const defaultProps = {
    dropdownName: 'Test Dropdown',
    imageSrc: 'test-image.png',
    imageSrcHover: 'test-image-hover.png',
  };

  it('renders without crashing', () => {
    render(<CLinkDropdown {...defaultProps} />);
    
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
    expect(screen.getAllByText('Test Dropdown')).toHaveLength(2);
  });

  it('applies default props correctly', () => {
    render(<CLinkDropdown {...defaultProps} />);
    
    const dropdown = screen.getByTestId('dropdown');
    expect(dropdown).toBeInTheDocument();
  });

  it('renders dropdown items when provided', () => {
    const dropdownItems = [
      { id: 1, label: 'Item 1' },
      { id: 2, label: 'Item 2' },
    ];

    render(<CLinkDropdown {...defaultProps} dropdownItems={dropdownItems} />);
    
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('handles empty dropdown items array', () => {
    render(<CLinkDropdown {...defaultProps} dropdownItems={[]} />);
    
    const dropdownContent = screen.getByTestId('styled-dropdown-content');
    expect(dropdownContent).toBeEmptyDOMElement();
  });

  it('handles undefined dropdown items', () => {
    render(<CLinkDropdown {...defaultProps} />);
    
    const dropdownContent = screen.getByTestId('styled-dropdown-content');
    expect(dropdownContent).toBeEmptyDOMElement();
  });

  it('renders dropdown name in styled interface', () => {
    render(<CLinkDropdown {...defaultProps} />);
    
    const styledInterfaces = screen.getAllByTestId('styled-dropdown-interface');
    expect(styledInterfaces.length).toBeGreaterThan(0);
    
    // Check that at least one contains the dropdown name
    const hasDropdownName = styledInterfaces.some(
      element => element.textContent === 'Test Dropdown'
    );
    expect(hasDropdownName).toBe(true);
  });

  it('passes custom props to dropdown component', () => {
    const customProps = {
      ...defaultProps,
      xOffset: -200,
      yOffset: 15,
      dropdownContentWidth: 250,
      alignOptions: 'right',
    };

    render(<CLinkDropdown {...customProps} />);
    
    const dropdown = screen.getByTestId('dropdown');
    expect(dropdown).toHaveAttribute('xoffset', '-200');
    expect(dropdown).toHaveAttribute('yoffset', '15');
    expect(dropdown).toHaveAttribute('dropdowncontentwidth', '250');
  });

  it('renders buttons with correct alignment prop', () => {
    const dropdownItems = [
      { id: 1, label: 'Item 1' },
    ];

    render(
      <CLinkDropdown 
        {...defaultProps} 
        dropdownItems={dropdownItems}
        alignOptions="center"
      />
    );
    
    const button = screen.getByText('Item 1');
    expect(button).toHaveAttribute('align', 'center');
  });

  it('renders buttons with dropdown layout', () => {
    const dropdownItems = [
      { id: 1, label: 'Item 1' },
    ];

    render(<CLinkDropdown {...defaultProps} dropdownItems={dropdownItems} />);
    
    const button = screen.getByText('Item 1');
    expect(button).toHaveAttribute('layout', 'dropdown');
  });

  it('handles button clicks with action', () => {
    const mockAction = jest.fn();
    const dropdownItems = [
      {
        id: 1,
        label: 'Action Item',
        action: mockAction
      }
    ];

    render(<CLinkDropdown {...defaultProps} dropdownItems={dropdownItems} />);
    
    const button = screen.getByText('Action Item');
    fireEvent.click(button);
    
    expect(mockAction).toHaveBeenCalledWith(1);
  });

  it('handles button clicks with link navigation', () => {
    const dropdownItems = [
      {
        id: 1,
        label: 'Link Item',
        link: '/test-link'
      }
    ];

    render(<CLinkDropdown {...defaultProps} dropdownItems={dropdownItems} />);
    
    const button = screen.getByText('Link Item');
    fireEvent.click(button);
    
    expect(mockGoTo).toHaveBeenCalledWith('/test-link');
  });

  it('handles button clicks with new tab navigation', () => {
    const dropdownItems = [
      {
        id: 1,
        label: 'New Tab Item',
        link: '/test-link',
        newTab: true
      }
    ];

    render(<CLinkDropdown {...defaultProps} dropdownItems={dropdownItems} />);
    
    const button = screen.getByText('New Tab Item');
    fireEvent.click(button);
    
    expect(mockGoToNewTab).toHaveBeenCalledWith('/test-link');
  });

  it('handles button clicks with both action and link (action takes priority)', () => {
    const mockAction = jest.fn();
    const dropdownItems = [
      {
        id: 1,
        label: 'Both Action And Link',
        action: mockAction,
        link: '/test-link'
      }
    ];

    render(<CLinkDropdown {...defaultProps} dropdownItems={dropdownItems} />);
    
    const button = screen.getByText('Both Action And Link');
    fireEvent.click(button);
    
    expect(mockAction).toHaveBeenCalledWith(1);
    expect(mockGoTo).toHaveBeenCalledWith('/test-link');
  });
});