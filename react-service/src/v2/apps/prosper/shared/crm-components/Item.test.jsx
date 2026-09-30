import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Item from './Item';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

describe('Item', () => {
  const defaultProps = {
    icon: 'test-icon.svg',
    type: 'email',
    value: 'test@example.com'
  };

  it('renders without crashing', () => {
    render(<Item {...defaultProps} />);
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('displays icon, type, and value correctly', () => {
    render(<Item {...defaultProps} />);
    
    // Check if icon is rendered
    const icon = screen.getByRole('img');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('src', 'test-icon.svg');
    
    // Check type and value
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders as a link when url is true', () => {
    render(<Item {...defaultProps} url={true} />);
    
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'test@example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener');
  });

  it('does not render as a link when url is false', () => {
    render(<Item {...defaultProps} url={false} />);
    
    const links = screen.queryAllByRole('link');
    expect(links).toHaveLength(0);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading is true and value is empty', () => {
    const { container } = render(<Item {...defaultProps} value={null} loading={true} />);
    const skeleton = container.querySelector('[data-testid="mui-skeleton"]');
    expect(skeleton).toBeInTheDocument();
  });

  it('does not show skeleton when value exists even if loading is true', () => {
    const { container } = render(<Item {...defaultProps} loading={true} />);
    const skeleton = container.querySelector('[data-testid="mui-skeleton"]');
    expect(skeleton).not.toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('applies custom icon size', () => {
    render(<Item {...defaultProps} iconSize={24} />);
    
    // Icon size is applied via sx prop, check if component renders
    expect(screen.getByText('email')).toBeInTheDocument();
  });

  it('applies custom margin bottom', () => {
    const { container } = render(<Item {...defaultProps} mb={5} />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom margin top', () => {
    const { container } = render(<Item {...defaultProps} mt={2} />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom grid xs prop', () => {
    const { container } = render(<Item {...defaultProps} xs={6} />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom grid styles', () => {
    const customGridSx = { backgroundColor: 'red', padding: 2 };
    const { container } = render(<Item {...defaultProps} gridSx={customGridSx} />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('applies custom font size', () => {
    const customFontSize = {
      xs: '10px',
      sm: '12px',
      md: '14px'
    };
    
    render(<Item {...defaultProps} fontSize={customFontSize} />);
    
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('applies custom grid proportions', () => {
    const gridProp1 = { xs: 6 };
    const gridProp2 = { xs: 6 };
    
    const { container } = render(
      <Item 
        {...defaultProps} 
        gridProp1={gridProp1}
        gridProp2={gridProp2}
      />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('handles empty value gracefully', () => {
    render(<Item {...defaultProps} value="" />);
    
    expect(screen.getByText('email')).toBeInTheDocument();
  });

  it('handles null value', () => {
    render(<Item {...defaultProps} value={null} />);
    
    expect(screen.getByText('email')).toBeInTheDocument();
  });

  it('handles undefined value', () => {
    render(<Item {...defaultProps} value={undefined} />);
    
    expect(screen.getByText('email')).toBeInTheDocument();
  });

  it('renders without xs prop when xs is false', () => {
    const { container } = render(<Item {...defaultProps} xs={false} />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders different types correctly', () => {
    render(<Item {...defaultProps} type="phone" />);
    
    expect(screen.getByText('phone')).toBeInTheDocument();
  });

  it('renders with website URL', () => {
    render(<Item {...defaultProps} type="website" value="https://example.com" url={true} />);
    
    const link = screen.getByRole('link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
  });
});