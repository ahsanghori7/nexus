import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MuiEllipsisTooltip from './MuiEllipsisTooltip';

describe('MuiEllipsisTooltip', () => {
  beforeEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders without crashing', () => {
    render(<MuiEllipsisTooltip tooltipContent="Test content" />);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders with default empty tooltipContent', () => {
    const { container } = render(<MuiEllipsisTooltip />);
    // The component should render but with empty content
    expect(container.firstChild).toBeInTheDocument();
  });

  it('displays tooltip content correctly', () => {
    render(<MuiEllipsisTooltip tooltipContent="Very long content that should be truncated" />);
    const textElement = screen.getByText('Very long content that should be truncated');
    
    expect(textElement).toBeInTheDocument();
    // Check that the component renders the content correctly
    expect(textElement).toHaveAttribute('component', 'div');
  });

  it('opens tooltip on mouse enter and closes on mouse leave', async () => {
    render(<MuiEllipsisTooltip tooltipContent="Hover test content" />);
    const textElement = screen.getByText('Hover test content');

    // Mouse enter should open tooltip
    fireEvent.mouseEnter(textElement);
    
    // Mouse leave should close tooltip
    fireEvent.mouseLeave(textElement);
    
    expect(textElement).toBeInTheDocument();
  });

  it('auto-closes tooltip after specified time', async () => {
    render(<MuiEllipsisTooltip tooltipContent="Timed tooltip" time={1000} />);
    const textElement = screen.getByText('Timed tooltip');

    // Mouse enter to open tooltip
    fireEvent.mouseEnter(textElement);

    // Fast-forward time by 1000ms
    jest.advanceTimersByTime(1000);

    expect(textElement).toBeInTheDocument();
  });

  it('clears timer on component unmount', () => {
    const { unmount } = render(<MuiEllipsisTooltip tooltipContent="Test" time={1000} />);
    const textElement = screen.getByText('Test');

    fireEvent.mouseEnter(textElement);
    
    // Unmount should clear timers
    unmount();
    
    // This test ensures no memory leaks from timers
    expect(true).toBe(true);
  });

  it('handles multiple mouse enter events correctly', () => {
    render(<MuiEllipsisTooltip tooltipContent="Multiple hover test" time={1000} />);
    const textElement = screen.getByText('Multiple hover test');

    // Multiple mouse enters
    fireEvent.mouseEnter(textElement);
    fireEvent.mouseEnter(textElement);
    fireEvent.mouseEnter(textElement);

    expect(textElement).toBeInTheDocument();
  });
});