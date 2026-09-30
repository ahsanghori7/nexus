import React from 'react';
import { render, screen } from '@testing-library/react';
import HowItWorks from './HowItWorks';

// Mock all the dependencies completely
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

jest.mock('hooks/useScript', () => {
  return jest.fn(() => ({
    loaded: true,
    error: null
  }));
});

jest.mock('v2/apps/shared/styled/LandingPage.styled', () => ({
  StyledWrapper: ({ children, ...props }) => <div data-testid="styled-wrapper" {...props}>{children}</div>,
  StyledWrapperLeft: ({ children, ...props }) => <div data-testid="styled-wrapper-left" {...props}>{children}</div>,
  StyledContentLeft: ({ children, ...props }) => <div data-testid="styled-content-left" {...props}>{children}</div>,
  StyledWrapperRight: ({ children, ...props }) => <div data-testid="styled-wrapper-right" {...props}>{children}</div>,
  StyledContentRight: ({ children, ...props }) => <div data-testid="styled-content-right" {...props}>{children}</div>,
  StyledRedLink: ({ children, ...props }) => <a data-testid="styled-red-link" {...props}>{children}</a>,
  StyledBold: ({ children, ...props }) => <strong data-testid="styled-bold" {...props}>{children}</strong>,
  StyledP: ({ children, ...props }) => <p data-testid="styled-p" {...props}>{children}</p>,
  StyledTitle: ({ children, ...props }) => <h1 data-testid="styled-title" {...props}>{children}</h1>,
  StyledTitle2: ({ children, ...props }) => <h2 data-testid="styled-title2" {...props}>{children}</h2>,
  StyledDescription: ({ children, ...props }) => <p data-testid="styled-description" {...props}>{children}</p>,
  StyledVideo: ({ children, ...props }) => <div data-testid="styled-video" {...props}>{children}</div>,
  StyledContainer: ({ children, ...props }) => <div data-testid="styled-container" {...props}>{children}</div>,
  StyledTextContainer: ({ children, ...props }) => <div data-testid="styled-text-container" {...props}>{children}</div>,
  StyledSmallVideo: ({ children, ...props }) => <div data-testid="styled-small-video" {...props}>{children}</div>
}));

jest.mock('v2/helpers/url', () => ({
  wistiaConfigUrl: jest.fn((id) => `https://mock-wistia.com/${id}`)
}));

jest.mock('v2/constants/wistia', () => ({
  HOW_IT_WORKS: {
    SHOW: [
      { id: 'video1', title: 'Video 1' },
      { id: 'video2', title: 'Video 2' }
    ]
  }
}));

describe('HowItWorks Component (Simple Test)', () => {
  test('renders without crashing', () => {
    render(<HowItWorks />);
    expect(screen.getByTestId('styled-wrapper')).toBeInTheDocument();
  });
});