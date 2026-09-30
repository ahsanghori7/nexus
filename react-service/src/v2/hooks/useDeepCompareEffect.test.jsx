import React, { useState } from 'react';
import { render, screen } from '@testing-library/react';
import useDeepCompareEffect from './useDeepCompareEffect';

// Test component that uses the hook
const TestComponent = ({ dependencies, onEffect }) => {
  const [renderCount, setRenderCount] = useState(0);

  useDeepCompareEffect(() => {
    setRenderCount(prev => prev + 1);
    if (onEffect) {
      onEffect();
    }
  }, dependencies);

  return (
    <div data-testid="test-component">
      Effect called: {renderCount} times
    </div>
  );
};

describe('useDeepCompareEffect', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should run without crashing', () => {
    const mockEffect = jest.fn();
    
    expect(() => {
      render(<TestComponent dependencies={[]} onEffect={mockEffect} />);
    }).not.toThrow();
  });

  it('should call effect on first render', () => {
    const mockEffect = jest.fn();
    
    render(<TestComponent dependencies={[1, 2, 3]} onEffect={mockEffect} />);
    
    expect(mockEffect).toHaveBeenCalledTimes(1);
  });

  it('should not call effect when dependencies are shallowly equal but deeply equal', () => {
    const mockEffect = jest.fn();
    const dependencies1 = [{ a: 1 }, { b: 2 }];
    const dependencies2 = [{ a: 1 }, { b: 2 }]; // Different reference but same values
    
    const { rerender } = render(
      <TestComponent dependencies={dependencies1} onEffect={mockEffect} />
    );
    
    expect(mockEffect).toHaveBeenCalledTimes(1);
    
    // Re-render with deeply equal but different reference dependencies
    rerender(<TestComponent dependencies={dependencies2} onEffect={mockEffect} />);
    
    // Effect should not be called again because dependencies are deeply equal
    expect(mockEffect).toHaveBeenCalledTimes(1);
  });

  it('should call effect when dependencies are deeply different', () => {
    const mockEffect = jest.fn();
    const dependencies1 = [{ a: 1 }, { b: 2 }];
    const dependencies2 = [{ a: 1 }, { b: 3 }]; // Different values
    
    const { rerender } = render(
      <TestComponent dependencies={dependencies1} onEffect={mockEffect} />
    );
    
    expect(mockEffect).toHaveBeenCalledTimes(1);
    
    // Re-render with deeply different dependencies
    rerender(<TestComponent dependencies={dependencies2} onEffect={mockEffect} />);
    
    // Effect should be called again because dependencies are deeply different
    expect(mockEffect).toHaveBeenCalledTimes(2);
  });

  it('should handle primitive dependencies correctly', () => {
    const mockEffect = jest.fn();
    const dependencies1 = [1, 'hello', true];
    const dependencies2 = [1, 'hello', true]; // Same primitives
    const dependencies3 = [1, 'hello', false]; // Different primitive
    
    const { rerender } = render(
      <TestComponent dependencies={dependencies1} onEffect={mockEffect} />
    );
    
    expect(mockEffect).toHaveBeenCalledTimes(1);
    
    // Re-render with same primitive dependencies
    rerender(<TestComponent dependencies={dependencies2} onEffect={mockEffect} />);
    expect(mockEffect).toHaveBeenCalledTimes(1);
    
    // Re-render with different primitive dependencies
    rerender(<TestComponent dependencies={dependencies3} onEffect={mockEffect} />);
    expect(mockEffect).toHaveBeenCalledTimes(2);
  });

  it('should handle nested object dependencies', () => {
    const mockEffect = jest.fn();
    const dependencies1 = [{ user: { name: 'John', age: 30 } }];
    const dependencies2 = [{ user: { name: 'John', age: 30 } }]; // Same nested structure
    const dependencies3 = [{ user: { name: 'John', age: 31 } }]; // Different nested value
    
    const { rerender } = render(
      <TestComponent dependencies={dependencies1} onEffect={mockEffect} />
    );
    
    expect(mockEffect).toHaveBeenCalledTimes(1);
    
    // Re-render with deeply equal nested dependencies
    rerender(<TestComponent dependencies={dependencies2} onEffect={mockEffect} />);
    expect(mockEffect).toHaveBeenCalledTimes(1);
    
    // Re-render with different nested dependencies
    rerender(<TestComponent dependencies={dependencies3} onEffect={mockEffect} />);
    expect(mockEffect).toHaveBeenCalledTimes(2);
  });

  it('should handle array dependencies with objects', () => {
    const mockEffect = jest.fn();
    const dependencies1 = [[{ id: 1 }, { id: 2 }]];
    const dependencies2 = [[{ id: 1 }, { id: 2 }]]; // Same array content
    const dependencies3 = [[{ id: 1 }, { id: 3 }]]; // Different array content
    
    const { rerender } = render(
      <TestComponent dependencies={dependencies1} onEffect={mockEffect} />
    );
    
    expect(mockEffect).toHaveBeenCalledTimes(1);
    
    // Re-render with deeply equal array dependencies
    rerender(<TestComponent dependencies={dependencies2} onEffect={mockEffect} />);
    expect(mockEffect).toHaveBeenCalledTimes(1);
    
    // Re-render with different array dependencies
    rerender(<TestComponent dependencies={dependencies3} onEffect={mockEffect} />);
    expect(mockEffect).toHaveBeenCalledTimes(2);
  });

  it('should handle null and undefined dependencies', () => {
    const mockEffect = jest.fn();
    
    const { rerender } = render(
      <TestComponent dependencies={[null, undefined]} onEffect={mockEffect} />
    );
    
    expect(mockEffect).toHaveBeenCalledTimes(1);
    
    // Re-render with same null/undefined dependencies
    rerender(<TestComponent dependencies={[null, undefined]} onEffect={mockEffect} />);
    expect(mockEffect).toHaveBeenCalledTimes(1);
    
    // Re-render with different values
    rerender(<TestComponent dependencies={[null, 'something']} onEffect={mockEffect} />);
    expect(mockEffect).toHaveBeenCalledTimes(2);
  });

  it('should handle empty dependencies', () => {
    const mockEffect = jest.fn();
    
    const { rerender } = render(
      <TestComponent dependencies={[]} onEffect={mockEffect} />
    );
    
    expect(mockEffect).toHaveBeenCalledTimes(1);
    
    // Re-render with same empty dependencies
    rerender(<TestComponent dependencies={[]} onEffect={mockEffect} />);
    expect(mockEffect).toHaveBeenCalledTimes(1);
    
    // Re-render with non-empty dependencies
    rerender(<TestComponent dependencies={['something']} onEffect={mockEffect} />);
    expect(mockEffect).toHaveBeenCalledTimes(2);
  });

  it('should handle complex mixed dependencies', () => {
    const mockEffect = jest.fn();
    const dependencies1 = [
      { users: [{ name: 'John' }, { name: 'Jane' }] },
      [1, 2, 3],
      'string',
      42,
      true
    ];
    const dependencies2 = [
      { users: [{ name: 'John' }, { name: 'Jane' }] },
      [1, 2, 3],
      'string',
      42,
      true
    ]; // Same complex structure
    const dependencies3 = [
      { users: [{ name: 'John' }, { name: 'Jane' }] },
      [1, 2, 3],
      'string',
      42,
      false // Only boolean changed
    ];
    
    const { rerender } = render(
      <TestComponent dependencies={dependencies1} onEffect={mockEffect} />
    );
    
    expect(mockEffect).toHaveBeenCalledTimes(1);
    
    // Re-render with deeply equal complex dependencies
    rerender(<TestComponent dependencies={dependencies2} onEffect={mockEffect} />);
    expect(mockEffect).toHaveBeenCalledTimes(1);
    
    // Re-render with one changed value in complex dependencies
    rerender(<TestComponent dependencies={dependencies3} onEffect={mockEffect} />);
    expect(mockEffect).toHaveBeenCalledTimes(2);
  });
});