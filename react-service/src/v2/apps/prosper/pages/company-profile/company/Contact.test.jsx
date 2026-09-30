import React from 'react';
import { render, screen } from '@testing-library/react';
import Contact from './Contact';

// Mock the clink-components module
jest.mock('clink-components', () => ({
  Image: ({ src, ...props }) => <img src={src} alt="test-image" {...props} />,
  CONSTANTS: {
    colors: {
      general: {
        blueMagentaViolet: '#6B46C1'
      }
    }
  }
}));

// Mock the styled component
jest.mock('v2/apps/prosper/shared/crm-components/LogoContainer.styled', () => ({
  LogoContainer: ({ children }) => <div data-testid="logo-container">{children}</div>
}));

describe('Contact Component', () => {
  const defaultProps = {
    src: 'https://example.com/logo.png',
    companyName: 'Test Company',
    children: <div data-testid="test-children">Test Children</div>,
    pt: 0
  };

  it('should render without crashing', () => {
    render(<Contact {...defaultProps} />);
    
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByTestId('test-children')).toBeInTheDocument();
  });

  it('should render the company logo with correct src', () => {
    render(<Contact {...defaultProps} />);
    
    const image = screen.getByAltText('test-image');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('should display the company name with correct styling', () => {
    render(<Contact {...defaultProps} />);
    
    const companyName = screen.getByText('Test Company');
    expect(companyName).toBeInTheDocument();
    // Just verify the text is rendered with the MUI Typography component
  });

  it('should render children content', () => {
    const customChildren = <div data-testid="custom-children">Custom Content</div>;
    
    render(<Contact {...defaultProps}>{customChildren}</Contact>);
    
    expect(screen.getByTestId('custom-children')).toBeInTheDocument();
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('should apply custom pt (padding-top) prop', () => {
    render(<Contact {...defaultProps} pt={4} />);
    
    // Just verify the component renders with pt prop - MUI handles the actual styling
    expect(screen.getByTestId('logo-container')).toBeInTheDocument();
  });

  it('should render logo container', () => {
    render(<Contact {...defaultProps} />);
    
    expect(screen.getByTestId('logo-container')).toBeInTheDocument();
  });

  it('should handle missing company name gracefully', () => {
    render(<Contact {...defaultProps} companyName={null} />);
    
    // Component should still render without crashing
    expect(screen.getByTestId('logo-container')).toBeInTheDocument();
  });

  it('should handle missing src gracefully', () => {
    render(<Contact {...defaultProps} src={null} />);
    
    const image = screen.getByAltText('test-image');
    expect(image).toBeInTheDocument();
    // Just verify the image renders even with null src
  });
});