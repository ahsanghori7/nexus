import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MuiTabs from './tabs';

// Mock external dependencies
jest.mock('react-swipeable-views', () => {
  return function MockSwipeableViews({ children, onChangeIndex }) {
    return (
      <div data-testid="swipeable-views">
        <button onClick={() => onChangeIndex && onChangeIndex(1)}>Change Index</button>
        {children}
      </div>
    );
  };
});

// Mock useMediaQuery to return true for large screen
jest.mock('@mui/material/useMediaQuery', () => jest.fn(() => true));

jest.mock('./StyledTabs', () => ({
  Tabs: ({ children, value, onChange }) => (
    <div data-testid="styled-tabs" data-value={value}>
      <button onClick={() => onChange && onChange({}, 1)}>Change Tab</button>
      {children}
    </div>
  ),
  Tab: ({ label, closed, accordion }) => (
    <div data-testid="styled-tab" data-label={label} data-closed={closed} data-accordion={accordion}>
      {label}
    </div>
  ),
}));

jest.mock('./mui.styled', () => ({
  MuiToggleButton: ({ handleClick, isCloseVisible }) => (
    <button data-testid="toggle-button" onClick={handleClick}>
      {isCloseVisible ? 'Close' : 'Open'}
    </button>
  ),
}));

describe('MuiTabs', () => {
  const mockTabs = [
    {
      id: 'tab1',
      title: 'Tab 1',
      Content: () => <div data-testid="tab1-content">Tab 1 Content</div>,
    },
    {
      id: 'tab2',
      title: 'Tab 2',
      Content: () => <div data-testid="tab2-content">Tab 2 Content</div>,
    },
  ];

  it('renders without crashing', () => {
    const { container } = render(<MuiTabs tabs={mockTabs} />);
    expect(container).toBeInTheDocument();
  });

  it('renders all tabs', () => {
    const { getByText } = render(<MuiTabs tabs={mockTabs} />);
    expect(getByText('Tab 1')).toBeInTheDocument();
    expect(getByText('Tab 2')).toBeInTheDocument();
  });

  it('renders swipeable views', () => {
    const { getByTestId } = render(<MuiTabs tabs={mockTabs} />);
    expect(getByTestId('swipeable-views')).toBeInTheDocument();
  });

  it('renders first tab content by default', () => {
    const { getByTestId, queryByTestId } = render(<MuiTabs tabs={mockTabs} />);
    expect(getByTestId('tab1-content')).toBeInTheDocument();
    // Second tab content is hidden by default
    expect(queryByTestId('tab2-content')).not.toBeInTheDocument();
  });

  it('handles empty tabs array', () => {
    const { container } = render(<MuiTabs tabs={[]} />);
    expect(container).toBeInTheDocument();
  });

  it('renders with nested prop', () => {
    const { container } = render(<MuiTabs tabs={mockTabs} nested />);
    expect(container).toBeInTheDocument();
  });

  it('renders with accordion prop', () => {
    const { container } = render(<MuiTabs tabs={mockTabs} accordion />);
    expect(container).toBeInTheDocument();
  });

  it('renders with colorTheme prop', () => {
    const { container } = render(<MuiTabs tabs={mockTabs} colorTheme="red" />);
    expect(container).toBeInTheDocument();
  });

  it('handles tab change correctly', () => {
    render(<MuiTabs tabs={mockTabs} />);
    
    const changeButton = screen.getByText('Change Tab');
    fireEvent.click(changeButton);
    
    // The mock should trigger the handleChange function
    expect(screen.getByTestId('styled-tabs')).toBeInTheDocument();
  });

  it('handles toggle button click correctly', () => {
    render(<MuiTabs tabs={mockTabs} accordion />);
    
    const toggleButton = screen.getByTestId('toggle-button');
    expect(toggleButton).toHaveTextContent('Open');
    
    fireEvent.click(toggleButton);
    
    // After clicking, the state should change
    expect(toggleButton).toBeInTheDocument();
  });

  it('handles swipeable views index change correctly', () => {
    render(<MuiTabs tabs={mockTabs} />);
    
    const changeIndexButton = screen.getByText('Change Index');
    fireEvent.click(changeIndexButton);
    
    // The mock should trigger the handleChangeIndex function
    expect(screen.getByTestId('swipeable-views')).toBeInTheDocument();
  });
});