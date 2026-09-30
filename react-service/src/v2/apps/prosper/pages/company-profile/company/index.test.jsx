import React from 'react';
import { render, screen } from '@testing-library/react';
import Company from './index';

// Mock the Contact component (already tested separately)
jest.mock('./Contact', () => ({ src, companyName, children, pt }) => (
  <div data-testid="contact-component" data-src={src} data-company-name={companyName}>
    {children}
  </div>
));

// Mock the CRM components
jest.mock('v2/apps/prosper/shared/crm-components/Item', () => ({ 
  icon, type, value, url, loading, mt, gridSx, ...props 
}) => {
  if (loading) {
    return <div data-testid={`item-loading-${type}`}>Loading...</div>;
  }

  return (
    <div 
      data-testid={`item-${type}`}
      data-value={value}
      data-url={url}
      {...props}
    >
      {icon && <img src={icon} alt={`${type}-icon`} />}
      {url ? (
        <a href={value} target="_blank" rel="noopener noreferrer">
          {value}
        </a>
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
});

jest.mock('v2/apps/prosper/shared/crm-components/Description', () => ({ 
  gridSx, 
  text, 
  fontSx, 
  descFontSx, 
  loading, 
  ...props 
}) => {
  if (loading) {
    return <div data-testid="description-loading">Loading description...</div>;
  }

  if (!text) {
    return null;
  }

  return (
    <div 
      data-testid="description"
      data-text={text}
      {...props}
    >
      {text}
    </div>
  );
});

// Mock clink-components constants
jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      iconPurpleWebsite: 'https://example.com/purple-website-icon.png'
    }
  }
}));

describe('Company Component', () => {
  const defaultProps = {
    src: 'https://example.com/company-logo.png',
    companyName: 'Test Company',
    description: 'This is a test company description',
    website: 'https://testcompany.com',
    loading: false
  };

  it('should render without crashing', () => {
    render(<Company {...defaultProps} />);
    
    expect(screen.getByTestId('contact-component')).toBeInTheDocument();
    expect(screen.getAllByText('This is a test company description')).toHaveLength(2);
  });

  it('should pass correct props to Contact component', () => {
    render(<Company {...defaultProps} />);
    
    const contactComponent = screen.getByTestId('contact-component');
    expect(contactComponent).toHaveAttribute('data-src', 'https://example.com/company-logo.png');
    expect(contactComponent).toHaveAttribute('data-company-name', 'Test Company');
  });

  it('should render description when provided', () => {
    render(<Company {...defaultProps} />);
    
    expect(screen.getAllByTestId('description')).toHaveLength(2);
    expect(screen.getAllByText('This is a test company description')).toHaveLength(2);
  });

  it('should render website item when website is provided', () => {
    render(<Company {...defaultProps} />);
    
    const websiteItem = screen.getByTestId('item-profile-website');
    expect(websiteItem).toBeInTheDocument();
    expect(websiteItem).toHaveAttribute('data-value', 'https://testcompany.com');
    expect(websiteItem).toHaveAttribute('data-url', 'true');
  });

  it('should not render website item when website is not provided', () => {
    render(<Company {...defaultProps} website={null} />);
    
    expect(screen.queryByTestId('item-profile-website')).not.toBeInTheDocument();
  });

  it('should not render website item when website is empty string', () => {
    render(<Company {...defaultProps} website="" />);
    
    expect(screen.queryByTestId('item-profile-website')).not.toBeInTheDocument();
  });

  it('should show loading state when loading is true', () => {
    render(<Company {...defaultProps} loading={true} />);
    
    expect(screen.getAllByTestId('description-loading')).toHaveLength(2);
    expect(screen.getByTestId('item-loading-profile-website')).toBeInTheDocument();
  });

  it('should handle missing description gracefully', () => {
    render(<Company {...defaultProps} description={null} />);
    
    expect(screen.queryByTestId('description')).not.toBeInTheDocument();
    expect(screen.getByTestId('contact-component')).toBeInTheDocument();
  });

  it('should render DescWrapper in both responsive breakpoints', () => {
    render(<Company {...defaultProps} />);
    
    // Should render description twice (one for each responsive state)
    const descriptions = screen.getAllByTestId('description');
    expect(descriptions).toHaveLength(2);
  });

  it('should handle loading false explicitly', () => {
    render(<Company {...defaultProps} loading={false} />);
    
    expect(screen.queryByTestId('description-loading')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('description')).toHaveLength(2);
  });

  it('should use default loading value when not provided', () => {
    const { loading, ...propsWithoutLoading } = defaultProps;
    render(<Company {...propsWithoutLoading} />);
    
    // Should not show loading state when loading prop is omitted (defaults to false)
    expect(screen.queryByTestId('description-loading')).not.toBeInTheDocument();
    expect(screen.getAllByTestId('description')).toHaveLength(2);
  });
});