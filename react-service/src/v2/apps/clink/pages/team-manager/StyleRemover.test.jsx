import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StyleRemover from './StyleRemover';

describe('StyleRemover', () => {
  test('renders without crashing', () => {
    render(
      <StyleRemover>
        <div>Test content</div>
      </StyleRemover>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  test('renders children correctly', () => {
    const testContent = 'This is test content';
    render(
      <StyleRemover>
        <span>{testContent}</span>
      </StyleRemover>
    );
    
    expect(screen.getByText(testContent)).toBeInTheDocument();
  });

  test('applies correct MUI Box structure', () => {
    const { container } = render(
      <StyleRemover>
        <div data-testid="child">Child element</div>
      </StyleRemover>
    );
    
    // Check that the component renders with Box element
    const boxElement = container.querySelector('#box-helper');
    expect(boxElement).toBeInTheDocument();
  });

  test('handles multiple children', () => {
    render(
      <StyleRemover>
        <div>First child</div>
        <div>Second child</div>
        <span>Third child</span>
      </StyleRemover>
    );
    
    expect(screen.getByText('First child')).toBeInTheDocument();
    expect(screen.getByText('Second child')).toBeInTheDocument();
    expect(screen.getByText('Third child')).toBeInTheDocument();
  });

  test('creates snapshot', () => {
    const { container } = render(
      <StyleRemover>
        <div>Snapshot content</div>
      </StyleRemover>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});