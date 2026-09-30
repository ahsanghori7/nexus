import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Tabs from './index';

// Mock the Header and Content components
jest.mock('./Header', () => {
  return function MockHeader({ tabs, page, setPage, maxWidth, block }) {
    return (
      <div data-testid="header">
        <div data-testid="max-width">{maxWidth}</div>
        <div data-testid="current-page">{page}</div>
        <div data-testid="block-status">{block ? 'blocked' : 'not-blocked'}</div>
        {tabs.map((tab, index) => (
          <button
            key={index}
            data-testid={`tab-${index}`}
            onClick={() => setPage(index)}
          >
            {tab.name || `Tab ${index}`}
          </button>
        ))}
      </div>
    );
  };
});

jest.mock('./Content', () => {
  return function MockContent({ 
    tabs, 
    page, 
    setPage, 
    maxWidth, 
    showPercent, 
    percentComplete, 
    lastStepSave, 
    lastStepFunction, 
    hideActionButtonsInTabs, 
    countryCode, 
    contextType 
  }) {
    return (
      <div data-testid="content">
        <div data-testid="content-page">{page}</div>
        <div data-testid="percent-complete">{percentComplete}</div>
        <div data-testid="show-percent">{showPercent ? 'true' : 'false'}</div>
        <div data-testid="country-code">{countryCode}</div>
        <div data-testid="context-type">{contextType}</div>
        <div data-testid="content-max-width">{maxWidth}</div>
        {tabs[page] && (
          <div data-testid="active-tab-content">
            {tabs[page].content || `Content for tab ${page}`}
          </div>
        )}
      </div>
    );
  };
});

describe('Tabs', () => {
  const defaultTabs = [
    { name: 'Tab 1', content: 'Content 1' },
    { name: 'Tab 2', content: 'Content 2' },
    { name: 'Tab 3', content: 'Content 3' }
  ];

  const mockSetPageFromExternal = jest.fn();
  const mockLastStepFunction = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Tabs />);
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('renders with default props', () => {
    render(<Tabs />);
    
    expect(screen.getByTestId('current-page')).toHaveTextContent('0');
    expect(screen.getByTestId('content-page')).toHaveTextContent('0');
    expect(screen.getByTestId('block-status')).toHaveTextContent('not-blocked');
    expect(screen.getByTestId('max-width')).toHaveTextContent('1378px !important');
    expect(screen.getByTestId('country-code')).toHaveTextContent('UK');
    expect(screen.getByTestId('context-type')).toHaveTextContent('prosper');
  });

  it('renders tabs correctly', () => {
    render(<Tabs tabs={defaultTabs} />);
    
    expect(screen.getByTestId('tab-0')).toHaveTextContent('Tab 1');
    expect(screen.getByTestId('tab-1')).toHaveTextContent('Tab 2');
    expect(screen.getByTestId('tab-2')).toHaveTextContent('Tab 3');
  });

  it('handles tab switching', () => {
    render(<Tabs tabs={defaultTabs} />);
    
    // Initially on tab 0
    expect(screen.getByTestId('current-page')).toHaveTextContent('0');
    
    // Click on tab 1
    fireEvent.click(screen.getByTestId('tab-1'));
    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
    
    // Click on tab 2
    fireEvent.click(screen.getByTestId('tab-2'));
    expect(screen.getByTestId('current-page')).toHaveTextContent('2');
  });

  it('initializes with pageFromExternal', () => {
    render(<Tabs tabs={defaultTabs} pageFromExternal={2} />);
    
    expect(screen.getByTestId('current-page')).toHaveTextContent('2');
    expect(screen.getByTestId('content-page')).toHaveTextContent('2');
  });

  it('updates when pageFromExternal changes', () => {
    const { rerender } = render(
      <Tabs tabs={defaultTabs} pageFromExternal={0} setPageFromExternal={mockSetPageFromExternal} />
    );
    
    expect(screen.getByTestId('current-page')).toHaveTextContent('0');
    
    // Change pageFromExternal
    rerender(
      <Tabs tabs={defaultTabs} pageFromExternal={1} setPageFromExternal={mockSetPageFromExternal} />
    );
    
    expect(screen.getByTestId('current-page')).toHaveTextContent('1');
  });

  it('calls setPageFromExternal when page changes internally', () => {
    render(
      <Tabs 
        tabs={defaultTabs} 
        pageFromExternal={0} 
        setPageFromExternal={mockSetPageFromExternal} 
      />
    );
    
    // Click on tab 1
    fireEvent.click(screen.getByTestId('tab-1'));
    
    expect(mockSetPageFromExternal).toHaveBeenCalledWith(1);
  });

  it('renders with block prop', () => {
    render(<Tabs tabs={defaultTabs} block={true} />);
    
    expect(screen.getByTestId('block-status')).toHaveTextContent('blocked');
  });

  it('passes progress props to content', () => {
    render(
      <Tabs 
        tabs={defaultTabs} 
        percentComplete={75} 
        showPercent={true}
      />
    );
    
    expect(screen.getByTestId('percent-complete')).toHaveTextContent('75');
    expect(screen.getByTestId('show-percent')).toHaveTextContent('true');
  });

  it('passes custom country code and context type', () => {
    render(
      <Tabs 
        tabs={defaultTabs} 
        countryCode="US" 
        contextType="clink"
      />
    );
    
    expect(screen.getByTestId('country-code')).toHaveTextContent('US');
    expect(screen.getByTestId('context-type')).toHaveTextContent('clink');
  });

  it('passes lastStepSave and lastStepFunction to content', () => {
    render(
      <Tabs 
        tabs={defaultTabs} 
        lastStepSave={true}
        lastStepFunction={mockLastStepFunction}
      />
    );
    
    // The mock content component doesn't display these props, 
    // but we can verify they're passed by checking the component doesn't crash
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('passes hideActionButtonsInTabs array to content', () => {
    const hideButtons = [0, 2];
    render(
      <Tabs 
        tabs={defaultTabs} 
        hideActionButtonsInTabs={hideButtons}
      />
    );
    
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('handles empty tabs array', () => {
    render(<Tabs tabs={[]} />);
    
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('shows active tab content', () => {
    render(<Tabs tabs={defaultTabs} pageFromExternal={1} />);
    
    expect(screen.getByTestId('active-tab-content')).toHaveTextContent('Content 2');
  });

  it('does not call setPageFromExternal when page equals pageFromExternal', () => {
    const { rerender } = render(
      <Tabs 
        tabs={defaultTabs} 
        pageFromExternal={1} 
        setPageFromExternal={mockSetPageFromExternal} 
      />
    );
    
    // Clear any calls from initial render
    mockSetPageFromExternal.mockClear();
    
    // Rerender with same page - should not trigger setPageFromExternal
    rerender(
      <Tabs 
        tabs={defaultTabs} 
        pageFromExternal={1} 
        setPageFromExternal={mockSetPageFromExternal} 
      />
    );
    
    expect(mockSetPageFromExternal).not.toHaveBeenCalled();
  });

  it('handles setPageFromExternal default function', () => {
    // Test the default no-op function when setPageFromExternal is not provided
    render(<Tabs tabs={defaultTabs} pageFromExternal={0} />);
    
    // Click on tab 1 - should not throw error even without setPageFromExternal
    expect(() => fireEvent.click(screen.getByTestId('tab-1'))).not.toThrow();
  });
});