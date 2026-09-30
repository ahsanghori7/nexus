import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import manager from './widget-manager';

// Mock the helper modules
jest.mock('v2/helpers/region', () => ({
  UK: { id: 'uk' },
  NZ: { id: 'nz' },
  AUS: { id: 'aus' }
}));

// Mock the OpportunityViewer component
jest.mock('./opportunity-viewer', () => {
  return ({ idRegion }) => (
    <div data-testid="opportunity-viewer">
      OpportunityViewer with region: {idRegion}
    </div>
  );
});

// Mock global ENV variable
const originalEnv = global.ENV;

describe('widget-manager', () => {
  beforeEach(() => {
    // Reset ENV before each test
    global.ENV = undefined;
  });

  afterAll(() => {
    // Restore original ENV
    global.ENV = originalEnv;
  });

  it('returns OpportunityViewer component for opportunity-viewer widget', () => {
    const Component = manager('opportunity-viewer');
    render(<Component />);
    
    expect(screen.getByTestId('opportunity-viewer')).toBeInTheDocument();
    expect(screen.getByText(/OpportunityViewer with region: uk/)).toBeInTheDocument();
  });

  it('returns NOT FOUND component for unknown widget', () => {
    const Component = manager('unknown-widget');
    render(<Component />);
    
    expect(screen.getByText('NOT FOUND')).toBeInTheDocument();
  });

  it('returns NOT FOUND component for empty widget name', () => {
    const Component = manager('');
    render(<Component />);
    
    expect(screen.getByText('NOT FOUND')).toBeInTheDocument();
  });

  it('returns NOT FOUND component when no widget parameter provided', () => {
    const Component = manager();
    render(<Component />);
    
    expect(screen.getByText('NOT FOUND')).toBeInTheDocument();
  });

  it('uses NZ region when ENV is nz', () => {
    global.ENV = 'nz';
    const Component = manager('opportunity-viewer');
    render(<Component />);
    
    expect(screen.getByTestId('opportunity-viewer')).toBeInTheDocument();
    expect(screen.getByText(/OpportunityViewer with region: nz/)).toBeInTheDocument();
  });

  it('uses AUS region when ENV is aus', () => {
    global.ENV = 'aus';
    const Component = manager('opportunity-viewer');
    render(<Component />);
    
    expect(screen.getByTestId('opportunity-viewer')).toBeInTheDocument();
    expect(screen.getByText(/OpportunityViewer with region: aus/)).toBeInTheDocument();
  });

  it('uses NZ region when ENV is anz', () => {
    global.ENV = 'anz';
    const Component = manager('opportunity-viewer');
    render(<Component />);
    
    expect(screen.getByTestId('opportunity-viewer')).toBeInTheDocument();
    expect(screen.getByText(/OpportunityViewer with region: nz/)).toBeInTheDocument();
  });

  it('defaults to UK region when ENV is not in regionEnv mapping', () => {
    global.ENV = 'unknown-region';
    const Component = manager('opportunity-viewer');
    render(<Component />);
    
    expect(screen.getByTestId('opportunity-viewer')).toBeInTheDocument();
    expect(screen.getByText(/OpportunityViewer with region: uk/)).toBeInTheDocument();
  });

  it('defaults to UK region when ENV is undefined', () => {
    global.ENV = undefined;
    const Component = manager('opportunity-viewer');
    render(<Component />);
    
    expect(screen.getByTestId('opportunity-viewer')).toBeInTheDocument();
    expect(screen.getByText(/OpportunityViewer with region: uk/)).toBeInTheDocument();
  });

  it('returns a function that renders a React component', () => {
    const Component = manager('opportunity-viewer');
    
    expect(typeof Component).toBe('function');
    
    // Verify it's a valid React component function
    const element = Component();
    expect(React.isValidElement(element)).toBe(true);
  });

  it('handles case sensitivity for widget names', () => {
    const Component = manager('OPPORTUNITY-VIEWER');
    render(<Component />);
    
    expect(screen.getByText('NOT FOUND')).toBeInTheDocument();
  });

  it('returns NOT FOUND for null widget parameter', () => {
    const Component = manager(null);
    render(<Component />);
    
    expect(screen.getByText('NOT FOUND')).toBeInTheDocument();
  });

  it('returns NOT FOUND for numeric widget parameter', () => {
    const Component = manager(123);
    render(<Component />);
    
    expect(screen.getByText('NOT FOUND')).toBeInTheDocument();
  });

  describe('regionEnv mapping', () => {
    it('correctly maps nz environment', () => {
      global.ENV = 'nz';
      const Component = manager('opportunity-viewer');
      render(<Component />);
      
      expect(screen.getByText(/region: nz/)).toBeInTheDocument();
    });

    it('correctly maps aus environment', () => {
      global.ENV = 'aus';
      const Component = manager('opportunity-viewer');
      render(<Component />);
      
      expect(screen.getByText(/region: aus/)).toBeInTheDocument();
    });

    it('correctly maps anz environment to nz region', () => {
      global.ENV = 'anz';
      const Component = manager('opportunity-viewer');
      render(<Component />);
      
      expect(screen.getByText(/region: nz/)).toBeInTheDocument();
    });
  });
});