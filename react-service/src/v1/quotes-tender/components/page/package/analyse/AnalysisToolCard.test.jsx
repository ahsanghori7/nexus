import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AnalysisToolCard from './AnalysisToolCard';

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('./AnalysisJobProgress', () => ({
  __esModule: true,
  default: () => <div data-testid="job-progress" />,
}));

describe('AnalysisToolCard', () => {
  it('renders not_run with description and Run button', () => {
    const onRun = jest.fn();
    render(
      <AnalysisToolCard
        title="Tender Analysis"
        status="not_run"
        description="Findings, recommendations and quote scoring across all 5 quotes."
        onRun={onRun}
      />,
    );

    expect(screen.getByText('analysis-tool-status-not-run')).toBeInTheDocument();
    expect(
      screen.getByText('Findings, recommendations and quote scoring across all 5 quotes.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('analysis-tool-run'));
    expect(onRun).toHaveBeenCalled();
  });

  it('renders failed state with try again even when canRetry is false', () => {
    const onRetry = jest.fn();
    render(
      <AnalysisToolCard
        title="Quote Levelling"
        status="failed"
        errorView={{
          primaryMessage: "We couldn't access one or more files required for the analysis.",
          suggestions: ['Please try again in a few moments'],
          canRetry: false,
        }}
        onRetry={onRetry}
      />,
    );

    expect(screen.getByText('analysis-tool-status-failed')).toBeInTheDocument();
    fireEvent.click(screen.getByText('analysis-tool-try-again'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('renders ready state with summary, footer, and actions', () => {
    render(
      <AnalysisToolCard
        title="Tender Analysis"
        status="ready"
        readySummary="6 key findings · 5 quotes scored"
        readyFooter="Generated 12/05/2026, 14:02"
        onView={jest.fn()}
        onRefresh={jest.fn()}
      />,
    );

    expect(screen.getByText('6 key findings · 5 quotes scored')).toBeInTheDocument();
    expect(screen.getByText('Generated 12/05/2026, 14:02')).toBeInTheDocument();
    expect(screen.getByText('analysis-tool-view')).toBeInTheDocument();
    expect(screen.getByLabelText('analysis-tool-refresh')).toBeInTheDocument();
  });

  it('renders running with progress component', () => {
    render(
      <AnalysisToolCard
        title="Tender Analysis"
        status="running"
        progressData={{ status: 'STARTED', current_step: 1, total_steps: 4 }}
      />,
    );

    expect(screen.getByTestId('job-progress')).toBeInTheDocument();
  });
});
