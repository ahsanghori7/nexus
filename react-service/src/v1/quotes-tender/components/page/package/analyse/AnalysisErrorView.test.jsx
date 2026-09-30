import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AnalysisErrorView from './AnalysisErrorView';

jest.mock('v2/helpers/i18n', () => ({
  __esModule: true,
  default: {
    t: (key, fallback) => fallback || key,
  },
}));

describe('AnalysisErrorView', () => {
  it('renders primary message', () => {
    render(
      <AnalysisErrorView primaryMessage="The documents are too large to process." />,
    );
    expect(
      screen.getByText('The documents are too large to process.'),
    ).toBeInTheDocument();
  });

  it('renders error type as human-readable label when provided', () => {
    render(
      <AnalysisErrorView
        primaryMessage="Something went wrong."
        errorType="token_limit"
      />,
    );
    expect(screen.getByText('Token limit')).toBeInTheDocument();
  });

  it('renders processing_failure as Processing failure', () => {
    render(
      <AnalysisErrorView
        primaryMessage="A file failed to process."
        errorType="processing_failure"
      />,
    );
    expect(screen.getByText('Processing failure')).toBeInTheDocument();
  });

  it('renders suggestions list when provided', () => {
    const suggestions = [
      'Remove non-essential pages',
      'Split into smaller packages',
    ];
    render(
      <AnalysisErrorView
        primaryMessage="Error."
        suggestions={suggestions}
      />,
    );
    expect(screen.getByText('Remove non-essential pages')).toBeInTheDocument();
    expect(screen.getByText('Split into smaller packages')).toBeInTheDocument();
  });

  it('renders Retry analysis button when onRetry is provided', () => {
    const onRetry = jest.fn();
    render(
      <AnalysisErrorView
        primaryMessage="Error."
        onRetry={onRetry}
      />,
    );
    const button = screen.getByRole('button', { name: /retry analysis/i });
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not render Retry button when onRetry is not provided', () => {
    render(
      <AnalysisErrorView primaryMessage="Error." />,
    );
    expect(screen.queryByRole('button', { name: /retry analysis/i })).not.toBeInTheDocument();
  });

  it('renders Technical details accordion when technicalDetails provided', () => {
    render(
      <AnalysisErrorView
        primaryMessage="Error."
        technicalDetails="Error code: 400 - context limit exceeded"
      />,
    );
    expect(screen.getByText('Technical details')).toBeInTheDocument();
  });

  it('does not render Technical details when technicalDetails is not provided', () => {
    render(<AnalysisErrorView primaryMessage="Error." />);
    expect(screen.queryByText('Technical details')).not.toBeInTheDocument();
  });
});
