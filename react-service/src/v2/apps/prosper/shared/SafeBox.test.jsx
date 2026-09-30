import React from 'react';
import { render, screen } from '@testing-library/react';
import SafeBox from './SafeBox';

describe('SafeBox', () => {
  it('renders without crashing', () => {
    render(<SafeBox data-testid="safe-box" />);
    expect(screen.getByTestId('safe-box')).toBeInTheDocument();
  });

  it('renders with children', () => {
    render(
      <SafeBox data-testid="safe-box-with-children">
        <span>Test Content</span>
      </SafeBox>
    );
    expect(screen.getByTestId('safe-box-with-children')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('forwards valid DOM props to Box component', () => {
    render(
      <SafeBox 
        data-testid="styled-safe-box" 
        className="custom-class"
        id="test-id"
      />
    );
    
    const box = screen.getByTestId('styled-safe-box');
    expect(box).toHaveClass('custom-class');
    expect(box).toHaveAttribute('id', 'test-id');
  });

  it('filters out handleClick prop to avoid DOM warnings', () => {
    const mockHandleClick = jest.fn();
    render(
      <SafeBox 
        handleClick={mockHandleClick}
        data-testid="filtered-safe-box"
      >
        Content
      </SafeBox>
    );
    
    const box = screen.getByTestId('filtered-safe-box');
    expect(box).toBeInTheDocument();
    // handleClick should not be passed as a DOM attribute
    expect(box).not.toHaveAttribute('handleClick');
  });

  it('renders as a div component by default', () => {
    render(<SafeBox data-testid="div-safe-box">Content</SafeBox>);
    const box = screen.getByTestId('div-safe-box');
    expect(box.tagName.toLowerCase()).toBe('div');
  });
});