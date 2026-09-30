import React from 'react';
import { render } from '@testing-library/react';
import useResizeObserver from './useResizeObserver';

// Test component that uses the hook
const TestComponent = ({ className, callback }) => {
  useResizeObserver(className, callback);
  return <div data-testid="test-component">Test Component</div>;
};

// Mock ResizeObserver since it's not available in test environment
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }

  observe() {
    // Mock observe method
  }

  unobserve() {
    // Mock unobserve method
  }

  disconnect() {
    // Mock disconnect method
  }
};

describe('useResizeObserver', () => {
  beforeEach(() => {
    // Clear the DOM before each test
    document.body.innerHTML = '';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should run without crashing', () => {
    const mockCallback = jest.fn();
    
    expect(() => {
      render(<TestComponent className="test-class" callback={mockCallback} />);
    }).not.toThrow();
  });

  it('should not observe when no element with className exists', () => {
    const mockCallback = jest.fn();
    const observeSpy = jest.spyOn(ResizeObserver.prototype, 'observe');
    
    render(<TestComponent className="non-existent-class" callback={mockCallback} />);
    
    expect(observeSpy).not.toHaveBeenCalled();
  });

  it('should observe element when className exists', () => {
    // Arrange: Create an element with the target class
    const testElement = document.createElement('div');
    testElement.className = 'test-class';
    document.body.appendChild(testElement);
    
    const mockCallback = jest.fn();
    const observeSpy = jest.spyOn(ResizeObserver.prototype, 'observe');
    
    // Act
    render(<TestComponent className="test-class" callback={mockCallback} />);
    
    // Assert
    expect(observeSpy).toHaveBeenCalledWith(testElement);
  });

  it('should call callback when ResizeObserver triggers', () => {
    // Arrange: Create an element with the target class
    const testElement = document.createElement('div');
    testElement.className = 'resize-test';
    document.body.appendChild(testElement);
    
    const mockCallback = jest.fn();
    let resizeObserverCallback;
    
    // Mock ResizeObserver to capture the callback
    global.ResizeObserver = class ResizeObserver {
      constructor(callback) {
        resizeObserverCallback = callback;
      }
      observe() {}
      unobserve() {}
    };
    
    // Act
    render(<TestComponent className="resize-test" callback={mockCallback} />);
    
    // Simulate resize observer triggering
    const mockEntry = {
      contentRect: { width: 100, height: 200 }
    };
    resizeObserverCallback([mockEntry]);
    
    // Assert
    expect(mockCallback).toHaveBeenCalledWith(mockEntry.contentRect);
  });

  it('should handle multiple elements with same className by observing the first one', () => {
    // Arrange: Create multiple elements with the same class
    const testElement1 = document.createElement('div');
    testElement1.className = 'multi-class';
    const testElement2 = document.createElement('div');
    testElement2.className = 'multi-class';
    
    document.body.appendChild(testElement1);
    document.body.appendChild(testElement2);
    
    const mockCallback = jest.fn();
    const observeSpy = jest.spyOn(ResizeObserver.prototype, 'observe');
    
    // Act
    render(<TestComponent className="multi-class" callback={mockCallback} />);
    
    // Assert: Should observe the first element only
    expect(observeSpy).toHaveBeenCalledTimes(1);
    expect(observeSpy).toHaveBeenCalledWith(testElement1);
  });

  it('should unobserve element on cleanup', () => {
    // Arrange: Create an element with the target class
    const testElement = document.createElement('div');
    testElement.className = 'cleanup-test';
    document.body.appendChild(testElement);
    
    const mockCallback = jest.fn();
    const unobserveSpy = jest.spyOn(ResizeObserver.prototype, 'unobserve');
    
    // Act
    const { unmount } = render(<TestComponent className="cleanup-test" callback={mockCallback} />);
    
    // Trigger cleanup by unmounting
    unmount();
    
    // Assert
    expect(unobserveSpy).toHaveBeenCalledWith(testElement);
  });

  it('should re-observe when className changes', () => {
    // Arrange: Create elements for both classes
    const testElement1 = document.createElement('div');
    testElement1.className = 'class-1';
    const testElement2 = document.createElement('div');
    testElement2.className = 'class-2';
    
    document.body.appendChild(testElement1);
    document.body.appendChild(testElement2);
    
    const mockCallback = jest.fn();
    const observeSpy = jest.spyOn(ResizeObserver.prototype, 'observe');
    const unobserveSpy = jest.spyOn(ResizeObserver.prototype, 'unobserve');
    
    // Act: First render with class-1
    const { rerender } = render(<TestComponent className="class-1" callback={mockCallback} />);
    
    // Re-render with class-2
    rerender(<TestComponent className="class-2" callback={mockCallback} />);
    
    // Assert: Should unobserve first element and observe second
    expect(unobserveSpy).toHaveBeenCalledWith(testElement1);
    expect(observeSpy).toHaveBeenCalledWith(testElement2);
  });

  it('should handle edge case when callback changes', () => {
    // Arrange
    const testElement = document.createElement('div');
    testElement.className = 'callback-test';
    document.body.appendChild(testElement);
    
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();
    const observeSpy = jest.spyOn(ResizeObserver.prototype, 'observe');
    
    // Act: First render with callback1
    const { rerender } = render(<TestComponent className="callback-test" callback={mockCallback1} />);
    
    // Re-render with callback2
    rerender(<TestComponent className="callback-test" callback={mockCallback2} />);
    
    // Assert: Should observe the element again (due to dependency change)
    expect(observeSpy).toHaveBeenCalledTimes(2);
  });
});