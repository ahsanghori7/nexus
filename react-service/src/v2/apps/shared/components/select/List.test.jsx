import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SelectList from './List';
import TestRenderer from 'react-test-renderer';

// Mock the clink-components module
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      prosper: {
        SilverSand: '#E5E5E5'
      }
    }
  }
}));

// Mock the helper function
jest.mock('v2/helpers/data', () => ({
  getAddress: jest.fn((address) => {
    if (!address) return '';
    return `${address.street || ''} ${address.city || ''} ${address.state || ''}`.trim();
  })
}));

describe('SelectList Component', () => {
  const mockHandleClick = jest.fn();
  
  const defaultProps = {
    options: [],
    sx: {},
    handleClick: mockHandleClick
  };

  const sampleOptions = [
    {
      label: 'Company A',
      number: 'COMP001',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY'
      }
    },
    {
      label: 'Company B',
      number: 'COMP002',
      address: {
        street: '456 Oak Ave',
        city: 'Los Angeles',
        state: 'CA'
      }
    }
  ];

  beforeEach(() => {
    mockHandleClick.mockClear();
  });

  test('renders without crashing', () => {
    render(<SelectList {...defaultProps} />);
    
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
  });

  test('renders empty list when no options provided', () => {
    render(<SelectList {...defaultProps} />);
    
    const list = screen.getByRole('list');
    expect(list).toBeInTheDocument();
    expect(list).toBeEmptyDOMElement();
  });

  test('renders list items when options are provided', () => {
    render(<SelectList {...defaultProps} options={sampleOptions} />);
    
    // Check if list items are rendered
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
    
    // Check if text content is correct
    expect(screen.getByText('Company A [COMP001]')).toBeInTheDocument();
    expect(screen.getByText('Company B [COMP002]')).toBeInTheDocument();
    expect(screen.getByText('123 Main St New York NY')).toBeInTheDocument();
    expect(screen.getByText('456 Oak Ave Los Angeles CA')).toBeInTheDocument();
  });

  test('calls handleClick when list item is clicked', () => {
    render(<SelectList {...defaultProps} options={sampleOptions} />);
    
    const firstButton = screen.getAllByRole('button')[0];
    fireEvent.click(firstButton);
    
    expect(mockHandleClick).toHaveBeenCalledTimes(1);
    expect(mockHandleClick).toHaveBeenCalledWith(sampleOptions[0]);
  });

  test('calls handleClick with correct option when different items are clicked', () => {
    render(<SelectList {...defaultProps} options={sampleOptions} />);
    
    const buttons = screen.getAllByRole('button');
    
    // Click first item
    fireEvent.click(buttons[0]);
    expect(mockHandleClick).toHaveBeenCalledWith(sampleOptions[0]);
    
    // Click second item
    fireEvent.click(buttons[1]);
    expect(mockHandleClick).toHaveBeenCalledWith(sampleOptions[1]);
    
    expect(mockHandleClick).toHaveBeenCalledTimes(2);
  });

  test('applies custom styles from sx prop', () => {
    const customSx = {
      backgroundColor: 'red',
      border: '2px solid blue'
    };
    
    render(<SelectList {...defaultProps} options={sampleOptions} sx={customSx} />);
    
    const list = screen.getByRole('list');
    expect(list).toHaveStyle({
      backgroundColor: 'red',
      border: '2px solid blue'
    });
  });

  test('handles options with missing address', () => {
    const optionsWithMissingAddress = [
      {
        label: 'Company C',
        number: 'COMP003',
        address: null
      }
    ];
    
    render(<SelectList {...defaultProps} options={optionsWithMissingAddress} />);
    
    expect(screen.getByText('Company C [COMP003]')).toBeInTheDocument();
  });

  test('has correct list styling', () => {
    render(<SelectList {...defaultProps} options={sampleOptions} />);
    
    const list = screen.getByRole('list');
    expect(list).toHaveStyle({
      position: 'absolute',
      backgroundColor: 'white',
      zIndex: '1',
      width: '100%',
      maxHeight: '200px',
      overflow: 'auto',
      boxShadow: '0px 5px 5px #00000029',
      paddingTop: '0',
      paddingBottom: '0'
    });
  });

  test('generates correct keys for list items', () => {
    render(<SelectList {...defaultProps} options={sampleOptions} />);
    
    const listItems = screen.getAllByRole('listitem');
    
    // Each list item should have a unique key (though we can't directly test React keys,
    // we can verify the list renders properly with multiple items)
    expect(listItems).toHaveLength(2);
    expect(listItems[0]).toBeInTheDocument();
    expect(listItems[1]).toBeInTheDocument();
  });

  test('takes a snapshot', () => {
    const { container } = render(
      <SelectList {...defaultProps} options={sampleOptions} />
    );
    expect(container.firstChild).toMatchSnapshot();
  });

  test('supports default handlers when handleClick prop is omitted', () => {
    render(<SelectList options={sampleOptions} />);
    
    const firstButton = screen.getAllByRole('button')[0];
    expect(() => fireEvent.click(firstButton)).not.toThrow();
  });

  test('SelectListItem applies default values when props are missing', () => {
    const renderer = TestRenderer.create(<SelectList options={sampleOptions} />);
    const items = renderer.root.findAll(
      (node) => typeof node.type === 'function' && node.type.name === 'SelectListItem'
    );
    expect(items.length).toBeGreaterThan(0);
    const ItemComponent = items[0].type;
    expect(() => ItemComponent({})).not.toThrow();
  });
});
