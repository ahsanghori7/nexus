import React from 'react';
import { render, screen } from '@testing-library/react';
import useConfig from './hooks';

// Mock dependencies
jest.mock('@mui/material/Skeleton', () => ({ variant, width, height, ...props }) => (
  <div 
    data-testid="skeleton" 
    data-variant={variant}
    data-width={width}
    data-height={height}
    {...props}
  />
));

jest.mock('./columns', () => jest.fn(() => [
  {
    key: { one: true },
    title: 'Columns Layout',
    content: <div data-testid="columns-content">Columns Content</div>
  }
]));

jest.mock('./grid-v2', () => jest.fn(() => [
  {
    key: { one: true },
    title: 'Grid Layout',
    content: <div data-testid="grid-content">Grid Content</div>
  }
]));

jest.mock('./min-grid', () => jest.fn(() => [
  {
    key: { one: true },
    title: 'Min Grid Layout',
    content: <div data-testid="min-grid-content">Min Grid Content</div>
  }
]));

jest.mock('./min-grid-2', () => jest.fn(() => [
  {
    key: { one: true },
    title: 'Min Grid 2 Layout',
    content: <div data-testid="min-grid-2-content">Min Grid 2 Content</div>
  }
]));

// Test component to test the hook
const TestComponent = ({ layout, opportunities, enquiries, subcontractor, dispatch }) => {
  const config = useConfig(layout, opportunities, enquiries, subcontractor, dispatch);
  
  return (
    <div data-testid="test-component">
      {config.map((item, index) => (
        <div key={index} data-testid={`config-item-${index}`}>
          <div data-testid={`title-${index}`}>{item.title}</div>
          <div data-testid={`content-${index}`}>{item.content}</div>
        </div>
      ))}
    </div>
  );
};

describe('useConfig hook', () => {
  const mockDispatch = jest.fn();
  const mockOpportunities = { data: [] };
  const mockEnquiries = { data: [] };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns skeleton when subcontractor is null', () => {
    render(
      <TestComponent 
        subcontractor={null}
        opportunities={mockOpportunities}
        enquiries={mockEnquiries}
        dispatch={mockDispatch}
      />
    );

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('returns skeleton when subcontractor has no country', () => {
    const subcontractor = { id: 1 };
    
    render(
      <TestComponent 
        subcontractor={subcontractor}
        opportunities={mockOpportunities}
        enquiries={mockEnquiries}
        dispatch={mockDispatch}
      />
    );

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('returns skeleton when subcontractor country has no code', () => {
    const subcontractor = { id: 1, country: {} };
    
    render(
      <TestComponent 
        subcontractor={subcontractor}
        opportunities={mockOpportunities}
        enquiries={mockEnquiries}
        dispatch={mockDispatch}
      />
    );

    const skeletons = screen.getAllByTestId('skeleton');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('returns minGrid for EU country', () => {
    const subcontractor = { id: 1, country: { code: 'EU' } };
    const minGrid = require('./min-grid');
    
    render(
      <TestComponent 
        subcontractor={subcontractor}
        opportunities={mockOpportunities}
        enquiries={mockEnquiries}
        dispatch={mockDispatch}
      />
    );

    expect(minGrid).toHaveBeenCalledWith(mockEnquiries, mockDispatch);
    expect(screen.getByTestId('min-grid-content')).toBeInTheDocument();
  });

  it('returns minGrid2 for AUS country', () => {
    const subcontractor = { id: 1, country: { code: 'AUS' } };
    const minGrid2 = require('./min-grid-2');
    
    render(
      <TestComponent 
        subcontractor={subcontractor}
        opportunities={mockOpportunities}
        enquiries={mockEnquiries}
        dispatch={mockDispatch}
      />
    );

    expect(minGrid2).toHaveBeenCalledWith(mockOpportunities, mockEnquiries, subcontractor, mockDispatch);
    expect(screen.getByTestId('min-grid-2-content')).toBeInTheDocument();
  });

  it('returns minGrid2 for NZ country', () => {
    const subcontractor = { id: 1, country: { code: 'NZ' } };
    const minGrid2 = require('./min-grid-2');
    
    render(
      <TestComponent 
        subcontractor={subcontractor}
        opportunities={mockOpportunities}
        enquiries={mockEnquiries}
        dispatch={mockDispatch}
      />
    );

    expect(minGrid2).toHaveBeenCalledWith(mockOpportunities, mockEnquiries, subcontractor, mockDispatch);
    expect(screen.getByTestId('min-grid-2-content')).toBeInTheDocument();
  });

  it('returns grid2 for grid layout', () => {
    const subcontractor = { id: 1, country: { code: 'UK' } };
    const grid2 = require('./grid-v2');
    
    render(
      <TestComponent 
        layout="grid"
        subcontractor={subcontractor}
        opportunities={mockOpportunities}
        enquiries={mockEnquiries}
        dispatch={mockDispatch}
      />
    );

    expect(grid2).toHaveBeenCalledWith(mockOpportunities, mockEnquiries, subcontractor, mockDispatch);
    expect(screen.getByTestId('grid-content')).toBeInTheDocument();
  });

  it('returns columns as default layout', () => {
    const subcontractor = { id: 1, country: { code: 'UK' } };
    const columns = require('./columns');
    
    render(
      <TestComponent 
        layout="columns"
        subcontractor={subcontractor}
        opportunities={mockOpportunities}
        enquiries={mockEnquiries}
        dispatch={mockDispatch}
      />
    );

    expect(columns).toHaveBeenCalledWith(mockOpportunities, mockEnquiries, subcontractor, mockDispatch);
    expect(screen.getByTestId('columns-content')).toBeInTheDocument();
  });

  it('returns columns when no layout specified', () => {
    const subcontractor = { id: 1, country: { code: 'UK' } };
    const columns = require('./columns');
    
    render(
      <TestComponent 
        subcontractor={subcontractor}
        opportunities={mockOpportunities}
        enquiries={mockEnquiries}
        dispatch={mockDispatch}
      />
    );

    expect(columns).toHaveBeenCalledWith(mockOpportunities, mockEnquiries, subcontractor, mockDispatch);
    expect(screen.getByTestId('columns-content')).toBeInTheDocument();
  });

  it('handles missing parameters gracefully', () => {
    const subcontractor = { id: 1, country: { code: 'UK' } };
    
    render(
      <TestComponent 
        subcontractor={subcontractor}
      />
    );

    expect(screen.getByTestId('test-component')).toBeInTheDocument();
  });
});