import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Timeline from './index';

// Mock clink-components ViewSwitcher
jest.mock('clink-components', () => ({
  ViewSwitcher: ({ onViewModeChange, value }) => (
    <div data-testid="mock-view-switcher">
      <button onClick={() => onViewModeChange && onViewModeChange('day')}>Day</button>
      <button onClick={() => onViewModeChange && onViewModeChange('week')}>Week</button>
      <button onClick={() => onViewModeChange && onViewModeChange('month')}>Month</button>
      <span data-testid="view-switcher-value">{value}</span>
    </div>
  )
}));

// Mock useMuiTheme
jest.mock('v2/apps/shared/components/muiTheme', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    palette: {
      panelBorder: {
        main: '#e0e0e0'
      }
    }
  }))
}));

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn((key) => key)
  })
}));

describe('Timeline Component', () => {
  const defaultProps = {
    onViewModeChange: jest.fn(),
    value: 'week'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Timeline {...defaultProps} />);
    // Check that the component renders with the title
    expect(screen.getByText('timeline')).toBeInTheDocument();
  });

  it('displays the timeline title', () => {
    render(<Timeline {...defaultProps} />);
    expect(screen.getByText('timeline')).toBeInTheDocument();
  });

  it('renders the ViewSwitcher component', () => {
    render(<Timeline {...defaultProps} />);
    expect(screen.getByTestId('mock-view-switcher')).toBeInTheDocument();
  });

  it('passes the correct props to ViewSwitcher', () => {
    render(<Timeline {...defaultProps} />);
    
    // Check that the value is displayed in the ViewSwitcher
    expect(screen.getByTestId('view-switcher-value')).toHaveTextContent('week');
    
    // Check that ViewSwitcher buttons are rendered
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
  });

  it('handles different value props', () => {
    const { rerender } = render(<Timeline {...defaultProps} value="day" />);
    expect(screen.getByTestId('view-switcher-value')).toHaveTextContent('day');
    
    rerender(<Timeline {...defaultProps} value="month" />);
    expect(screen.getByTestId('view-switcher-value')).toHaveTextContent('month');
  });

  it('renders with proper layout structure', () => {
    render(<Timeline {...defaultProps} />);
    
    // Check that the main container and grids are rendered
    const grids = screen.getAllByTestId('mui-grid');
    expect(grids.length).toBeGreaterThan(0);
    
    // Check that Typography component is rendered for the title
    expect(screen.getByTestId('mui-typography')).toBeInTheDocument();
  });

  it('takes a snapshot of the component', () => {
    const { container } = render(<Timeline {...defaultProps} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});