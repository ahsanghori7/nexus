import React from 'react';
import { render, screen } from '@testing-library/react';
import PMP from './index';

// Mock the child components
jest.mock('./Progress', () => {
  return function MockProgress({ activeStep }) {
    return <div data-testid="progress-component">Progress: {activeStep}</div>;
  };
});

jest.mock('./Section', () => {
  return function MockSection({ activeStep }) {
    return <div data-testid="section-component">Section: {activeStep}</div>;
  };
});

describe('PMP Component', () => {
  it('should render without crashing', () => {
    render(<PMP activeStep={0} />);
    
    expect(screen.getByTestId('progress-component')).toBeInTheDocument();
    expect(screen.getByTestId('section-component')).toBeInTheDocument();
  });

  it('should pass activeStep prop to child components', () => {
    const activeStep = 2;
    render(<PMP activeStep={activeStep} />);
    
    expect(screen.getByText(`Progress: ${activeStep}`)).toBeInTheDocument();
    expect(screen.getByText(`Section: ${activeStep}`)).toBeInTheDocument();
  });

  it('should handle different activeStep values', () => {
    const { rerender } = render(<PMP activeStep={0} />);
    expect(screen.getByText('Progress: 0')).toBeInTheDocument();
    expect(screen.getByText('Section: 0')).toBeInTheDocument();

    rerender(<PMP activeStep={1} />);
    expect(screen.getByText('Progress: 1')).toBeInTheDocument();
    expect(screen.getByText('Section: 1')).toBeInTheDocument();
  });

  it('should render both components in the correct structure', () => {
    const { container } = render(<PMP activeStep={1} />);
    
    // Check that it's wrapped in a React fragment (which renders as div in testing)
    const progressElement = screen.getByTestId('progress-component');
    const sectionElement = screen.getByTestId('section-component');
    
    expect(progressElement).toBeInTheDocument();
    expect(sectionElement).toBeInTheDocument();
    
    // Progress should come before Section in the DOM
    expect(progressElement.compareDocumentPosition(sectionElement) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});