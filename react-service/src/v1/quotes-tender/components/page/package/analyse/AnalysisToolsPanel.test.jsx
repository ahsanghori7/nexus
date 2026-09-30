import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AnalysisToolsPanel from './AnalysisToolsPanel';
import { setCurrentTender, setTenderAnalysisData } from 'v2/store/reducers/clink/analyse-quote';

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

const defaultAnalysis = {
  data: null,
  error: null,
  errorPayload: null,
  seconds: -1,
  quoteLevelingData: null,
  quoteLevelingError: null,
  quoteLevelingErrorPayload: null,
  quoteLevelingSeconds: -1,
  currentTender: 0,
};

jest.mock('react-redux', () => ({
  connect: () => (Component) => (props) => (
    <Component
      {...props}
      analysis={props.analysis || defaultAnalysis}
      dispatch={props.dispatch || jest.fn()}
    />
  ),
}));

const mockAnalyseFetch = jest.fn(() => Promise.resolve({ payload: null }));
const mockAnalyseStart = jest.fn(() => Promise.resolve({ type: 'ai/analyseStart/fulfilled' }));
const mockSetSeconds = jest.fn();
const mockSetCurrentTender = jest.fn();
const mockClearJobError = jest.fn();

jest.mock('v2/hooks/context', () => ({
  useContext: () => ({
    actions: {
      analyseFetch: (...args) => mockAnalyseFetch(...args),
      analyseStart: (...args) => mockAnalyseStart(...args),
      setSeconds: (...args) => mockSetSeconds(...args),
      setCurrentTender: (...args) => mockSetCurrentTender(...args),
      clearJobError: (...args) => mockClearJobError(...args),
      setAnalysisDataReset: jest.fn(),
    },
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key }),
}));

jest.mock('./downloadAnalysisExport', () => jest.fn());

jest.mock('./AnalysisToolCard', () => ({
  __esModule: true,
  default: ({ title, status, onRun, onRefresh, onRetry, onDownload }) => (
    <div data-testid="analysis-tool-card" data-title={title} data-status={status}>
      {onRun && (
        <button type="button" onClick={onRun}>
          run-{title}
        </button>
      )}
      {onRefresh && (
        <button type="button" onClick={onRefresh}>
          refresh-{title}
        </button>
      )}
      {onRetry && (
        <button type="button" onClick={onRetry}>
          retry-{title}
        </button>
      )}
      {onDownload && (
        <button type="button" onClick={onDownload}>
          download-{title}
        </button>
      )}
    </div>
  ),
}));

jest.mock('./TenderAnalysisToolCard', () => ({
  __esModule: true,
  default: ({ title, onView, onOpenAiWarning }) => (
    <div data-testid="tender-analysis-tool-card" data-title={title}>
      <button type="button" onClick={() => onView?.({ status: 'SUCCESS' })}>
        view-results
      </button>
      <button type="button" onClick={() => onView?.({ status: 'FAILURE' })}>
        view-failed-results
      </button>
      <button type="button" onClick={() => onOpenAiWarning?.()}>
        open-tender-ai-warning
      </button>
    </div>
  ),
}));

jest.mock('v2/store/reducers/clink/analyse-quote', () => ({
  QUOTE_LEVELING: 'tender_levelling',
  selectPackageJob: jest.fn(() => ({ data: null, error: null, errorPayload: null, seconds: -1 })),
  readAnalysisStarted: jest.fn(() => false),
  setCurrentTender: jest.fn((tid) => ({ type: 'setCurrentTender', payload: tid })),
  setTenderAnalysisData: jest.fn((data) => ({
    type: 'setTenderAnalysisData',
    payload: data,
  })),
}));

jest.mock('./useAnalysisJob', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@mui/material/Grid2', () => ({
  __esModule: true,
  default: ({ children }) => <div data-testid="grid">{children}</div>,
}));

jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

jest.mock('v1/global/components/layout/panel/PanelAccordion', () => ({
  __esModule: true,
  default: ({ title, children }) => (
    <div data-testid="panel-accordion">
      <div data-testid="panel-accordion-title">{title}</div>
      <div data-testid="panel-accordion-body">{children}</div>
    </div>
  ),
}));

jest.mock('./AIBanner', () => ({
  __esModule: true,
  default: ({ showBetaChip, embedded, showTooltipTrigger }) => (
    <div
      data-testid="ai-banner"
      data-show-beta-chip={String(showBetaChip)}
      data-embedded={String(embedded)}
      data-show-tooltip-trigger={String(showTooltipTrigger)}
    />
  ),
}));

jest.mock('./AIInfoTooltip', () => ({
  __esModule: true,
  default: ({ aiState, variant }) => (
    <div
      data-testid="ai-info-tooltip"
      data-ai-state={aiState}
      data-variant={variant}
    >
      header-tooltip
    </div>
  ),
}));

jest.mock('@mui/material/Box', () => ({ children, className, ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
));

jest.mock('@mui/material/Typography', () => ({ children, ...props }) => (
  <span {...props}>{children}</span>
));

jest.mock('@mui/material/Chip', () => ({ label, ...props }) => (
  <span {...props}>{label}</span>
));

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AnalysisToolsPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockAnalyseFetch.mockImplementation(() => Promise.resolve({ payload: null }));
    mockAnalyseStart.mockImplementation(() =>
      Promise.resolve({ type: 'ai/analyseStart/fulfilled' }),
    );
    require('v2/store/reducers/clink/analyse-quote').selectPackageJob.mockReturnValue({
      data: null,
      error: null,
      errorPayload: null,
      seconds: -1,
    });
  });

  it('renders header without banner when analysis already started for tid', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['123']));
    render(
      <AnalysisToolsPanel
        tid="123"
        aiState="eligible"
        reasons={[]}
      />,
    );

    expect(screen.getByTestId('panel-accordion')).toBeInTheDocument();
    expect(screen.getByTestId('ai-info-tooltip')).toHaveAttribute(
      'data-variant',
      'limitations',
    );
    expect(screen.queryByTestId('ai-banner')).not.toBeInTheDocument();
  });

  it('shows ineligible banner and limitations header when quotes drop after analysis started', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['123']));
    render(
      <AnalysisToolsPanel
        tid="123"
        aiState="ineligible"
        reasons={['insufficient_quotes']}
      />,
    );

    expect(screen.getByTestId('ai-banner')).toBeInTheDocument();
    expect(screen.getByTestId('ai-info-tooltip')).toHaveAttribute(
      'data-variant',
      'limitations',
    );
    expect(screen.queryByTestId('tender-analysis-tool-card')).not.toBeInTheDocument();
  });

  it('renders accordion header and embedded AIBanner when visible', () => {
    render(
      <AnalysisToolsPanel
        tid="123"
        aiState="ineligible"
        reasons={['insufficient_quotes']}
      />,
    );

    expect(screen.getByTestId('panel-accordion')).toBeInTheDocument();
    expect(screen.getByText('analysis-tools-title')).toBeInTheDocument();
    expect(screen.getByText('beta-chip')).toBeInTheDocument();

    const headerTooltip = screen.getByTestId('ai-info-tooltip');
    expect(headerTooltip).toHaveAttribute('data-variant', 'limitations');

    const banner = screen.getByTestId('ai-banner');
    expect(banner).toHaveAttribute('data-show-beta-chip', 'false');
    expect(banner).toHaveAttribute('data-embedded', 'true');
    expect(banner).toHaveAttribute('data-show-tooltip-trigger', 'true');
  });

  it('opens quote analysis modal without syncing data when status is not SUCCESS', () => {
    const setOpen = jest.fn();
    const dispatch = jest.fn();

    render(
      <AnalysisToolsPanel
        tid="234"
        label="Carpentry - Second Fix"
        aiState="eligible"
        reasons={[]}
        useModal={[false, setOpen]}
        dispatch={dispatch}
      />,
    );

    fireEvent.click(screen.getByText('view-failed-results'));

    expect(setCurrentTender).toHaveBeenCalledWith('234');
    expect(setTenderAnalysisData).not.toHaveBeenCalled();
    expect(setOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'analyse-quote-with-ai',
        analysisData: { status: 'FAILURE' },
      }),
    );
  });

  it('opens quote analysis modal with package name in nav title when viewing results', () => {
    const setOpen = jest.fn();
    const dispatch = jest.fn();

    render(
      <AnalysisToolsPanel
        tid="234"
        label="Carpentry - Second Fix"
        aiState="eligible"
        reasons={[]}
        useModal={[false, setOpen]}
        dispatch={dispatch}
      />,
    );

    fireEvent.click(screen.getByText('view-results'));

    expect(setCurrentTender).toHaveBeenCalledWith('234');
    expect(setTenderAnalysisData).toHaveBeenCalledWith({ status: 'SUCCESS' });
    expect(setOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'analyse-quote-with-ai',
        packageId: '234',
        navTitle: 'analysis-tool-quote-summary-modal-title',
        navTitleInterpolation: { packageName: 'Carpentry - Second Fix' },
        packageName: 'Carpentry - Second Fix',
        description: 'ai-quote-analysis-complete-description',
        backdropClick: true,
      }),
    );
  });

  it('renders eligible panel with limitations header and no banner state tooltip', () => {
    render(
      <AnalysisToolsPanel
        tid="123"
        aiState="eligible"
        reasons={[]}
        useModal={[false, jest.fn()]}
      />,
    );

    expect(screen.getByTestId('ai-info-tooltip')).toHaveAttribute(
      'data-variant',
      'limitations',
    );
    expect(screen.getByTestId('ai-banner')).toHaveAttribute(
      'data-show-tooltip-trigger',
      'false',
    );
    expect(screen.getByTestId('tender-analysis-tool-card')).toBeInTheDocument();
    expect(screen.getByTestId('analysis-tool-card')).toBeInTheDocument();
  });
});

describe('AnalysisJobCard (quote levelling)', () => {
  const { selectPackageJob } = require('v2/store/reducers/clink/analyse-quote');

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockAnalyseFetch.mockImplementation(() => Promise.resolve({ payload: null }));
    mockAnalyseStart.mockImplementation(() =>
      Promise.resolve({ type: 'ai/analyseStart/fulfilled' }),
    );
    selectPackageJob.mockReturnValue({ data: null, error: null, errorPayload: null, seconds: -1 });
  });

  it('starts a not-run job when run is clicked', async () => {
    const dispatch = jest.fn((value) => value);

    render(
      <AnalysisToolsPanel
        tid="234"
        aiState="eligible"
        reasons={[]}
        dispatch={dispatch}
        useModal={[false, jest.fn()]}
      />,
    );

    fireEvent.click(screen.getByText('run-analysis-tool-leveling-title'));

    expect(mockSetCurrentTender).toHaveBeenCalledWith('234');
    expect(mockClearJobError).toHaveBeenCalledWith({
      type: 'tender_levelling',
      tid: '234',
    });
    expect(mockSetSeconds).toHaveBeenCalledWith({
      seconds: -1,
      type: 'tender_levelling',
      tid: '234',
    });
    expect(mockAnalyseStart).toHaveBeenCalledWith({
      tid: '234',
      type: 'tender_levelling',
      reset: false,
    });

    await flushPromises();

    expect(mockAnalyseFetch).toHaveBeenCalledWith({ tid: '234', type: 'tender_levelling' });
    expect(mockSetSeconds).toHaveBeenCalledWith({
      seconds: 10,
      type: 'tender_levelling',
      tid: '234',
    });
  });

  it('shows the AI warning modal instead of starting a job when quote count is too high', () => {
    const setOpen = jest.fn();
    const dispatch = jest.fn((value) => value);

    render(
      <AnalysisToolsPanel
        tid="234"
        aiState="eligible"
        reasons={[]}
        dispatch={dispatch}
        hasMoreThanFiveQuotes
        useModal={[false, setOpen]}
      />,
    );

    fireEvent.click(screen.getByText('run-analysis-tool-leveling-title'));

    expect(setOpen).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ai-warning', navTitle: 'ai-warning' }),
    );
    expect(mockAnalyseStart).not.toHaveBeenCalled();
  });

  it('confirms and re-runs a ready job when refresh is clicked', async () => {
    selectPackageJob.mockReturnValue({
      data: { status: 'SUCCESS', package_id: 234, completed_at: '2026-01-01T00:00:00Z' },
      error: null,
      errorPayload: null,
      seconds: -1,
    });
    const dispatch = jest.fn((value) => value);

    render(
      <AnalysisToolsPanel
        tid="234"
        aiState="eligible"
        reasons={[]}
        dispatch={dispatch}
        useModal={[false, jest.fn()]}
      />,
    );

    expect(screen.getByText('refresh-analysis-tool-leveling-title')).toBeInTheDocument();
    fireEvent.click(screen.getByText('refresh-analysis-tool-leveling-title'));
    expect(mockAnalyseStart).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'confirm' }));

    expect(mockAnalyseStart).toHaveBeenCalledWith({
      tid: '234',
      type: 'tender_levelling',
      reset: true,
    });

    await flushPromises();
  });

  it('confirms and retries a failed job when retry is clicked', async () => {
    selectPackageJob.mockReturnValue({
      data: null,
      error: 'Something went wrong',
      errorPayload: { error: { code: 'SOMETHING_ELSE' } },
      seconds: -1,
    });
    const dispatch = jest.fn((value) => value);

    render(
      <AnalysisToolsPanel
        tid="234"
        aiState="eligible"
        reasons={[]}
        dispatch={dispatch}
        useModal={[false, jest.fn()]}
      />,
    );

    fireEvent.click(screen.getByText('retry-analysis-tool-leveling-title'));
    fireEvent.click(screen.getByRole('button', { name: 'confirm' }));

    expect(mockAnalyseStart).toHaveBeenCalledWith({
      tid: '234',
      type: 'tender_levelling',
      reset: true,
    });

    await flushPromises();
  });

  it('downloads the export when download is clicked on a ready job', () => {
    selectPackageJob.mockReturnValue({
      data: { status: 'SUCCESS', package_id: 234 },
      error: null,
      errorPayload: null,
      seconds: -1,
    });
    const downloadAnalysisExport = require('./downloadAnalysisExport');

    render(
      <AnalysisToolsPanel
        tid="234"
        aiState="eligible"
        reasons={[]}
        dispatch={jest.fn((value) => value)}
        useModal={[false, jest.fn()]}
      />,
    );

    fireEvent.click(screen.getByText('download-analysis-tool-leveling-title'));

    expect(downloadAnalysisExport).toHaveBeenCalledWith('234', 'csv', 'tender_levelling');
  });

  it('does not re-fetch or reschedule polling when analyseStart is rejected', async () => {
    mockAnalyseStart.mockImplementation(() =>
      Promise.resolve({ type: 'ai/analyseStart/rejected' }),
    );
    const dispatch = jest.fn((value) => value);

    render(
      <AnalysisToolsPanel
        tid="234"
        aiState="eligible"
        reasons={[]}
        dispatch={dispatch}
        useModal={[false, jest.fn()]}
      />,
    );

    await flushPromises();
    const fetchCallsBeforeClick = mockAnalyseFetch.mock.calls.length;

    fireEvent.click(screen.getByText('run-analysis-tool-leveling-title'));

    await flushPromises();

    expect(mockAnalyseFetch.mock.calls.length).toBe(fetchCallsBeforeClick);
    expect(mockSetSeconds).not.toHaveBeenCalledWith({
      seconds: 10,
      type: 'tender_levelling',
      tid: '234',
    });
  });

  it('just re-fetches without restarting when a job is already in progress for this package', async () => {
    selectPackageJob.mockReturnValue({
      data: { status: 'STARTED', package_id: 234 },
      error: null,
      errorPayload: null,
      seconds: -1,
    });
    const dispatch = jest.fn((value) => value);

    render(
      <AnalysisToolsPanel
        tid="234"
        aiState="eligible"
        reasons={[]}
        dispatch={dispatch}
        useModal={[false, jest.fn()]}
      />,
    );

    fireEvent.click(screen.getByText('run-analysis-tool-leveling-title'));

    expect(mockAnalyseStart).not.toHaveBeenCalled();

    await flushPromises();

    expect(mockAnalyseFetch).toHaveBeenCalledWith({ tid: '234', type: 'tender_levelling' });
    expect(mockSetSeconds).toHaveBeenCalledWith({
      seconds: 10,
      type: 'tender_levelling',
      tid: '234',
    });
  });

  it('opens the AI warning modal from the tender card', () => {
    const setOpen = jest.fn();

    render(
      <AnalysisToolsPanel
        tid="234"
        aiState="eligible"
        reasons={[]}
        dispatch={jest.fn((value) => value)}
        useModal={[false, setOpen]}
      />,
    );

    fireEvent.click(screen.getByText('open-tender-ai-warning'));

    expect(setOpen).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'ai-warning', navTitle: 'ai-warning' }),
    );
  });
});
