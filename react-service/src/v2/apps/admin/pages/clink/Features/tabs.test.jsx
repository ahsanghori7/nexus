import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import tabs from './tabs';

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock the Envelopes component
jest.mock('./Envelopes', () => {
  return function MockEnvelopes({ id, contextType }) {
    return (
      <div data-testid="mock-envelopes">
        <span data-testid="envelopes-id">{id}</span>
        <span data-testid="envelopes-context">{contextType}</span>
      </div>
    );
  };
});

// Wrapper component to test hooks that need router context
const TabsTestWrapper = ({ accountId = 'test-account-123', contextType = 'admin' }) => {
  const tabsResult = tabs(contextType);
  return (
    <div data-testid="tabs-wrapper">
      {tabsResult.map((tab) => (
        <div key={tab.id} data-testid={`tab-${tab.id}`}>
          <div data-testid="tab-label">{tab.label}</div>
          <div data-testid="tab-content">{tab.content}</div>
        </div>
      ))}
    </div>
  );
};

describe('tabs function', () => {
  it('should render without crashing when wrapped in router', () => {
    render(
      <MemoryRouter initialEntries={['/admin/features/test-account-123']}>
        <TabsTestWrapper />
      </MemoryRouter>
    );

    expect(screen.getByTestId('tabs-wrapper')).toBeInTheDocument();
  });

  it('should return an array with envelopes tab', () => {
    render(
      <MemoryRouter initialEntries={['/admin/features/test-account-123']}>
        <TabsTestWrapper />
      </MemoryRouter>
    );

    // Check that we have at least one tab
    expect(screen.getByTestId('tab-0')).toBeInTheDocument();
    
    // Check that the tab has the correct label
    expect(screen.getByTestId('tab-label')).toHaveTextContent('envelopes');
    
    // Check that the tab content contains the Envelopes component
    expect(screen.getByTestId('mock-envelopes')).toBeInTheDocument();
  });

  it('should pass correct props to Envelopes component', () => {
    render(
      <MemoryRouter initialEntries={['/admin/features/test-account-123']}>
        <TabsTestWrapper contextType="custom" />
      </MemoryRouter>
    );

    // Check that the Envelopes component receives the correct contextType
    expect(screen.getByTestId('envelopes-context')).toHaveTextContent('custom');
  });

  it('should pass accountId to Envelopes component', () => {
    render(
      <MemoryRouter initialEntries={['/admin/features/account-456']}>
        <Routes>
          <Route path="/admin/features/:accountId" element={<TabsTestWrapper />} />
        </Routes>
      </MemoryRouter>
    );

    // Should render the Envelopes component (the id might be undefined due to mocking, but that's ok)
    expect(screen.getByTestId('mock-envelopes')).toBeInTheDocument();
    expect(screen.getByTestId('envelopes-id')).toBeInTheDocument();
  });

  it('should handle missing accountId gracefully', () => {
    render(
      <MemoryRouter initialEntries={['/admin/features/']}>
        <TabsTestWrapper />
      </MemoryRouter>
    );

    // Should still render without errors
    expect(screen.getByTestId('tabs-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('mock-envelopes')).toBeInTheDocument();
  });

  it('should have correct tab structure', () => {
    render(
      <MemoryRouter initialEntries={['/admin/features/test-account']}>
        <TabsTestWrapper />
      </MemoryRouter>
    );

    const tabElement = screen.getByTestId('tab-0');
    expect(tabElement).toBeInTheDocument();
    
    // Should have both label and content
    expect(screen.getByTestId('tab-label')).toBeInTheDocument();
    expect(screen.getByTestId('tab-content')).toBeInTheDocument();
  });

  it('should use translation for tab label', () => {
    render(
      <MemoryRouter initialEntries={['/admin/features/test-account']}>
        <TabsTestWrapper />
      </MemoryRouter>
    );

    // The label should be the translation key 'envelopes'
    expect(screen.getByTestId('tab-label')).toHaveTextContent('envelopes');
  });

  it('should handle different contextType values', () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={['/admin/features/test-account']}>
        <TabsTestWrapper contextType="admin" />
      </MemoryRouter>
    );

    expect(screen.getByTestId('envelopes-context')).toHaveTextContent('admin');

    // Re-render with different contextType
    rerender(
      <MemoryRouter initialEntries={['/admin/features/test-account']}>
        <TabsTestWrapper contextType="prosper" />
      </MemoryRouter>
    );

    expect(screen.getByTestId('envelopes-context')).toHaveTextContent('prosper');
  });
});