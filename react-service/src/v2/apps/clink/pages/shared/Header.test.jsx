import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';

// Mock the styled component
jest.mock('./styled', () => ({
  StyledHeader: ({ children }) => <header data-testid="styled-header">{children}</header>,
}));

describe('Header', () => {
  it('renders without crashing', () => {
    render(<Header />);
    expect(screen.getByTestId('styled-header')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Header title="Test Title" />);
    
    expect(screen.getByTestId('styled-header')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('renders children when provided', () => {
    render(
      <Header>
        <div data-testid="child-element">Child content</div>
      </Header>
    );
    
    expect(screen.getByTestId('child-element')).toBeInTheDocument();
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('renders both title and children together', () => {
    render(
      <Header title="Test Title">
        <button>Action Button</button>
      </Header>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action Button' })).toBeInTheDocument();
  });

  it('renders with empty props', () => {
    render(<Header title="" />);
    
    expect(screen.getByTestId('styled-header')).toBeInTheDocument();
  });

  it('matches snapshot', () => {
    const { container } = render(
      <Header title="Test Title">
        <span>Test children</span>
      </Header>
    );
    
    expect(container.firstChild).toMatchSnapshot();
  });
});