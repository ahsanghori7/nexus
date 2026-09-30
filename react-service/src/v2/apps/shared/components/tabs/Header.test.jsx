import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        darkJungleGreen: '#1B2124',
        blueMagentaViolet: '#6B46C1'
      }
    }
  }
}));

describe('Header', () => {
  const mockTabs = [
    { id: 'tab1', title: 'First Tab' },
    { id: 'tab2', title: 'Second Tab' },
    { id: 'tab3', title: 'Third Tab' }
  ];

  const mockSetPage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render without crashing', () => {
    render(<Header tabs={mockTabs} page={0} setPage={mockSetPage} />);
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
    expect(screen.getByTestId('mock-container')).toBeInTheDocument();
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
  });

  test('should render all tabs', () => {
    render(<Header tabs={mockTabs} page={0} setPage={mockSetPage} />);
    
    expect(screen.getByText('First Tab')).toBeInTheDocument();
    expect(screen.getByText('Second Tab')).toBeInTheDocument();
    expect(screen.getByText('Third Tab')).toBeInTheDocument();
  });

  test('should render with correct tab count', () => {
    render(<Header tabs={mockTabs} page={0} setPage={mockSetPage} />);
    
    const tabs = screen.getAllByTestId('tab');
    expect(tabs).toHaveLength(3);
  });

  test('should display current page value', () => {
    render(<Header tabs={mockTabs} page={1} setPage={mockSetPage} />);
    
    const tabsContainer = screen.getByTestId('tabs');
    expect(tabsContainer).toHaveAttribute('data-value', '1');
  });

  test('should call setPage when tab is changed', () => {
    render(<Header tabs={mockTabs} page={0} setPage={mockSetPage} />);
    
    const changeButton = screen.getByTestId('tab-change-button');
    fireEvent.click(changeButton);
    
    expect(mockSetPage).toHaveBeenCalledWith(1);
  });

  test('should render with empty tabs array', () => {
    render(<Header tabs={[]} page={0} setPage={mockSetPage} />);
    
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
    const tabs = screen.queryAllByTestId('tab');
    expect(tabs).toHaveLength(0);
  });

  test('should use default props when not provided', () => {
    render(<Header />);
    
    expect(screen.getByTestId('mui-box')).toBeInTheDocument();
    expect(screen.getByTestId('mock-container')).toBeInTheDocument();
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
  });

  test('should render with custom maxWidth', () => {
    render(<Header tabs={mockTabs} page={0} setPage={mockSetPage} maxWidth="md" />);
    
    const container = screen.getByTestId('mock-container');
    expect(container).toBeInTheDocument();
  });

  test('should apply block styling when block prop is true', () => {
    render(<Header tabs={mockTabs} page={0} setPage={mockSetPage} block={true} />);
    
    const box = screen.getByTestId('mui-box');
    expect(box).toHaveStyle({ pointerEvents: 'none' });
  });

  test('should not apply block styling when block prop is false', () => {
    render(<Header tabs={mockTabs} page={0} setPage={mockSetPage} block={false} />);
    
    const box = screen.getByTestId('mui-box');
    expect(box).toHaveStyle({ pointerEvents: 'initial' });
  });

  test('should render tabs with correct labels', () => {
    render(<Header tabs={mockTabs} page={0} setPage={mockSetPage} />);
    
    const tabs = screen.getAllByTestId('tab');
    expect(tabs[0]).toHaveAttribute('data-label', 'First Tab');
    expect(tabs[1]).toHaveAttribute('data-label', 'Second Tab');
    expect(tabs[2]).toHaveAttribute('data-label', 'Third Tab');
  });

  test('should handle single tab', () => {
    const singleTab = [{ id: 'single', title: 'Only Tab' }];
    render(<Header tabs={singleTab} page={0} setPage={mockSetPage} />);
    
    expect(screen.getByText('Only Tab')).toBeInTheDocument();
    const tabs = screen.getAllByTestId('tab');
    expect(tabs).toHaveLength(1);
  });

  test('should render without setPage function', () => {
    render(<Header tabs={mockTabs} page={0} />);
    
    expect(screen.getByTestId('tabs')).toBeInTheDocument();
    expect(screen.getByText('First Tab')).toBeInTheDocument();
  });
});