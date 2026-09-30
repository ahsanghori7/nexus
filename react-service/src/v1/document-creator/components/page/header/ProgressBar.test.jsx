import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProgressBar from './ProgressBar';

describe('ProgressBar', () => {
  const mockSetMissingHighlight = jest.fn();

  beforeEach(() => {
    mockSetMissingHighlight.mockClear();
  });

  it('renders with default props', () => {
    render(<ProgressBar />);

    expect(screen.getByText('Progress to complete')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
  });

  it('displays correct percentage when currentCompletion is provided as number', () => {
    render(<ProgressBar currentCompletion={75} />);

    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '75',
    );
  });

  it('displays correct percentage when currentCompletion is provided as string', () => {
    render(<ProgressBar currentCompletion="60" />);

    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '60',
    );
  });

  it('caps completion at 100% when value is higher', () => {
    render(<ProgressBar currentCompletion={120} />);

    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '100',
    );
  });

  it('shows "See what\'s missing" button when not complete', async () => {
    const user = userEvent.setup();
    render(
      <ProgressBar
        currentCompletion={50}
        setMissingHighlight={mockSetMissingHighlight}
      />,
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(mockSetMissingHighlight).toHaveBeenCalledTimes(1);
  });

  it('hides "See what\'s missing" button when complete', () => {
    render(
      <ProgressBar
        currentCompletion={100}
        setMissingHighlight={mockSetMissingHighlight}
      />,
    );

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByText(/see what's missing/i)).not.toBeInTheDocument();
  });

  it('handles non-numeric input by showing 0%', () => {
    render(<ProgressBar currentCompletion="invalid" />);

    // Use the progressbar attribute to verify the value
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      '0',
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
    // Use exact text match with case-sensitivity
    expect(screen.getByText('0%', { exact: true })).toBeInTheDocument();
  });
});
