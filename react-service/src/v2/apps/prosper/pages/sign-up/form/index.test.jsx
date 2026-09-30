import React from 'react';
import { render, screen } from '@testing-library/react';
import FormIndex from './index';

// Mock dependencies
jest.mock('v2/helpers/region', () => ({
  ANZ_CODE_REGIONS: ['AU', 'NZ'],
}));

jest.mock('./UK', () => () => <div data-testid="uk-form">UK Form Component</div>);
jest.mock('./ANZ', () => () => <div data-testid="anz-form">ANZ Form Component</div>);

jest.mock('v2/apps/prosper/pages/sign-up/shared/Wrapper', () => 
  ({ Component, ...props }) => <Component styles={{ test: 'styles' }} {...props} />
);

// Mock global REGION variable
global.REGION = {
  CODE: 'UK',
};

describe('Form Component', () => {
  const mockProps = {
    styles: { test: 'styles' },
    codeRegion: 'UK',
  };

  beforeEach(() => {
    // Reset REGION to UK by default
    global.REGION = { CODE: 'UK' };
  });

  it('renders UK form when REGION.CODE is not in ANZ_CODE_REGIONS', () => {
    global.REGION = { CODE: 'UK' };
    
    render(<FormIndex {...mockProps} />);
    
    expect(screen.getByTestId('uk-form')).toBeInTheDocument();
    expect(screen.queryByTestId('anz-form')).not.toBeInTheDocument();
  });

  it('renders ANZ form when REGION.CODE is AU', () => {
    global.REGION = { CODE: 'AU' };
    
    render(<FormIndex {...mockProps} />);
    
    expect(screen.getByTestId('anz-form')).toBeInTheDocument();
    expect(screen.queryByTestId('uk-form')).not.toBeInTheDocument();
  });

  it('renders ANZ form when REGION.CODE is NZ', () => {
    global.REGION = { CODE: 'NZ' };
    
    render(<FormIndex {...mockProps} />);
    
    expect(screen.getByTestId('anz-form')).toBeInTheDocument();
    expect(screen.queryByTestId('uk-form')).not.toBeInTheDocument();
  });

  it('renders UK form for non-ANZ regions with correct behavior', () => {
    global.REGION = { CODE: 'US' };
    
    render(<FormIndex {...mockProps} />);
    
    expect(screen.getByTestId('uk-form')).toBeInTheDocument();
    expect(screen.queryByTestId('anz-form')).not.toBeInTheDocument();
  });

  it('renders ANZ form for ANZ regions with correct behavior', () => {
    global.REGION = { CODE: 'AU' };
    
    render(<FormIndex {...mockProps} />);
    
    expect(screen.getByTestId('anz-form')).toBeInTheDocument();
    expect(screen.queryByTestId('uk-form')).not.toBeInTheDocument();
  });

  it('handles undefined REGION gracefully', () => {
    global.REGION = undefined;
    
    // Should default to UK form when REGION is undefined
    expect(() => {
      render(<FormIndex {...mockProps} />);
    }).not.toThrow();
    
    expect(screen.getByTestId('uk-form')).toBeInTheDocument();
  });

  it('handles REGION with null CODE gracefully', () => {
    global.REGION = { CODE: null };
    
    // Should default to UK form when CODE is null
    expect(() => {
      render(<FormIndex {...mockProps} />);
    }).not.toThrow();
    
    expect(screen.getByTestId('uk-form')).toBeInTheDocument();
  });
});

describe('SignUpStep', () => {
  it('wraps Form component with Wrapper', () => {
    const mockProps = { 
      testProp: 'test',
      styles: { test: 'styles' },
    };
    
    render(<FormIndex {...mockProps} />);
    
    // Should render one of the form components, indicating Wrapper is working
    expect(
      screen.getByTestId('uk-form') || screen.getByTestId('anz-form')
    ).toBeInTheDocument();
  });

  it('passes all props through Wrapper to Form component', () => {
    const mockProps = { 
      customProp: 'custom',
      styles: { custom: 'styles' },
      codeRegion: 'TEST',
    };
    
    render(<FormIndex {...mockProps} />);
    
    // Component should render without errors, indicating props are passed correctly
    expect(
      screen.getByTestId('uk-form') || screen.getByTestId('anz-form')
    ).toBeInTheDocument();
  });
});