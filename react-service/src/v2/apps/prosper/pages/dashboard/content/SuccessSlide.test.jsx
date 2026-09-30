import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SuccessSlide from './SuccessSlide';

// Mock dependencies
jest.mock('dompurify', () => ({
  sanitize: jest.fn((html) => html)
}));

jest.mock('clink-components', () => ({
  CONSTANTS: {
    s3: {
      luke: 'mock-luke-image.jpg',
      pngLightpurpleQuotes: 'mock-light-quotes.png',
      pngPurpleQuotes: 'mock-purple-quotes.png'
    }
  },
  Image: ({ src, ...props }) => <img src={src} alt="mock-image" {...props} />,
  Button: ({ children, handleClick, ...props }) => (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  )
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn((key, options) => {
      const translations = {
        'dashboard-success': 'I had great success with this platform and would recommend it to others',
        'dashboard-watch-success': 'Watch Success Story'
      };
      return translations[key] || key;
    })
  })
}));

jest.mock('v2/helpers/url', () => ({
  getUrl: jest.fn((site, path) => `${site}/${path}`),
  goTo: jest.fn()
}));

jest.mock('./Dashboard.styled', () => ({
  Slide: ({ children, src, ...props }) => (
    <div data-testid="slide" data-src={src} {...props}>
      {children}
    </div>
  ),
  Content: ({ children, ...props }) => (
    <div data-testid="content" {...props}>
      {children}
    </div>
  ),
  QuottedParagraph: ({ children, ...props }) => (
    <div data-testid="quoted-paragraph" {...props}>
      {children}
    </div>
  ),
  QuottedParagraphText: ({ children, dangerouslySetInnerHTML, ...props }) => (
    <div 
      data-testid="quoted-paragraph-text" 
      dangerouslySetInnerHTML={dangerouslySetInnerHTML}
      {...props}
    />
  ),
  QuottedParagraphSubtext: ({ children, ...props }) => (
    <div data-testid="quoted-paragraph-subtext" {...props}>
      {children}
    </div>
  ),
  SubtextStrong: ({ children, ...props }) => (
    <strong data-testid="subtext-strong" {...props}>
      {children}
    </strong>
  ),
  ButtonWrapper: ({ children, success, ...props }) => (
    <div data-testid="button-wrapper" data-success={success} {...props}>
      {children}
    </div>
  )
}));

describe('SuccessSlide', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<SuccessSlide />);
    expect(screen.getByTestId('slide')).toBeInTheDocument();
  });

  it('renders with correct background image', () => {
    render(<SuccessSlide />);
    const slide = screen.getByTestId('slide');
    expect(slide).toHaveAttribute('data-src', 'mock-luke-image.jpg');
  });

  it('renders all main sections', () => {
    render(<SuccessSlide />);
    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(screen.getByTestId('quoted-paragraph')).toBeInTheDocument();
    expect(screen.getByTestId('quoted-paragraph-text')).toBeInTheDocument();
    expect(screen.getByTestId('quoted-paragraph-subtext')).toBeInTheDocument();
    expect(screen.getByTestId('button-wrapper')).toBeInTheDocument();
  });

  it('renders quote images', () => {
    render(<SuccessSlide />);
    const images = screen.getAllByAltText('mock-image');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'mock-light-quotes.png');
    expect(images[1]).toHaveAttribute('src', 'mock-purple-quotes.png');
  });

  it('renders author information', () => {
    render(<SuccessSlide />);
    expect(screen.getByTestId('subtext-strong')).toHaveTextContent('Luke');
    expect(screen.getByText('- LBC Design & Install')).toBeInTheDocument();
  });

  it('renders success button', () => {
    render(<SuccessSlide />);
    expect(screen.getByText('Watch Success Story')).toBeInTheDocument();
  });

  it('button wrapper has success prop', () => {
    render(<SuccessSlide />);
    const buttonWrapper = screen.getByTestId('button-wrapper');
    expect(buttonWrapper).toHaveAttribute('data-success', 'true');
  });

  it('calls navigation function when button is clicked', () => {
    const { getUrl, goTo } = require('v2/helpers/url');
    render(<SuccessSlide />);
    
    const button = screen.getByText('Watch Success Story');
    fireEvent.click(button);
    
    expect(getUrl).toHaveBeenCalledWith('prosper', 'resources/success-stories?popoverShowOnLoad=true');
    expect(goTo).toHaveBeenCalled();
  });

  it('renders with correct button color', () => {
    render(<SuccessSlide />);
    const button = screen.getByText('Watch Success Story');
    expect(button).toHaveAttribute('color', 'prosperGreenButton');
  });

  it('sanitizes the success text content', () => {
    const DOMPurify = require('dompurify');
    render(<SuccessSlide />);
    
    expect(DOMPurify.sanitize).toHaveBeenCalledWith('I had great success with this platform and would recommend it to others');
  });

  it('renders i18n attribute correctly', () => {
    render(<SuccessSlide />);
    const textElement = screen.getByTestId('quoted-paragraph-text');
    expect(textElement).toHaveAttribute('data-i18n', '[html]content.body');
  });
});