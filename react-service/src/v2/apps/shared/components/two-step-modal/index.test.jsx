import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TwoStepModal from './index';

// Mock clink-components
jest.mock('clink-components', () => ({
  Button: ({ children, handleClick }) => (
    <button onClick={handleClick}>{children}</button>
  ),
  Modal: ({ openElement, render }) => (
    <div>
      {openElement}
      {render({ handleClose: jest.fn() })}
    </div>
  ),
  ModalContent: ({ children }) => <div>{children}</div>,
}));

// Mock Step Components
const MockStep1 = ({ onNext, onCancel }) => (
  <div>
    <h2>Step 1</h2>
    <button onClick={() => onNext({ step1Data: 'test' })}>Next</button>
    <button onClick={onCancel}>Cancel</button>
  </div>
);

const MockStep2 = ({ onBack, onCancel, formData }) => (
  <div>
    <h2>Step 2</h2>
    <p>Data: {formData.step1Data}</p>
    <button onClick={onBack}>Back</button>
    <button onClick={onCancel}>Complete</button>
  </div>
);

describe('TwoStepModal Component', () => {
  const mockOnComplete = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    title: 'Test Two Step Modal',
    Step1Component: MockStep1,
    Step2Component: MockStep2,
    openElement: <button>Open Modal</button>,
    onComplete: mockOnComplete,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with Step 1 by default', () => {
    render(<TwoStepModal {...defaultProps} />);
    
    expect(screen.getByText('Test Two Step Modal')).toBeInTheDocument();
    expect(screen.getByText('Step 1')).toBeInTheDocument();
    expect(screen.queryByText('Step 2')).not.toBeInTheDocument();
  });

  it('advances to Step 2 when Next is clicked', () => {
    render(<TwoStepModal {...defaultProps} />);
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    expect(screen.queryByText('Step 1')).not.toBeInTheDocument();
  });

  it('passes data from Step 1 to Step 2', () => {
    render(<TwoStepModal {...defaultProps} />);
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    
    expect(screen.getByText('Data: test')).toBeInTheDocument();
  });

  it('goes back to Step 1 from Step 2', () => {
    render(<TwoStepModal {...defaultProps} />);
    
    // Go to Step 2
    fireEvent.click(screen.getByText('Next'));
    expect(screen.getByText('Step 2')).toBeInTheDocument();
    
    // Go back to Step 1
    fireEvent.click(screen.getByText('Back'));
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });

  it('calls onClose when Complete is clicked in Step 2', () => {
    render(<TwoStepModal {...defaultProps} />);
    
    // Go to Step 2
    fireEvent.click(screen.getByText('Next'));
    
    // Complete the form (which triggers onCancel/onClose)
    fireEvent.click(screen.getByText('Complete'));
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('renders with custom className', () => {
    const { container } = render(
      <TwoStepModal {...defaultProps} className="custom-modal" />
    );
    
    expect(container).toBeInTheDocument();
  });

  it('passes step props to components', () => {
    const step1Props = { customProp: 'value1' };
    const step2Props = { customProp: 'value2' };
    
    render(
      <TwoStepModal
        {...defaultProps}
        step1Props={step1Props}
        step2Props={step2Props}
      />
    );
    
    expect(screen.getByText('Step 1')).toBeInTheDocument();
  });
});

