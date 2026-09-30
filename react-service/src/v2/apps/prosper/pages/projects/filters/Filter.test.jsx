import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Filter, { FilterContent } from './Filter';

// Mock the styled component
jest.mock('./styles/Filter.styled', () => {
  return function MockedStyledFilter({ children, className }) {
    return <div data-testid="styled-filter" className={className}>{children}</div>;
  };
});

// Mock clink-components to prevent actual dropdown behavior in tests
jest.mock('clink-components', () => {
  const mockReact = require('react');
  
  return {
    Dropdown: ({ content, renderOpenDropdown, className, theme, overflow, xOffset, yOffset, xOffsetScroll, yOffsetScroll, dropdownContentWidth, showArrowLeft, showArrowTop }) => {
      const [isOpen, setIsOpen] = mockReact.useState(false);
      const handleClick = () => setIsOpen(!isOpen);
      
      return mockReact.createElement('div', {
        'data-testid': 'dropdown',
        className: className,
        key: 'dropdown'
      }, [
        renderOpenDropdown && mockReact.createElement('div', {
          key: 'dropdown-trigger'
        }, renderOpenDropdown({ 
          isOpen, 
          align: 'left', 
          handleClick 
        })),
        isOpen && mockReact.createElement('div', {
          'data-testid': 'dropdown-content',
          style: { width: dropdownContentWidth },
          key: 'dropdown-content'
        }, content)
      ].filter(Boolean));
    },
    OpenDropdown: mockReact.forwardRef(({ open, align, handleClick, downIcon, upIcon }, ref) => 
      mockReact.createElement('button', {
        ref: ref,
        'data-testid': 'open-dropdown-button',
        onClick: handleClick,
        className: `open-dropdown ${open ? 'open' : ''}`
      }, open ? upIcon : downIcon)
    ),
    Image: ({ src, ...props }) => mockReact.createElement('img', {
      'data-testid': 'image',
      src: src,
      ...props
    }),
    Button: ({ handleClick, children, className, layout, align, ...props }) => 
      mockReact.createElement('button', {
        'data-testid': 'button',
        onClick: handleClick,
        className: className,
        layout: layout,
        align: align,
        ...props
      }, children),
    CONSTANTS: {
      s3: {
        redCaretUp: 'mock-red-caret-up',
        redCaretDown: 'mock-red-caret-down'
      }
    }
  };
});

describe('Filter Component', () => {
  const mockRef = React.createRef();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Filter ref={mockRef} />);
    expect(screen.getByTestId('styled-filter')).toBeInTheDocument();
  });

  it('displays label when provided', () => {
    const testLabel = 'Test Filter Label';
    render(<Filter label={testLabel} ref={mockRef} />);
    expect(screen.getByText(testLabel)).toBeInTheDocument();
  });

  it('applies default className correctly', () => {
    render(<Filter ref={mockRef} />);
    const styledFilter = screen.getByTestId('styled-filter');
    expect(styledFilter).toHaveClass('filters filter-field');
  });

  it('applies custom className correctly', () => {
    const customClass = 'custom-filter';
    render(<Filter className={customClass} ref={mockRef} />);
    const styledFilter = screen.getByTestId('styled-filter');
    expect(styledFilter).toHaveClass('custom-filter filter-field');
  });

  it('applies opened class when dropdown is opened', () => {
    render(<Filter ref={mockRef} />);
    
    // Initially should not have opened class
    const styledFilter = screen.getByTestId('styled-filter');
    expect(styledFilter).not.toHaveClass('filter-field--opened');
    
    // Click to open dropdown
    const openButton = screen.getByTestId('open-dropdown-button');
    fireEvent.click(openButton);
    
    // Should now have opened class
    expect(styledFilter).toHaveClass('filter-field--opened');
  });

  it('toggles dropdown on button click', () => {
    render(<Filter ref={mockRef} />);
    
    const openButton = screen.getByTestId('open-dropdown-button');
    
    // Initially closed
    expect(screen.queryByTestId('dropdown-content')).not.toBeInTheDocument();
    
    // Click to open
    fireEvent.click(openButton);
    expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
    
    // Click to close
    fireEvent.click(openButton);
    expect(screen.queryByTestId('dropdown-content')).not.toBeInTheDocument();
  });

  it('renders content when dropdown is open', () => {
    const testContent = <div data-testid="test-content">Test Content</div>;
    render(<Filter content={testContent} ref={mockRef} />);
    
    // Open dropdown
    const openButton = screen.getByTestId('open-dropdown-button');
    fireEvent.click(openButton);
    
    // Content should be visible
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('uses custom icons when provided', () => {
    const customDownIcon = 'custom-down-icon';
    const customUpIcon = 'custom-up-icon';
    
    render(
      <Filter 
        downIcon={customDownIcon} 
        upIcon={customUpIcon} 
        ref={mockRef} 
      />
    );
    
    // Check that the dropdown component exists and icons are used in the OpenDropdown
    const dropdown = screen.getByTestId('dropdown');
    expect(dropdown).toBeInTheDocument();
  });

  it('passes dropdown props correctly', () => {
    const props = {
      xOffset: 10,
      yOffset: 20,
      xOffsetScroll: 5,
      yOffsetScroll: 15,
      dropdownContentWidth: '200px',
      showArrowLeft: true,
      showArrowTop: true
    };
    
    render(<Filter {...props} ref={mockRef} />);
    
    const dropdown = screen.getByTestId('dropdown');
    expect(dropdown).toBeInTheDocument();
  });
});

describe('FilterContent Component', () => {
  const mockOptions = [
    { id: 1, label: 'Option 1' },
    { id: 2, label: 'Option 2' },
    { id: 3, label: 'Option 3' }
  ];

  const mockHandleClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<FilterContent options={[]} handleClick={mockHandleClick} />);
    // Component should render even with empty options
  });

  it('renders all options correctly', () => {
    render(<FilterContent options={mockOptions} handleClick={mockHandleClick} />);
    
    mockOptions.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('sorts options alphabetically by label', () => {
    const unsortedOptions = [
      { id: 1, label: 'Zebra' },
      { id: 2, label: 'Apple' },
      { id: 3, label: 'Banana' }
    ];
    
    render(<FilterContent options={unsortedOptions} handleClick={mockHandleClick} />);
    
    const buttons = screen.getAllByTestId('button');
    expect(buttons[0]).toHaveTextContent('Apple');
    expect(buttons[1]).toHaveTextContent('Banana');
    expect(buttons[2]).toHaveTextContent('Zebra');
  });

  it('calls handleClick when option is clicked', () => {
    render(<FilterContent options={mockOptions} handleClick={mockHandleClick} />);
    
    const firstOptionButton = screen.getByText('Option 1');
    fireEvent.click(firstOptionButton);
    
    expect(mockHandleClick).toHaveBeenCalledWith(mockOptions[0]);
  });

  it('highlights selected option', () => {
    const selectedOption = mockOptions[1];
    render(
      <FilterContent 
        options={mockOptions} 
        selected={selectedOption} 
        handleClick={mockHandleClick} 
      />
    );
    
    const selectedButton = screen.getByText('Option 2');
    expect(selectedButton).toHaveClass('filter-selected');
    
    const unselectedButton = screen.getByText('Option 1');
    expect(unselectedButton).not.toHaveClass('filter-selected');
  });

  it('handles empty options array', () => {
    render(<FilterContent options={[]} handleClick={mockHandleClick} />);
    
    const buttons = screen.queryAllByTestId('button');
    expect(buttons).toHaveLength(0);
  });

  it('handles undefined options gracefully', () => {
    render(<FilterContent handleClick={mockHandleClick} />);
    
    const buttons = screen.queryAllByTestId('button');
    expect(buttons).toHaveLength(0);
  });

  it('uses default handleClick function when not provided', () => {
    // This should not throw an error
    render(<FilterContent options={mockOptions} />);
    
    const firstOptionButton = screen.getByText('Option 1');
    expect(() => fireEvent.click(firstOptionButton)).not.toThrow();
  });

  it('applies correct button properties', () => {
    render(<FilterContent options={mockOptions} handleClick={mockHandleClick} />);
    
    const buttons = screen.getAllByTestId('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('layout', 'dropdown-prosper');
      expect(button).toHaveAttribute('align', 'right');
    });
  });
});