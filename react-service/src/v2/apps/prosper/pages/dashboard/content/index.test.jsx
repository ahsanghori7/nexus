import React from 'react';
import { render, screen } from '@testing-library/react';
import Layout from './index';

// Mock the styled components
jest.mock('./Dashboard.styled', () => ({
  StyledItem: ({ children, one, two, three, ...props }) => (
    <div data-testid="styled-item" {...props}>
      {children}
    </div>
  )
}));

jest.mock('./StyledH2.styled', () => ({ children, ...props }) => (
  <h2 data-testid="styled-h2" {...props}>
    {children}
  </h2>
));

describe('Layout', () => {
  it('renders without crashing with empty config', () => {
    render(<Layout />);
    // Should not crash with empty config
  });

  it('renders without crashing with undefined config', () => {
    render(<Layout config={undefined} />);
    // Should not crash with undefined config
  });

  it('renders layout items from config array', () => {
    const mockConfig = [
      {
        key: { one: true },
        title: 'First Panel',
        content: <div data-testid="first-content">First Content</div>
      },
      {
        key: { two: true },
        title: 'Second Panel',
        content: <div data-testid="second-content">Second Content</div>
      }
    ];

    render(<Layout config={mockConfig} />);
    
    expect(screen.getByText('First Panel')).toBeInTheDocument();
    expect(screen.getByText('Second Panel')).toBeInTheDocument();
    expect(screen.getByTestId('first-content')).toBeInTheDocument();
    expect(screen.getByTestId('second-content')).toBeInTheDocument();
  });

  it('renders styled components correctly', () => {
    const mockConfig = [
      {
        key: { one: true },
        title: 'Test Title',
        content: <div>Test Content</div>
      }
    ];

    render(<Layout config={mockConfig} />);
    
    expect(screen.getByTestId('styled-item')).toBeInTheDocument();
    expect(screen.getByTestId('styled-h2')).toBeInTheDocument();
  });

  it('passes key props to StyledItem correctly', () => {
    const mockConfig = [
      {
        key: { one: true, 'data-custom': 'test' },
        title: 'Test Title',
        content: <div>Test Content</div>
      }
    ];

    render(<Layout config={mockConfig} />);
    
    const styledItem = screen.getByTestId('styled-item');
    // Check that the props were passed (they may not show as attributes)
    expect(styledItem).toHaveAttribute('data-custom', 'test');
    expect(styledItem).toBeInTheDocument();
  });

  it('handles complex content correctly', () => {
    const mockConfig = [
      {
        key: { one: true },
        title: 'Complex Panel',
        content: (
          <div>
            <p>Paragraph content</p>
            <button>Action Button</button>
          </div>
        )
      }
    ];

    render(<Layout config={mockConfig} />);
    
    expect(screen.getByText('Complex Panel')).toBeInTheDocument();
    expect(screen.getByText('Paragraph content')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });

  it('renders multiple items with different keys', () => {
    const mockConfig = [
      {
        key: { one: true },
        title: 'First',
        content: <div>Content 1</div>
      },
      {
        key: { two: true },
        title: 'Second',
        content: <div>Content 2</div>
      },
      {
        key: { three: true },
        title: 'Third',
        content: <div>Content 3</div>
      }
    ];

    render(<Layout config={mockConfig} />);
    
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
    expect(screen.getByText('Content 2')).toBeInTheDocument();
    expect(screen.getByText('Content 3')).toBeInTheDocument();
  });
});