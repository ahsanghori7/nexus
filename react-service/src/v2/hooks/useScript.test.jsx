import React from 'react';
import { render, screen } from '@testing-library/react';
import useScript from './useScript';

// Test component that uses the hook
const TestComponent = ({ url }) => {
  useScript(url);
  return <div data-testid="test-component">Script Loader Component</div>;
};

describe('useScript', () => {
  beforeEach(() => {
    // Clear the DOM before each test
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Clean up any remaining scripts
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    });
  });

  it('should run without crashing', () => {
    expect(() => {
      render(<TestComponent url="https://example.com/script.js" />);
    }).not.toThrow();
  });

  it('should create and append script element to document body', () => {
    const testUrl = 'https://example.com/test-script.js';
    
    render(<TestComponent url={testUrl} />);
    
    const scripts = document.querySelectorAll('script');
    expect(scripts).toHaveLength(1);
    
    const script = scripts[0];
    expect(script.src).toBe(testUrl);
    expect(script.async).toBe(true);
    expect(script.parentNode).toBe(document.body);
  });

  it('should set script src correctly', () => {
    const testUrl = 'https://cdn.example.com/my-library.js';
    
    render(<TestComponent url={testUrl} />);
    
    const script = document.querySelector('script');
    expect(script.src).toBe(testUrl);
  });

  it('should set script async attribute to true', () => {
    render(<TestComponent url="https://example.com/script.js" />);
    
    const script = document.querySelector('script');
    expect(script.async).toBe(true);
  });

  it('should create different script elements for different URLs', () => {
    const url1 = 'https://example.com/script1.js';
    const url2 = 'https://example.com/script2.js';
    
    // Render first component
    const { rerender } = render(<TestComponent url={url1} />);
    expect(document.querySelectorAll('script')).toHaveLength(1);
    expect(document.querySelector('script').src).toBe(url1);
    
    // Render second component with different URL
    rerender(<TestComponent url={url2} />);
    expect(document.querySelectorAll('script')).toHaveLength(1);
    expect(document.querySelector('script').src).toBe(url2);
  });

  it('should remove script from DOM on component unmount', () => {
    const testUrl = 'https://example.com/cleanup-test.js';
    
    const { unmount } = render(<TestComponent url={testUrl} />);
    
    // Verify script is added
    expect(document.querySelectorAll('script')).toHaveLength(1);
    
    // Unmount component
    unmount();
    
    // Verify script is removed
    expect(document.querySelectorAll('script')).toHaveLength(0);
  });

  it('should handle script cleanup when URL changes', () => {
    const url1 = 'https://example.com/script1.js';
    const url2 = 'https://example.com/script2.js';
    
    const { rerender } = render(<TestComponent url={url1} />);
    
    // Verify first script is added
    expect(document.querySelectorAll('script')).toHaveLength(1);
    expect(document.querySelector('script').src).toBe(url1);
    
    // Change URL - should remove old script and add new one
    rerender(<TestComponent url={url2} />);
    
    // Should only have one script (the new one)
    expect(document.querySelectorAll('script')).toHaveLength(1);
    expect(document.querySelector('script').src).toBe(url2);
  });

  it('should handle empty URL gracefully', () => {
    expect(() => {
      render(<TestComponent url="" />);
    }).not.toThrow();
    
    const script = document.querySelector('script');
    expect(script.src).toBe(window.location.href); // Empty string resolves to current URL
  });

  it('should handle relative URLs', () => {
    const relativeUrl = '/static/js/app.js';
    
    render(<TestComponent url={relativeUrl} />);
    
    const script = document.querySelector('script');
    expect(script.src).toContain('/static/js/app.js');
  });

  it('should handle multiple components with same URL', () => {
    const testUrl = 'https://example.com/shared-script.js';
    
    // Render multiple components with same URL
    render(
      <div>
        <TestComponent url={testUrl} />
        <TestComponent url={testUrl} />
      </div>
    );
    
    // Should create separate script elements for each component
    expect(document.querySelectorAll('script')).toHaveLength(2);
    
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      expect(script.src).toBe(testUrl);
    });
  });

  it('should handle script element creation without errors when document.body exists', () => {
    // Ensure document.body exists
    expect(document.body).toBeTruthy();
    
    const testUrl = 'https://example.com/test.js';
    
    expect(() => {
      render(<TestComponent url={testUrl} />);
    }).not.toThrow();
    
    const script = document.querySelector('script');
    expect(script).toBeTruthy();
    expect(script.parentNode).toBe(document.body);
  });

  it('should handle cleanup when script element no longer exists in DOM', () => {
    const testUrl = 'https://example.com/removable-script.js';
    
    const { unmount } = render(<TestComponent url={testUrl} />);
    
    // Manually remove the script (simulating external script removal)
    const script = document.querySelector('script');
    script.remove();
    
    // Unmounting should not throw an error even if script is already removed
    expect(() => {
      unmount();
    }).not.toThrow();
  });

  it('should create new script when URL changes from null/undefined', () => {
    const { rerender } = render(<TestComponent url={undefined} />);
    
    // Initially, should create script with undefined URL
    expect(document.querySelectorAll('script')).toHaveLength(1);
    
    const validUrl = 'https://example.com/valid-script.js';
    rerender(<TestComponent url={validUrl} />);
    
    // Should have replaced with valid URL script
    expect(document.querySelectorAll('script')).toHaveLength(1);
    expect(document.querySelector('script').src).toBe(validUrl);
  });

  it('should handle special characters in URL', () => {
    const specialUrl = 'https://example.com/script-with-query.js?param=value&other=test';
    
    render(<TestComponent url={specialUrl} />);
    
    const script = document.querySelector('script');
    expect(script.src).toBe(specialUrl);
  });
});