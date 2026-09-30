import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import useExpanded from './useExpanded';

// Test component that uses the hook
const TestComponent = ({ selectedTender, multi = false }) => {
  const { expanded, handleChangeExpanded } = useExpanded(selectedTender, multi);

  return (
    <div data-testid="test-component">
      <div data-testid="expanded-count">{expanded.length}</div>
      <div data-testid="expanded-items">{JSON.stringify(expanded)}</div>
      <button
        onClick={() => handleChangeExpanded(1)}
        data-testid="toggle-1"
      >
        Toggle 1
      </button>
      <button
        onClick={() => handleChangeExpanded(2)}
        data-testid="toggle-2"
      >
        Toggle 2
      </button>
      <button
        onClick={() => handleChangeExpanded('3')}
        data-testid="toggle-string"
      >
        Toggle String 3
      </button>
    </div>
  );
};

describe('useExpanded', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should run without crashing', () => {
    expect(() => {
      render(<TestComponent />);
    }).not.toThrow();
  });

  it('should initialize with empty expanded array', () => {
    render(<TestComponent />);
    
    expect(screen.getByTestId('expanded-count')).toHaveTextContent('0');
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[]');
  });

  it('should expand item in single mode (default)', () => {
    render(<TestComponent />);
    
    fireEvent.click(screen.getByTestId('toggle-1'));
    
    expect(screen.getByTestId('expanded-count')).toHaveTextContent('1');
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[1]');
  });

  it('should collapse already expanded item in single mode', () => {
    render(<TestComponent />);
    
    // First click - expand
    fireEvent.click(screen.getByTestId('toggle-1'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[1]');
    
    // Second click - collapse
    fireEvent.click(screen.getByTestId('toggle-1'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[]');
  });

  it('should replace expanded item when clicking different item in single mode', () => {
    render(<TestComponent />);
    
    // Expand item 1
    fireEvent.click(screen.getByTestId('toggle-1'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[1]');
    
    // Expand item 2 - should replace item 1
    fireEvent.click(screen.getByTestId('toggle-2'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[2]');
  });

  it('should handle multi mode correctly', () => {
    render(<TestComponent multi={true} />);
    
    // Expand item 1
    fireEvent.click(screen.getByTestId('toggle-1'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[1]');
    
    // Expand item 2 - should add to array, not replace
    fireEvent.click(screen.getByTestId('toggle-2'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[1,2]');
  });

  it('should remove item from expanded array in multi mode', () => {
    render(<TestComponent multi={true} />);
    
    // Expand items 1 and 2
    fireEvent.click(screen.getByTestId('toggle-1'));
    fireEvent.click(screen.getByTestId('toggle-2'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[1,2]');
    
    // Remove item 1
    fireEvent.click(screen.getByTestId('toggle-1'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[2]');
  });

  it('should convert string ids to numbers in multi mode', () => {
    render(<TestComponent multi={true} />);
    
    // Click string toggle
    fireEvent.click(screen.getByTestId('toggle-string'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[3]');
    
    // Add another item
    fireEvent.click(screen.getByTestId('toggle-1'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[3,1]');
  });

  it('should handle selectedTender on mount', () => {
    const selectedTender = { id: 5 };
    render(<TestComponent selectedTender={selectedTender} />);
    
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[5]');
  });

  it('should update when selectedTender changes', () => {
    const selectedTender1 = { id: 5 };
    const { rerender } = render(<TestComponent selectedTender={selectedTender1} />);
    
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[5]');
    
    // Change selectedTender
    const selectedTender2 = { id: 7 };
    rerender(<TestComponent selectedTender={selectedTender2} />);
    
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[7]');
  });

  it('should handle selectedTender in multi mode', () => {
    const selectedTender = { id: 5 };
    render(<TestComponent selectedTender={selectedTender} multi={true} />);
    
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[5]');
    
    // Add another item manually
    fireEvent.click(screen.getByTestId('toggle-1'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[5,1]');
  });

  it('should handle null selectedTender', () => {
    render(<TestComponent selectedTender={null} />);
    
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[]');
    
    // Manual toggle should still work
    fireEvent.click(screen.getByTestId('toggle-1'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[1]');
  });

  it('should handle undefined selectedTender', () => {
    render(<TestComponent selectedTender={undefined} />);
    
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[]');
    
    // Manual toggle should still work
    fireEvent.click(screen.getByTestId('toggle-1'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[1]');
  });

  it('should switch from single to multi mode correctly', () => {
    const { rerender } = render(<TestComponent multi={false} />);
    
    // Expand an item in single mode
    fireEvent.click(screen.getByTestId('toggle-1'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[1]');
    
    // Switch to multi mode
    rerender(<TestComponent multi={true} />);
    
    // Should still have the item expanded
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[1]');
    
    // Now we can add more items
    fireEvent.click(screen.getByTestId('toggle-2'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[1,2]');
  });

  it('should switch from multi to single mode correctly', () => {
    const { rerender } = render(<TestComponent multi={true} />);
    
    // Expand multiple items in multi mode
    fireEvent.click(screen.getByTestId('toggle-1'));
    fireEvent.click(screen.getByTestId('toggle-2'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[1,2]');
    
    // Switch to single mode
    rerender(<TestComponent multi={false} />);
    
    // Should still have both items expanded initially
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[1,2]');
    
    // But now clicking should replace, not add
    fireEvent.click(screen.getByTestId('toggle-string'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('["3"]');
  });

  it('should handle edge case with string ids correctly', () => {
    render(<TestComponent multi={false} />);
    
    // Click string toggle in single mode
    fireEvent.click(screen.getByTestId('toggle-string'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('["3"]');
    
    // Click numeric toggle - should replace string
    fireEvent.click(screen.getByTestId('toggle-1'));
    expect(screen.getByTestId('expanded-items')).toHaveTextContent('[1]');
  });
});