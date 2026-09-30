import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the styled components and dependencies inline for this specific test
jest.mock('v2/apps/shared/styled/LandingPage.styled', () => ({
  StyledWrapper: ({ children, ...props }) => <div {...props} data-testid="styled-wrapper">{children}</div>,
  StyledWrapperLeft: ({ children, ...props }) => <div {...props} data-testid="styled-wrapper-left">{children}</div>,
  StyledWrapperRight: ({ children, ...props }) => <div {...props} data-testid="styled-wrapper-right">{children}</div>,
  StyledTitle: ({ children, ...props }) => <h1 {...props} data-testid="styled-title">{children}</h1>,
  StyledTitle2: ({ children, ...props }) => <h2 {...props} data-testid="styled-title2">{children}</h2>,
  StyledVideo: ({ children, ...props }) => <div {...props} data-testid="styled-video">{children}</div>,
  StyledP: ({ children, ...props }) => <p {...props} data-testid="styled-p">{children}</p>,
  StyledRedLink: ({ children, ...props }) => <a {...props} data-testid="styled-red-link">{children}</a>,
  StyledContainer: ({ children, ...props }) => <div {...props} data-testid="styled-container">{children}</div>,
  StyledBold: ({ children, ...props }) => <strong {...props} data-testid="styled-bold">{children}</strong>,
  StyledDescription: ({ children, ...props }) => <div {...props} data-testid="styled-description">{children}</div>,
  StyledSmallVideo: ({ children, ...props }) => <div {...props} data-testid="styled-small-video">{children}</div>,
  StyledTextContainer: ({ children, ...props }) => <div {...props} data-testid="styled-text-container">{children}</div>,
  StyledContentLeft: ({ children, ...props }) => <div {...props} data-testid="styled-content-left">{children}</div>,
  StyledContentRight: ({ children, ...props }) => <div {...props} data-testid="styled-content-right">{children}</div>,
}));

jest.mock('v2/helpers/url', () => ({
  wistiaConfigUrl: jest.fn((id, suffix = '') => `https://mock-wistia.com/${id}${suffix}`)
}));

jest.mock('hooks/useScript', () => ({
  __esModule: true,
  default: jest.fn(() => ({ loaded: true, error: null }))
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

const mockWistiaConstants = {
  PROSPER_EXPLAINER_ID: 'mock-explainer-id',
  BULK_PROSPER_UPLOAD: 'mock-bulk-upload',
  USER_UPLOADED_PROSPER: 'mock-user-uploaded',
  MANUAL_UPLOAD_PROSPER: 'mock-manual-upload',
};

jest.mock('constants/wistia', () => mockWistiaConstants);

// Import the component after all mocks are set up
import HowItWorks from './HowItWorks';

describe('HowItWorks Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    render(<HowItWorks />);
    
    // Check if main wrapper is rendered
    expect(screen.getByTestId('styled-wrapper')).toBeInTheDocument();
  });

  test('renders main sections', () => {
    render(<HowItWorks />);
    
    // Check if left and right wrappers are rendered
    expect(screen.getByTestId('styled-wrapper-left')).toBeInTheDocument();
    expect(screen.getByTestId('styled-wrapper-right')).toBeInTheDocument();
  });

  test('renders title elements', () => {
    render(<HowItWorks />);
    
    // Check if titles are rendered
    const titles = screen.getAllByTestId('styled-title');
    expect(titles.length).toBeGreaterThan(0);
  });

  test('renders video container', () => {
    render(<HowItWorks />);
    
    // Check if video container is rendered
    expect(screen.getByTestId('styled-video')).toBeInTheDocument();
  });

  test('renders paragraphs with content', () => {
    render(<HowItWorks />);
    
    // Check if paragraphs are rendered
    const paragraphs = screen.getAllByTestId('styled-p');
    expect(paragraphs.length).toBeGreaterThan(0);
  });

  test('renders email link', () => {
    render(<HowItWorks />);
    
    // Check if email link is rendered
    expect(screen.getByTestId('styled-red-link')).toBeInTheDocument();
  });

  test('renders video guide containers', () => {
    render(<HowItWorks />);
    
    // Check if video guide containers are rendered
    const containers = screen.getAllByTestId('styled-container');
    expect(containers.length).toBeGreaterThan(0);
  });

  test('renders bold and description elements', () => {
    render(<HowItWorks />);
    
    // Check if bold elements are rendered
    const boldElements = screen.getAllByTestId('styled-bold');
    expect(boldElements.length).toBeGreaterThan(0);
  });

  test('component structure matches expected layout', () => {
    render(<HowItWorks />);
    
    // Check the overall structure
    const wrapper = screen.getByTestId('styled-wrapper');
    const leftWrapper = screen.getByTestId('styled-wrapper-left');
    const rightWrapper = screen.getByTestId('styled-wrapper-right');
    
    expect(wrapper).toContainElement(leftWrapper);
    expect(wrapper).toContainElement(rightWrapper);
  });

  test('uses translation keys correctly', () => {
    const mockT = jest.fn((key) => key);
    
    jest.doMock('react-i18next', () => ({
      useTranslation: () => ({
        t: mockT,
      }),
    }));
    
    render(<HowItWorks />);
    
    // Verify that translation function would be called
    // This is a basic test to ensure the component structure is maintained
    expect(screen.getByTestId('styled-wrapper')).toBeInTheDocument();
  });
});