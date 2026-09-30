import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Content from './Content';

// Mock i18next
jest.mock('v2/helpers/i18n', () => ({
  t: (key) => {
    const translations = {
      'previous-step': 'Previous Step',
      'save-continue': 'Save & Continue',
      'next': 'Next',
      'save': 'Save'
    };
    return translations[key] || key;
  }
}));

// Mock styled components
jest.mock('v2/apps/shared/components/company-v2/Mui.styled', () => ({
  MuiSubmitWrapper: ({ children, prequal }) => (
    <div data-testid="submit-wrapper" data-prequal={prequal}>
      {children}
    </div>
  ),
  MuiGreetingSection: () => <div data-testid="greeting-section">Greeting</div>,
  ProgressBar: ({ percentComplete }) => (
    <div data-testid="progress-bar" data-percent={percentComplete}>
      Progress: {percentComplete}%
    </div>
  ),
}));

// Mock clink-components
jest.mock('clink-components', () => ({
  CONSTANTS: {
    colors: {
      general: {
        white: '#ffffff'
      },
      prosper: {
        prosperBoxRed: '#e74c3c'
      }
    }
  }
}));

// Mock window.scrollTo
const mockScrollTo = jest.fn();
Object.defineProperty(window, 'scrollTo', {
  value: mockScrollTo,
  writable: true
});

// Mock scroll event handling
Object.defineProperty(window, 'scrollY', {
  value: 0,
  writable: true
});

Object.defineProperty(document.documentElement, 'scrollHeight', {
  value: 1000,
  writable: true
});

describe('Content', () => {
  const mockSetPage = jest.fn();
  const mockLastStepFunction = jest.fn();

  const mockTabs = [
    {
      id: 'tab1',
      Content: ({ page, setPage }) => (
        <div data-testid="tab-content-0">
          Tab 1 Content - Page {page}
          <button onClick={() => setPage(1)}>Go to tab 2</button>
        </div>
      )
    },
    {
      id: 'tab2',
      Content: ({ page, setPage }) => (
        <div data-testid="tab-content-1">
          Tab 2 Content - Page {page}
          <button onClick={() => setPage(0)}>Go to tab 1</button>
        </div>
      )
    },
    {
      id: 'tab3',
      Content: ({ page, setPage }) => (
        <div data-testid="tab-content-2">
          Tab 3 Content - Page {page}
        </div>
      )
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockScrollTo.mockClear();
    window.scrollY = 0;
    // Reset any scroll event listeners
    window.removeEventListener = jest.fn();
    window.addEventListener = jest.fn();
  });

  test('should render with default props', () => {
    render(<Content />);
    
    // Should render main containers even without tabs
    expect(screen.getByTestId('greeting-section')).toBeInTheDocument();
  });

  test('should render tabs correctly', () => {
    render(<Content tabs={mockTabs} page={0} />);
    
    expect(screen.getByTestId('tab-content-0')).toBeInTheDocument();
    expect(screen.getByText('Tab 1 Content - Page 0')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-content-1')).not.toBeInTheDocument();
  });

  test('should show correct tab content based on page', () => {
    render(<Content tabs={mockTabs} page={1} />);
    
    expect(screen.getByTestId('tab-content-1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2 Content - Page 1')).toBeInTheDocument();
    expect(screen.queryByTestId('tab-content-0')).not.toBeInTheDocument();
  });

  test('should render progress bar when showPercent is true', () => {
    render(<Content showPercent={true} percentComplete={75} />);
    
    const progressBar = screen.getByTestId('progress-bar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('data-percent', '75');
    expect(screen.getByText('Progress: 75%')).toBeInTheDocument();
  });

  test('should not render progress bar when showPercent is false', () => {
    render(<Content showPercent={false} percentComplete={75} />);
    
    expect(screen.queryByTestId('progress-bar')).not.toBeInTheDocument();
  });

  test('should render greeting section for UK country code', () => {
    render(<Content countryCode="UK" />);
    
    expect(screen.getByTestId('greeting-section')).toBeInTheDocument();
  });

  test('should not render greeting section for non-UK country code', () => {
    render(<Content countryCode="US" />);
    
    expect(screen.queryByTestId('greeting-section')).not.toBeInTheDocument();
  });

  test('should render action buttons when not hidden', () => {
    render(<Content tabs={mockTabs} page={1} hideActionButtonsInTabs={[0]} contextType="clink" />);
    
    expect(screen.getByText('Previous Step')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  test('should not render action buttons when page is in hideActionButtonsInTabs', () => {
    render(<Content tabs={mockTabs} page={0} hideActionButtonsInTabs={[0]} />);
    
    expect(screen.queryByText('Previous Step')).not.toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  test('should handle previous button click', () => {
    render(<Content tabs={mockTabs} page={1} setPage={mockSetPage} hideActionButtonsInTabs={[]} />);
    
    const prevButton = screen.getByText('Previous Step');
    fireEvent.click(prevButton);
    
    expect(mockSetPage).toHaveBeenCalledWith(0);
    expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  test('should handle next button click', () => {
    render(<Content tabs={mockTabs} page={0} setPage={mockSetPage} hideActionButtonsInTabs={[]} contextType="clink" />);
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(mockSetPage).toHaveBeenCalledWith(1);
    expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  test('should show save button on last tab when lastStepSave is true', () => {
    render(
      <Content 
        tabs={mockTabs} 
        page={2} 
        lastStepSave={true}
        lastStepFunction={mockLastStepFunction}
        hideActionButtonsInTabs={[]} 
      />
    );
    
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  test('should handle save button click on last tab', () => {
    render(
      <Content 
        tabs={mockTabs} 
        page={2} 
        lastStepSave={true}
        lastStepFunction={mockLastStepFunction}
        hideActionButtonsInTabs={[]} 
      />
    );
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);
    
    expect(mockLastStepFunction).toHaveBeenCalled();
  });

  test('should show "Save & Continue" for prosper context', () => {
    render(
      <Content 
        tabs={mockTabs} 
        page={0} 
        contextType="prosper"
        hideActionButtonsInTabs={[]} 
      />
    );
    
    expect(screen.getByText('Save & Continue')).toBeInTheDocument();
  });

  test('should show "Next" for non-prosper context', () => {
    render(
      <Content 
        tabs={mockTabs} 
        page={0} 
        contextType="clink"
        hideActionButtonsInTabs={[]} 
      />
    );
    
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  test('should add scroll event listener on mount', () => {
    render(<Content />);
    
    expect(window.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  test('should remove scroll event listener on unmount', () => {
    const { unmount } = render(<Content />);
    
    unmount();
    
    expect(window.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  test('should apply maxWidth correctly', () => {
    render(<Content tabs={mockTabs} maxWidth="800px" />);
    
    // Container should render correctly with maxWidth
    expect(screen.getByTestId('tab-content-0')).toBeInTheDocument();
  });

  test('should render tab panels with correct accessibility attributes', () => {
    render(<Content tabs={mockTabs} page={1} />);
    
    const visiblePanel = screen.getByRole('tabpanel', { hidden: false });
    expect(visiblePanel).toHaveAttribute('id', 'simple-tabpanel-1');
    expect(visiblePanel).toHaveAttribute('aria-labelledby', 'simple-tab-1');
  });

  test('should handle empty tabs array', () => {
    render(<Content tabs={[]} />);
    
    // Should render without crashing, but no tab panels
    expect(screen.getByTestId('greeting-section')).toBeInTheDocument();
  });
});