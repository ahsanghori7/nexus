import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import InfoTooltip from './InfoTooltip';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn((key) => key === 'total-number-explanation' ? 'Total number explanation text' : key),
  }),
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  Image: ({ src, alt }) => (
    <img data-testid="info-image" src={src} alt={alt} />
  ),
  CONSTANTS: {
    s3: {
      infoLogoBlack: 'info-logo-black.png',
      infoLogoGray: 'info-logo-gray.png',
    },
    dimensions: {
      LG_SCREEN: 1024,
    },
  },
  HOOKS: {
    useWindowDimensions: jest.fn(),
  },
}));

// Mock styled components
jest.mock('./styled', () => ({
  StyledTooltip: ({ children, open, className }) => (
    <div
      data-testid="styled-tooltip"
      data-open={open}
      className={className}
    >
      <div className="prosper-tooltip-content-row">
        {children}
      </div>
    </div>
  ),
  StyledTooltipContainer: ({ children, matched, closed }) => (
    <div
      data-testid="styled-tooltip-container"
      data-matched={matched}
      data-closed={closed}
    >
      {children}
    </div>
  ),
}));

const { HOOKS } = require('clink-components');

describe('InfoTooltip Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200 });
    
    render(<InfoTooltip />);
    
    const container = screen.getByTestId('styled-tooltip-container');
    const tooltip = screen.getByTestId('styled-tooltip');
    const image = screen.getByTestId('info-image');
    
    expect(container).toBeInTheDocument();
    expect(tooltip).toBeInTheDocument();
    expect(image).toBeInTheDocument();
  });

  test('uses gray logo for large screens', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200 });
    
    render(<InfoTooltip />);
    
    const image = screen.getByTestId('info-image');
    expect(image).toHaveAttribute('src', 'info-logo-gray.png');
  });

  test('uses black logo for small screens', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 800 });
    
    render(<InfoTooltip />);
    
    const image = screen.getByTestId('info-image');
    expect(image).toHaveAttribute('src', 'info-logo-black.png');
  });

  test('uses black logo exactly at LG_SCREEN breakpoint', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1024 });
    
    render(<InfoTooltip />);
    
    const image = screen.getByTestId('info-image');
    expect(image).toHaveAttribute('src', 'info-logo-black.png');
  });

  test('tooltip is initially closed', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200 });
    
    render(<InfoTooltip />);
    
    const tooltip = screen.getByTestId('styled-tooltip');
    expect(tooltip).toHaveAttribute('data-open', 'false');
  });

  test('opens tooltip on mouse enter', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200 });
    
    render(<InfoTooltip />);
    
    const trigger = screen.getByTestId('info-image').parentElement;
    fireEvent.mouseEnter(trigger);
    
    const tooltip = screen.getByTestId('styled-tooltip');
    expect(tooltip).toHaveAttribute('data-open', 'true');
  });

  test('closes tooltip on mouse leave', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200 });
    
    render(<InfoTooltip />);
    
    const trigger = screen.getByTestId('info-image').parentElement;
    
    // First open it
    fireEvent.mouseEnter(trigger);
    let tooltip = screen.getByTestId('styled-tooltip');
    expect(tooltip).toHaveAttribute('data-open', 'true');
    
    // Then close it
    fireEvent.mouseLeave(trigger);
    tooltip = screen.getByTestId('styled-tooltip');
    expect(tooltip).toHaveAttribute('data-open', 'false');
  });

  test('toggles tooltip on click', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200 });
    
    render(<InfoTooltip />);
    
    const trigger = screen.getByTestId('info-image').parentElement;
    
    // Initially closed
    let tooltip = screen.getByTestId('styled-tooltip');
    expect(tooltip).toHaveAttribute('data-open', 'false');
    
    // Click to open
    fireEvent.click(trigger);
    tooltip = screen.getByTestId('styled-tooltip');
    expect(tooltip).toHaveAttribute('data-open', 'true');
    
    // Click to close
    fireEvent.click(trigger);
    tooltip = screen.getByTestId('styled-tooltip');
    expect(tooltip).toHaveAttribute('data-open', 'false');
  });

  test('passes matched prop to container', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200 });
    
    render(<InfoTooltip matched={true} />);
    
    const container = screen.getByTestId('styled-tooltip-container');
    expect(container).toHaveAttribute('data-matched', 'true');
  });

  test('passes closed prop to container', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200 });
    
    render(<InfoTooltip closed={true} />);
    
    const container = screen.getByTestId('styled-tooltip-container');
    expect(container).toHaveAttribute('data-closed', 'true');
  });

  test('passes both matched and closed props', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200 });
    
    render(<InfoTooltip matched={true} closed={true} />);
    
    const container = screen.getByTestId('styled-tooltip-container');
    expect(container).toHaveAttribute('data-matched', 'true');
    expect(container).toHaveAttribute('data-closed', 'true');
  });

  test('renders default prop values', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200 });
    
    render(<InfoTooltip />);
    
    const container = screen.getByTestId('styled-tooltip-container');
    expect(container).toHaveAttribute('data-matched', 'false');
    expect(container).toHaveAttribute('data-closed', 'false');
  });

  test('displays translated explanation text', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200 });
    
    render(<InfoTooltip />);
    
    const explanationText = screen.getByText('Total number explanation text');
    expect(explanationText).toBeInTheDocument();
  });

  test('has correct image alt text', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200 });
    
    render(<InfoTooltip />);
    
    const image = screen.getByTestId('info-image');
    expect(image).toHaveAttribute('alt', 'Count of registered interests');
  });

  test('has correct CSS classes', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200 });
    
    render(<InfoTooltip />);
    
    const tooltip = screen.getByTestId('styled-tooltip');
    expect(tooltip).toHaveClass('prosper-tooltip-content');
    
    const trigger = screen.getByTestId('info-image').parentElement;
    expect(trigger).toHaveClass('prosper-tooltip-trigger');
  });

  test('trigger has aria-hidden attribute', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200 });
    
    render(<InfoTooltip />);
    
    const trigger = screen.getByTestId('info-image').parentElement;
    expect(trigger).toHaveAttribute('aria-hidden', 'true');
  });

  test('tooltip content has correct structure', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200 });
    
    render(<InfoTooltip />);
    
    const contentRow = screen.getByText('Total number explanation text');
    expect(contentRow).toHaveClass('prosper-tooltip-content-row');
  });

  test('handles rapid mouse events correctly', () => {
    HOOKS.useWindowDimensions.mockReturnValue({ width: 1200 });
    
    render(<InfoTooltip />);
    
    const trigger = screen.getByTestId('info-image').parentElement;
    
    // Rapid mouse enter/leave
    fireEvent.mouseEnter(trigger);
    fireEvent.mouseLeave(trigger);
    fireEvent.mouseEnter(trigger);
    
    const tooltip = screen.getByTestId('styled-tooltip');
    expect(tooltip).toHaveAttribute('data-open', 'true');
  });
});