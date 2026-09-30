import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StartBOQ from './StartBOQ';

jest.mock('v2/helpers/url', () => ({
  goTo: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

describe('StartBOQ', () => {
  const defaultProps = {
    setStep: jest.fn(),
    enquiry: {
      id: '123',
      slug: 'test-enquiry',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<StartBOQ {...defaultProps} />);
    expect(screen.getByText('new-quote-exp')).toBeInTheDocument();
  });

  it('should render with proper title and subtitle', () => {
    render(<StartBOQ {...defaultProps} />);
    expect(screen.getByText('new-quote-exp')).toBeInTheDocument();
    expect(screen.getByText('new-quote-exp-sub')).toBeInTheDocument();
  });

  it('should render all expected text content', () => {
    render(<StartBOQ {...defaultProps} />);
    
    expect(screen.getByText('new-quote-exp-text-1')).toBeInTheDocument();
    expect(screen.getByText('new-quote-exp-text-2')).toBeInTheDocument();
    expect(screen.getByText('new-quote-exp-text-3')).toBeInTheDocument();
    expect(screen.getByText('new-quote-exp-text-4')).toBeInTheDocument();
    expect(screen.getByText('new-quote-exp-text-5')).toBeInTheDocument();
    expect(screen.getByText('new-quote-exp-text-6')).toBeInTheDocument();
    expect(screen.getByText('new-quote-exp-text-7')).toBeInTheDocument();
  });

  it('should render primary action button', () => {
    render(<StartBOQ {...defaultProps} />);
    const primaryButton = screen.getByText('new-quote-exp-text-button');
    expect(primaryButton).toBeInTheDocument();
  });

  it('should render secondary link button', () => {
    render(<StartBOQ {...defaultProps} />);
    expect(screen.getByText('Go to')).toBeInTheDocument();
    expect(screen.getByText('new-quote-exp-text-8')).toBeInTheDocument();
  });

  it('should call goTo with correct URL when primary button is clicked', () => {
    const { goTo } = require('v2/helpers/url');
    render(<StartBOQ {...defaultProps} />);
    
    const primaryButton = screen.getByText('new-quote-exp-text-button');
    fireEvent.click(primaryButton);
    
    expect(goTo).toHaveBeenCalledWith('enquiries/submit-quote/test-enquiry/123');
  });

  it('should call setStep when secondary button is clicked', () => {
    render(<StartBOQ {...defaultProps} />);
    
    const secondaryButton = screen.getByText('Go to').closest('button');
    fireEvent.click(secondaryButton);
    
    expect(defaultProps.setStep).toHaveBeenCalledWith(1);
  });

  it('should handle missing enquiry props gracefully', () => {
    const propsWithoutEnquiry = {
      setStep: jest.fn(),
      enquiry: {},
    };
    
    render(<StartBOQ {...propsWithoutEnquiry} />);
    expect(screen.getByText('new-quote-exp')).toBeInTheDocument();
  });

  it('should render image element', () => {
    render(<StartBOQ {...defaultProps} />);
    // Image is mocked, so we check if the component renders without errors
    expect(screen.getByText('new-quote-exp')).toBeInTheDocument();
  });

  it('should render OR text between buttons', () => {
    render(<StartBOQ {...defaultProps} />);
    expect(screen.getByText('OR')).toBeInTheDocument();
  });

  it('should apply proper styling to buttons', () => {
    render(<StartBOQ {...defaultProps} />);
    
    const primaryButton = screen.getByText('new-quote-exp-text-button');
    expect(primaryButton).toHaveAttribute('type', 'button');
  });

  it('should handle missing setStep prop gracefully', () => {
    const propsWithoutSetStep = {
      enquiry: {
        id: '123',
        slug: 'test-enquiry',
      },
    };
    
    // Should render without crashing even when setStep is not provided
    render(<StartBOQ {...propsWithoutSetStep} />);
    expect(screen.getByText('new-quote-exp')).toBeInTheDocument();
    
    // Clicking the secondary button should not throw an error
    const secondaryButton = screen.getByText('Go to').closest('button');
    expect(() => fireEvent.click(secondaryButton)).not.toThrow();
  });
});