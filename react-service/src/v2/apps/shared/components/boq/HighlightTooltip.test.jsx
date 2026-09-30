import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import highlightTooltip from './HighlightTooltip';

// Mock TableTooltip component
jest.mock('./TableTooltip', () => {
  return function MockTableTooltip({ content, title }) {
    return (
      <div data-testid="table-tooltip">
        <div data-testid="tooltip-content">{content}</div>
        <div data-testid="tooltip-title">{title}</div>
      </div>
    );
  };
});

describe('highlightTooltip Function', () => {
  test('returns TableTooltip when hasNewChanges is true', () => {
    const row = {
      hasNewChanges: true,
      tooltipText: 'This item has changes',
    };
    
    const result = highlightTooltip(row);
    const { container } = render(<div>{result}</div>);
    
    const tooltip = screen.getByTestId('table-tooltip');
    expect(tooltip).toBeInTheDocument();
  });

  test('returns null when hasNewChanges is false', () => {
    const row = {
      hasNewChanges: false,
      tooltipText: 'This item has changes',
    };
    
    const result = highlightTooltip(row);
    expect(result).toBeNull();
  });

  test('returns null when hasNewChanges is undefined', () => {
    const row = {
      tooltipText: 'This item has changes',
    };
    
    const result = highlightTooltip(row);
    expect(result).toBeNull();
  });

  test('returns null when hasNewChanges is falsy', () => {
    const falsyValues = [false, 0, '', null, undefined];
    
    falsyValues.forEach(falsyValue => {
      const row = {
        hasNewChanges: falsyValue,
        tooltipText: 'This item has changes',
      };
      
      const result = highlightTooltip(row);
      expect(result).toBeNull();
    });
  });

  test('renders correct content when hasNewChanges is true', () => {
    const row = {
      hasNewChanges: true,
      tooltipText: 'Changes detected',
    };
    
    const result = highlightTooltip(row);
    const { container } = render(<div>{result}</div>);
    
    const content = screen.getByTestId('tooltip-content');
    const contentElement = content.querySelector('b');
    
    expect(contentElement).toBeInTheDocument();
    expect(contentElement).toHaveStyle({ color: 'red' });
    expect(contentElement).toHaveTextContent('*');
  });

  test('renders correct title when hasNewChanges is true', () => {
    const row = {
      hasNewChanges: true,
      tooltipText: 'Important changes made',
    };
    
    const result = highlightTooltip(row);
    const { container } = render(<div>{result}</div>);
    
    const title = screen.getByTestId('tooltip-title');
    const titleElement = title.querySelector('b');
    
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveTextContent('Important changes made');
  });

  test('handles empty tooltipText', () => {
    const row = {
      hasNewChanges: true,
      tooltipText: '',
    };
    
    const result = highlightTooltip(row);
    const { container } = render(<div>{result}</div>);
    
    const tooltip = screen.getByTestId('table-tooltip');
    expect(tooltip).toBeInTheDocument();
    
    const title = screen.getByTestId('tooltip-title');
    const titleElement = title.querySelector('b');
    expect(titleElement).toHaveTextContent('');
  });

  test('handles missing tooltipText property', () => {
    const row = {
      hasNewChanges: true,
    };
    
    const result = highlightTooltip(row);
    const { container } = render(<div>{result}</div>);
    
    const tooltip = screen.getByTestId('table-tooltip');
    expect(tooltip).toBeInTheDocument();
    
    const title = screen.getByTestId('tooltip-title');
    const titleElement = title.querySelector('b');
    expect(titleElement).toHaveTextContent('');
  });

  test('handles null tooltipText', () => {
    const row = {
      hasNewChanges: true,
      tooltipText: null,
    };
    
    const result = highlightTooltip(row);
    const { container } = render(<div>{result}</div>);
    
    const tooltip = screen.getByTestId('table-tooltip');
    expect(tooltip).toBeInTheDocument();
    
    const title = screen.getByTestId('tooltip-title');
    const titleElement = title.querySelector('b');
    expect(titleElement).toHaveTextContent('');
  });

  test('passes correct props to TableTooltip', () => {
    const row = {
      hasNewChanges: true,
      tooltipText: 'Test tooltip text',
    };
    
    const result = highlightTooltip(row);
    const { container } = render(<div>{result}</div>);
    
    // Verify content prop (red asterisk)
    const content = screen.getByTestId('tooltip-content');
    const contentElement = content.querySelector('b');
    expect(contentElement).toHaveStyle({ color: 'red' });
    expect(contentElement).toHaveTextContent('*');
    
    // Verify title prop (bold tooltip text)
    const title = screen.getByTestId('tooltip-title');
    const titleElement = title.querySelector('b');
    expect(titleElement).toHaveTextContent('Test tooltip text');
  });

  test('handles empty row object', () => {
    const row = {};
    
    const result = highlightTooltip(row);
    expect(result).toBeNull();
  });

  test('handles truthy hasNewChanges values', () => {
    const truthyValues = [true, 1, 'true', {}, []];
    
    truthyValues.forEach(truthyValue => {
      const row = {
        hasNewChanges: truthyValue,
        tooltipText: 'Test',
      };
      
      const result = highlightTooltip(row);
      expect(result).not.toBeNull();
      
      const { container } = render(<div>{result}</div>);
      const tooltip = screen.getByTestId('table-tooltip');
      expect(tooltip).toBeInTheDocument();
      
      // Clean up for next iteration
      container.remove();
    });
  });

  test('returns function result correctly', () => {
    const row = {
      hasNewChanges: true,
      tooltipText: 'Function test',
    };
    
    const result = highlightTooltip(row);
    
    // Should return a React element (JSX)
    expect(React.isValidElement(result)).toBe(true);
  });
});