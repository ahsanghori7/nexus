import React from 'react';
import { render, screen } from '@testing-library/react';
import AnalysisJobProgress from './AnalysisJobProgress';

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('../AppLinearProgress', () => ({
  __esModule: true,
  default: () => <div data-testid="linear-progress" />,
}));

describe('AnalysisJobProgress', () => {
  it('shows spinner only for single-step analysis (total_steps = 1)', () => {
    render(
      <AnalysisJobProgress
        analysisData={{ status: 'STARTED', current_step: 0, total_steps: 1 }}
      />,
    );

    expect(screen.queryByTestId('linear-progress')).not.toBeInTheDocument();
    expect(screen.getByText('ai-quote-analysis-working')).toBeInTheDocument();
  });

  it('shows progress bar for multi-step analysis', () => {
    render(
      <AnalysisJobProgress
        analysisData={{ status: 'STARTED', current_step: 2, total_steps: 5 }}
      />,
    );

    expect(screen.getByTestId('linear-progress')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('shows spinner only while pending before steps are known', () => {
    render(<AnalysisJobProgress analysisData={{ status: 'PENDING' }} />);

    expect(screen.queryByTestId('linear-progress')).not.toBeInTheDocument();
    expect(screen.getByText('ai-quote-analysis-status-pending')).toBeInTheDocument();
  });

  it('shows a fallback spinner for stale non-progress job data during run', () => {
    render(
      <AnalysisJobProgress
        analysisData={{ status: 'SUCCESS', package_id: 44410 }}
      />,
    );

    expect(screen.queryByTestId('linear-progress')).not.toBeInTheDocument();
    expect(screen.getByText('ai-quote-analysis-status-loading')).toBeInTheDocument();
  });
});
