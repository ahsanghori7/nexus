import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EmailCheck from './EmailCheck';
import { fetchData } from 'services/helpers';

// Mock dependencies
jest.mock('services/helpers', () => ({
  fetchData: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

// Mock shared components
jest.mock('./shared/Wrapper', () => 
  ({ Component }) => <Component styles={{ mb: '16px', titleSize: '24px', noWrap: 'nowrap' }} />
);

// Store the linkList for testing
let mockLinkList = [];

jest.mock('./shared/Container', () => 
  ({ children, styles, linkList, resend, useSubmitted, useLoading }) => {
    mockLinkList = linkList; // Store for testing
    return (
      <div data-testid="container">
        <div data-testid="link-list">{JSON.stringify(linkList)}</div>
        <div data-testid="resend">{resend ? 'resend-enabled' : 'resend-disabled'}</div>
        <div data-testid="submitted">{String(useSubmitted[0])}</div>
        <div data-testid="loading">{useLoading[0] ? 'loading' : 'not-loading'}</div>
        {children}
      </div>
    );
  }
);

jest.mock('./shared/Title', () => 
  ({ title, styles, marginBottom, variant, fontWeight }) => (
    <div data-testid="title">
      <span data-testid="title-text">{title}</span>
      <span data-testid="title-variant">{variant || 'default'}</span>
      <span data-testid="title-weight">{fontWeight || 'normal'}</span>
      <span data-testid="title-margin">{marginBottom}</span>
      <span data-testid="title-styles">{JSON.stringify(styles)}</span>
    </div>
  )
);

const mockUseParams = require('react-router-dom').useParams;

describe('EmailCheck', () => {
  const defaultStyles = {
    mb: '16px',
    titleSize: '24px',
    noWrap: 'nowrap',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLinkList = []; // Clear the stored link list
    mockUseParams.mockReturnValue({ token: 'test-token-123' });
  });

  it('renders correctly with default state', () => {
    render(
      <BrowserRouter>
        <EmailCheck styles={defaultStyles} />
      </BrowserRouter>
    );

    // Check if main title is rendered
    const titleElements = screen.getAllByTestId('title-text');
    expect(titleElements[0]).toHaveTextContent('check-email');
    
    // Check if description is rendered
    expect(titleElements[1]).toHaveTextContent('check-email-desc');

    // Check if container has resend enabled
    expect(screen.getByTestId('resend')).toHaveTextContent('resend-enabled');

    // Check initial states
    expect(screen.getByTestId('submitted')).toHaveTextContent('false');
    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
  });

  it('applies correct styles to main title', () => {
    render(
      <BrowserRouter>
        <EmailCheck styles={defaultStyles} />
      </BrowserRouter>
    );

    const titleStyles = screen.getAllByTestId('title-styles')[0];
    expect(JSON.parse(titleStyles.textContent)).toEqual({
      fontSize: '24px',
      whiteSpace: 'nowrap',
    });
  });

  it('applies correct properties to description title', () => {
    render(
      <BrowserRouter>
        <EmailCheck styles={defaultStyles} />
      </BrowserRouter>
    );

    const titleElements = screen.getAllByTestId('title-variant');
    const titleWeights = screen.getAllByTestId('title-weight');
    
    expect(titleElements[1]).toHaveTextContent('normal');
    expect(titleWeights[1]).toHaveTextContent('200');
  });

  it('creates correct link list for resend functionality', () => {
    render(
      <BrowserRouter>
        <EmailCheck styles={defaultStyles} />
      </BrowserRouter>
    );

    expect(mockLinkList).toHaveLength(1);
    expect(mockLinkList[0]).toEqual({
      props: { onClick: expect.any(Function), to: '#' },
      linkCopy: 'resend',
      linkDesc: 'didnt-receive',
    });
  });

  it('handles successful resend request', async () => {
    fetchData.mockResolvedValue({ success: true });
    
    render(
      <BrowserRouter>
        <EmailCheck styles={defaultStyles} />
      </BrowserRouter>
    );

    // Get the onClick function from the stored link list
    const handleSubmit = mockLinkList[0].props.onClick;

    // Trigger the submit
    handleSubmit();

    await waitFor(() => {
      expect(screen.getByTestId('submitted')).toHaveTextContent('1');
    });

    expect(fetchData).toHaveBeenCalledWith(
      'account',
      {},
      'activation_resend/test-token-123',
      '',
      ''
    );
  });

  it('handles failed resend request', async () => {
    fetchData.mockResolvedValue({ success: false });
    
    render(
      <BrowserRouter>
        <EmailCheck styles={defaultStyles} />
      </BrowserRouter>
    );

    const handleSubmit = mockLinkList[0].props.onClick;

    handleSubmit();

    await waitFor(() => {
      expect(screen.getByTestId('submitted')).toHaveTextContent('2');
    });
  });

  it('handles network error during resend request', async () => {
    fetchData.mockRejectedValue(new Error('Network error'));
    
    render(
      <BrowserRouter>
        <EmailCheck styles={defaultStyles} />
      </BrowserRouter>
    );

    const handleSubmit = mockLinkList[0].props.onClick;

    handleSubmit();

    await waitFor(() => {
      expect(screen.getByTestId('submitted')).toHaveTextContent('3');
    });
  });

  it('sets loading state during request', async () => {
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    fetchData.mockReturnValue(promise);
    
    render(
      <BrowserRouter>
        <EmailCheck styles={defaultStyles} />
      </BrowserRouter>
    );

    const handleSubmit = mockLinkList[0].props.onClick;

    handleSubmit();

    // Should be loading immediately
    expect(screen.getByTestId('loading')).toHaveTextContent('loading');

    // Resolve the promise
    resolvePromise({ success: true });

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
    });
  });

  it('resets submitted state before new request', async () => {
    fetchData.mockResolvedValue({ success: true });
    
    render(
      <BrowserRouter>
        <EmailCheck styles={defaultStyles} />
      </BrowserRouter>
    );

    const handleSubmit = mockLinkList[0].props.onClick;

    // First submission
    handleSubmit();
    await waitFor(() => {
      expect(screen.getByTestId('submitted')).toHaveTextContent('1');
    });

    // Second submission should reset submitted state
    handleSubmit();
    
    // During the request, submitted should be false
    expect(screen.getByTestId('submitted')).toHaveTextContent('false');
  });

  it('uses token from URL params', () => {
    mockUseParams.mockReturnValue({ token: 'different-token' });
    fetchData.mockResolvedValue({ success: true });
    
    render(
      <BrowserRouter>
        <EmailCheck styles={defaultStyles} />
      </BrowserRouter>
    );

    const handleSubmit = mockLinkList[0].props.onClick;

    handleSubmit();

    expect(fetchData).toHaveBeenCalledWith(
      'account',
      {},
      'activation_resend/different-token',
      '',
      ''
    );
  });

  it('renders wrapped component correctly', () => {
    render(<EmailCheck styles={defaultStyles} />);
    
    // Should render the Container with children
    expect(screen.getByTestId('container')).toBeInTheDocument();
    const titleElements = screen.getAllByTestId('title-text');
    expect(titleElements[0]).toHaveTextContent('check-email');
  });
});

describe('EmailCheckStep', () => {
  it('renders EmailCheck wrapped in Wrapper component', () => {
    const EmailCheckStep = require('./EmailCheck').default;
    
    render(
      <BrowserRouter>
        <EmailCheckStep />
      </BrowserRouter>
    );

    expect(screen.getByTestId('container')).toBeInTheDocument();
    const titleElements = screen.getAllByTestId('title-text');
    expect(titleElements[0]).toHaveTextContent('check-email');
  });
});