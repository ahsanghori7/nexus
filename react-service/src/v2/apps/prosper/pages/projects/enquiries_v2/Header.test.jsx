import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';

describe('Header Component', () => {
  const defaultProps = {
    title: 'Test Title',
    subheader: 'Test Subheader',
  };

  it('renders without crashing', () => {
    render(<Header {...defaultProps} />);
    const cardHeader = screen.getByTestId('mui-card-header');
    expect(cardHeader).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(cardHeader).toHaveAttribute('subheader', 'Test Subheader');
  });

  it('renders title and subheader correctly', () => {
    render(<Header {...defaultProps} />);
    
    const cardHeader = screen.getByTestId('mui-card-header');
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(cardHeader).toHaveAttribute('subheader', 'Test Subheader');
  });

  it('renders with ActionCollapse when provided', () => {
    const mockActionCollapse = <button data-testid="action-button">Action</button>;
    
    render(
      <Header
        {...defaultProps}
        ActionCollapse={mockActionCollapse}
      />
    );
    
    const cardHeader = screen.getByTestId('mui-card-header');
    expect(screen.getByTestId('action-button')).toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(cardHeader).toHaveAttribute('subheader', 'Test Subheader');
  });

  it('renders without ActionCollapse when not provided', () => {
    render(<Header {...defaultProps} />);
    
    const cardHeader = screen.getByTestId('mui-card-header');
    expect(screen.queryByTestId('action-button')).not.toBeInTheDocument();
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(cardHeader).toHaveAttribute('subheader', 'Test Subheader');
  });

  it('passes correct styling props to CardHeader', () => {
    render(<Header {...defaultProps} />);
    
    const cardHeader = screen.getByTestId('mui-card-header');
    expect(cardHeader).toHaveAttribute('sx');
    expect(cardHeader).toHaveAttribute('titletypographyprops');
    expect(cardHeader).toHaveAttribute('subheadertypographyprops');
  });

  it('matches snapshot', () => {
    const { container } = render(<Header {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});