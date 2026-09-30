import React from 'react';
import { render, screen } from '@testing-library/react';
import AIBanner from './AIBanner.jsx';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: jest.fn((key) => key),
}));

// Simple string mocks for MUI components
jest.mock('@mui/material/Box', () => ({ children, ...props }) => (
  <div {...props}>{children}</div>
));

jest.mock('@mui/material/Typography', () => ({ children, ...props }) => (
  <span {...props}>{children}</span>
));

jest.mock('@mui/material/Chip', () => ({ label, ...props }) => (
  <span {...props}>{label}</span>
));

// Mock Tooltip to avoid styled component issues
jest.mock('@mui/material/Tooltip', () => {
  // eslint-disable-next-line react/display-name
  return jest.fn(({ children, title, ...props }) => (
    <div {...props}>
      {children}
      <div data-testid="tooltip-content">{title}</div>
    </div>
  ));
});


jest.mock('@mui/icons-material/InfoOutlined', () => () => (
  <span>InfoIcon</span>
));

jest.mock('./AIInfoTooltip', () => {
  const actual = jest.requireActual('./AIInfoTooltip');
  return {
    __esModule: true,
    ...actual,
    default: () => (
      <div data-testid="ai-info-tooltip">
        <span>InfoIcon</span>
        <span>tooltip-trigger</span>
      </div>
    ),
  };
});

// Mock the entire styled import to avoid the tooltipClasses issue
jest.mock('@mui/material/styles', () => ({
  styled: () => () => ({ children, ...props }) => <div {...props}>{children}</div>,
}));


// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('AIBanner Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('renders nothing if analyseQuote already includes tid', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['123']));
    const { container } = render(<AIBanner aiState="eligible" tid="123" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders embedded ineligible banner when analysis already started for tid', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['123']));
    render(
      <AIBanner
        aiState="ineligible"
        tid="123"
        reasons={['insufficient_quotes']}
        embedded
        showTooltipTrigger
      />,
    );

    expect(screen.getByText('ineligible-label')).toBeInTheDocument();
    expect(screen.getByTestId('ai-info-tooltip')).toBeInTheDocument();
  });

  it('renders eligible banner correctly', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['456']));

    render(<AIBanner aiState="eligible" tid="123" reasons={[]} />);

    expect(screen.getByText('eligible-label')).toBeInTheDocument();
    expect(screen.getByText('beta-chip')).toBeInTheDocument();
    expect(screen.getByTestId('ai-info-tooltip')).toBeInTheDocument();
  });

  it('renders ineligible banner correctly with single reason', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['456']));

    render(<AIBanner
      aiState="ineligible"
      tid="123"
      reasons={['insufficient_quotes']}
    />);

    expect(screen.getByText('ineligible-label')).toBeInTheDocument();
    expect(screen.getByText('beta-chip')).toBeInTheDocument();
    expect(screen.getByTestId('ai-info-tooltip')).toBeInTheDocument();
  });

  it('renders ineligible banner correctly with multiple reasons', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['456']));

    render(<AIBanner
      aiState="ineligible"
      tid="123"
      reasons={['insufficient_quotes', 'missing_docs', 'boq']}
    />);

    expect(screen.getByTestId('ai-info-tooltip')).toBeInTheDocument();
  });

  it('renders empty state banner correctly', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['456']));

    render(<AIBanner aiState="empty" tid="123" reasons={[]} />);

    expect(screen.getByText('empty-label')).toBeInTheDocument();
    expect(screen.getByText('beta-chip')).toBeInTheDocument();
    expect(screen.getByTestId('ai-info-tooltip')).toBeInTheDocument();
  });

  it('renders consistent UI elements across all states', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['456']));

    const { rerender } = render(<AIBanner aiState="eligible" tid="123" reasons={[]} />);
    expect(screen.getAllByText('InfoIcon').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('beta-chip')).toBeInTheDocument();

    rerender(<AIBanner aiState="ineligible" tid="123" reasons={['insufficient_quotes']} />);
    expect(screen.getAllByText('InfoIcon').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('beta-chip')).toBeInTheDocument();

    rerender(<AIBanner aiState="empty" tid="123" reasons={[]} />);
    expect(screen.getAllByText('InfoIcon').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('beta-chip')).toBeInTheDocument();
  });

  it('renders status info icon on left when embedded without tooltip trigger', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['456']));

    render(
      <AIBanner
        aiState="eligible"
        tid="123"
        reasons={[]}
        showBetaChip={false}
        embedded
        showTooltipTrigger={false}
      />,
    );

    expect(screen.getAllByText('InfoIcon')).toHaveLength(1);
    expect(screen.queryByTestId('ai-info-tooltip')).not.toBeInTheDocument();
  });

  it('renders only right tooltip icon when embedded with state trigger', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['456']));

    render(
      <AIBanner
        aiState="ineligible"
        tid="123"
        reasons={[]}
        showBetaChip={false}
        embedded
        showTooltipTrigger
      />,
    );

    expect(screen.getAllByText('InfoIcon')).toHaveLength(1);
    expect(screen.getByTestId('ai-info-tooltip')).toBeInTheDocument();
  });

  it('uses fit-content width when embedded', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['456']));

    const { container } = render(
      <AIBanner
        aiState="empty"
        tid="123"
        reasons={[]}
        showBetaChip={false}
        embedded
      />,
    );

    expect(container.firstChild).toHaveAttribute('data-embedded', 'true');
    expect(screen.getByText('empty-label')).toBeInTheDocument();
  });

  it('omits beta chip when showBetaChip is false', () => {
    localStorageMock.getItem.mockReturnValue(JSON.stringify(['456']));

    render(
      <AIBanner
        aiState="ineligible"
        tid="123"
        reasons={['insufficient_quotes']}
        showBetaChip={false}
        embedded
        showTooltipTrigger={false}
      />,
    );

    expect(screen.getByText('ineligible-label')).toBeInTheDocument();
    expect(screen.queryByText('beta-chip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('ai-info-tooltip')).not.toBeInTheDocument();
  });

  describe('localStorage interaction', () => {
    it('renders with empty localStorage', () => {
      localStorageMock.getItem.mockReturnValue(null);
      render(<AIBanner aiState="eligible" tid="123" reasons={[]} />);
      expect(screen.getByText('eligible-label')).toBeInTheDocument();
    });

    it('renders with different tid in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['456']));
      render(<AIBanner aiState="eligible" tid="123" reasons={[]} />);
      expect(screen.getByText('eligible-label')).toBeInTheDocument();
    });

    it('renders nothing with matching tid in localStorage', () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify(['123']));
      const { container } = render(<AIBanner aiState="eligible" tid="123" reasons={[]} />);
      expect(container.firstChild).toBeNull();
    });
  });
});
