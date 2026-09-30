import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './header';

describe('Header', () => {
  const mockFiltersConfig = [
    {
      type: 'recent',
      label: 'Recent',
      count: 5,
      applyFilter: jest.fn()
    },
    {
      type: 'archived',
      label: 'Archived', 
      count: 3,
      applyFilter: jest.fn()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <Header 
        filtersConfig={mockFiltersConfig}
        filter="recent"
      />
    );
    
    expect(screen.getByText('Recent')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('displays filter labels and counts correctly', () => {
    render(
      <Header 
        filtersConfig={mockFiltersConfig}
        filter="recent"
      />
    );
    
    expect(screen.getByText('Recent')).toBeInTheDocument();
    expect(screen.getByText('(5)')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();
    expect(screen.getByText('(3)')).toBeInTheDocument();
  });

  it('calls applyFilter when filter button is clicked', () => {
    render(
      <Header 
        filtersConfig={mockFiltersConfig}
        filter="recent"
      />
    );
    
    const recentButton = screen.getByText('Recent').closest('button');
    fireEvent.click(recentButton);
    
    expect(mockFiltersConfig[0].applyFilter).toHaveBeenCalledTimes(1);
  });

  it('handles filter=false correctly', () => {
    render(
      <Header 
        filtersConfig={mockFiltersConfig}
        filter={false}
      />
    );
    
    // All buttons should be inactive when filter is false
    expect(screen.getByText('Recent')).toBeInTheDocument();
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('renders with zero counts correctly', () => {
    const configWithZeroCounts = [
      {
        type: 'recent',
        label: 'Recent',
        count: 0,
        applyFilter: jest.fn()
      }
    ];

    render(
      <Header 
        filtersConfig={configWithZeroCounts}
        filter="recent"
      />
    );
    
    expect(screen.getByText('(0)')).toBeInTheDocument();
  });

  it('renders with undefined counts correctly', () => {
    const configWithUndefinedCounts = [
      {
        type: 'recent',
        label: 'Recent',
        applyFilter: jest.fn()
      }
    ];

    render(
      <Header 
        filtersConfig={configWithUndefinedCounts}
        filter="recent"
      />
    );
    
    expect(screen.getByText('(0)')).toBeInTheDocument();
  });

  it('handles archived filter activation correctly', () => {
    render(
      <Header 
        filtersConfig={mockFiltersConfig}
        filter="archived"
      />
    );
    
    const archivedButton = screen.getByText('Archived').closest('button');
    fireEvent.click(archivedButton);
    
    expect(mockFiltersConfig[1].applyFilter).toHaveBeenCalledTimes(1);
  });
});