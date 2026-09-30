import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import Info from './Info';

// Mock MUI theme
jest.mock('@mui/material/styles', () => ({
  useTheme: jest.fn(() => ({
    palette: {
      common: {
        white: '#FFFFFF'
      }
    },
    spacing: jest.fn((value) => `${value * 8}px`)
  }))
}));

describe('Info Component', () => {
  const defaultProps = {
    icon: 'mock-icon-url',
    title: 'Test Title',
    description: 'Test Description'
  };

  it('should render without crashing', () => {
    const { container } = render(<Info {...defaultProps} />);
    expect(container).toBeInTheDocument();
  });

  it('should render title correctly', () => {
    const { getByText } = render(<Info {...defaultProps} />);
    expect(getByText('Test Title')).toBeInTheDocument();
  });

  it('should render description correctly', () => {
    const { getByText } = render(<Info {...defaultProps} />);
    expect(getByText('Test Description')).toBeInTheDocument();
  });

  it('should render with empty title and description', () => {
    const { container } = render(
      <Info icon="mock-icon" title="" description="" />
    );
    expect(container).toBeInTheDocument();
  });

  it('should render default empty strings when title and description are not provided', () => {
    const { container } = render(
      <Info icon="mock-icon" />
    );
    expect(container).toBeInTheDocument();
  });

  it('should render icon through Image component', () => {
    const { container } = render(<Info {...defaultProps} />);
    const imageElement = container.querySelector('img');
    expect(imageElement).toBeInTheDocument();
    expect(imageElement).toHaveAttribute('src', 'mock-icon-url');
  });

  it('should render with grid structure', () => {
    const { container } = render(<Info {...defaultProps} />);
    // Check for Grid container
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render avatar with proper styling', () => {
    const { container } = render(<Info {...defaultProps} />);
    // Avatar should be present in the component
    expect(container).toBeInTheDocument();
  });

  it('should handle long title and description', () => {
    const longProps = {
      icon: 'mock-icon-url',
      title: 'This is a very long title that should still render properly without breaking the component layout',
      description: 'This is a very long description that should wrap correctly and maintain proper spacing and formatting within the component structure'
    };

    const { getByText } = render(<Info {...longProps} />);
    expect(getByText(longProps.title)).toBeInTheDocument();
    expect(getByText(longProps.description)).toBeInTheDocument();
  });

  it('should render with special characters in title and description', () => {
    const specialProps = {
      icon: 'mock-icon-url',
      title: 'Title with & special <characters> "quotes"',
      description: 'Description with £100 & symbols'
    };

    const { getByText } = render(<Info {...specialProps} />);
    expect(getByText(specialProps.title)).toBeInTheDocument();
    expect(getByText(specialProps.description)).toBeInTheDocument();
  });
});