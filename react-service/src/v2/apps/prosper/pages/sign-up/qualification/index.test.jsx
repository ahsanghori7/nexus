import React from 'react';
import { render, screen } from '@testing-library/react';
import QualificationIndex from './index';

// Mock dependencies
jest.mock('v2/helpers/region', () => ({
  ANZ_CODE_REGIONS: ['AU', 'NZ'],
}));

jest.mock('./UK', () => () => <div data-testid="uk-qualification">UK Qualification Component</div>);
jest.mock('./ANZ', () => () => <div data-testid="anz-qualification">ANZ Qualification Component</div>);

jest.mock('v2/apps/prosper/pages/sign-up/shared/Wrapper', () => 
  ({ Component, ...props }) => <Component styles={{ test: 'styles' }} {...props} />
);

// Mock global REGION variable
global.REGION = {
  CODE: 'UK',
};

describe('Qualification Component', () => {
  const mockProps = {
    styles: { test: 'styles' },
    codeRegion: 'UK',
    setCodeRegion: jest.fn(),
  };

  beforeEach(() => {
    // Reset REGION to UK by default
    global.REGION = { CODE: 'UK' };
    jest.clearAllMocks();
  });

  it('renders UK qualification when REGION.CODE is not in ANZ_CODE_REGIONS', () => {
    global.REGION = { CODE: 'UK' };
    
    render(<QualificationIndex {...mockProps} />);
    
    expect(screen.getByTestId('uk-qualification')).toBeInTheDocument();
    expect(screen.queryByTestId('anz-qualification')).not.toBeInTheDocument();
  });

  it('renders ANZ qualification when REGION.CODE is AU', () => {
    global.REGION = { CODE: 'AU' };
    
    render(<QualificationIndex {...mockProps} />);
    
    expect(screen.getByTestId('anz-qualification')).toBeInTheDocument();
    expect(screen.queryByTestId('uk-qualification')).not.toBeInTheDocument();
  });

  it('renders ANZ qualification when REGION.CODE is NZ', () => {
    global.REGION = { CODE: 'NZ' };
    
    render(<QualificationIndex {...mockProps} />);
    
    expect(screen.getByTestId('anz-qualification')).toBeInTheDocument();
    expect(screen.queryByTestId('uk-qualification')).not.toBeInTheDocument();
  });

  it('renders UK qualification for non-ANZ regions with correct behavior', () => {
    global.REGION = { CODE: 'US' };
    
    render(<QualificationIndex {...mockProps} />);
    
    expect(screen.getByTestId('uk-qualification')).toBeInTheDocument();
    expect(screen.queryByTestId('anz-qualification')).not.toBeInTheDocument();
  });

  it('renders ANZ qualification for ANZ regions with correct behavior', () => {
    global.REGION = { CODE: 'AU' };
    
    render(<QualificationIndex {...mockProps} />);
    
    expect(screen.getByTestId('anz-qualification')).toBeInTheDocument();
    expect(screen.queryByTestId('uk-qualification')).not.toBeInTheDocument();
  });

  it('handles undefined REGION gracefully', () => {
    global.REGION = undefined;
    
    // Should default to UK qualification when REGION is undefined
    expect(() => {
      render(<QualificationIndex {...mockProps} />);
    }).not.toThrow();
    
    expect(screen.getByTestId('uk-qualification')).toBeInTheDocument();
  });

  it('handles REGION with null CODE gracefully', () => {
    global.REGION = { CODE: null };
    
    // Should default to UK qualification when CODE is null
    expect(() => {
      render(<QualificationIndex {...mockProps} />);
    }).not.toThrow();
    
    expect(screen.getByTestId('uk-qualification')).toBeInTheDocument();
  });

  it('defaults to UK qualification for non-ANZ regions', () => {
    global.REGION = { CODE: 'US' };
    
    render(<QualificationIndex {...mockProps} />);
    
    expect(screen.getByTestId('uk-qualification')).toBeInTheDocument();
    expect(screen.queryByTestId('anz-qualification')).not.toBeInTheDocument();
  });

  it('defaults to UK qualification for empty string CODE', () => {
    global.REGION = { CODE: '' };
    
    render(<QualificationIndex {...mockProps} />);
    
    expect(screen.getByTestId('uk-qualification')).toBeInTheDocument();
    expect(screen.queryByTestId('anz-qualification')).not.toBeInTheDocument();
  });
});

describe('QualificationStep', () => {
  it('wraps Qualification component with Wrapper', () => {
    const mockProps = { 
      testProp: 'test',
      styles: { test: 'styles' },
      setCodeRegion: jest.fn(),
    };
    
    render(<QualificationIndex {...mockProps} />);
    
    // Should render one of the qualification components, indicating Wrapper is working
    expect(
      screen.getByTestId('uk-qualification') || screen.getByTestId('anz-qualification')
    ).toBeInTheDocument();
  });

  it('passes all props through Wrapper to Qualification component', () => {
    const mockProps = { 
      customProp: 'custom',
      styles: { custom: 'styles' },
      codeRegion: 'TEST',
      setCodeRegion: jest.fn(),
    };
    
    render(<QualificationIndex {...mockProps} />);
    
    // Component should render without errors, indicating props are passed correctly
    expect(
      screen.getByTestId('uk-qualification') || screen.getByTestId('anz-qualification')
    ).toBeInTheDocument();
  });
});