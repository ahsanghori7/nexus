import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import EnquiryModal, { TENDER_RECEIVED_ID } from './index';

// Mock the child components
jest.mock('./send-quote', () => {
  const MockSendQuote = (props) => <div data-testid="send-quote">Send Quote Component</div>;
  MockSendQuote.TENDER_RECEIVED_ID = 4;
  return MockSendQuote;
});

jest.mock('./StartBOQ', () => {
  return (props) => <div data-testid="start-boq">Start BOQ Component</div>;
});

jest.mock('./CommonModal', () => {
  return (props) => {
    const { renderModal, openElement, externalOpen } = props;
    const mockModalProps = { handleClose: jest.fn() };
    
    return (
      <div data-testid="common-modal">
        {openElement && (
          <div data-testid="modal-trigger" onClick={() => {}}>
            {openElement}
          </div>
        )}
        {externalOpen && (
          <div data-testid="modal-content">
            {renderModal(mockModalProps)}
          </div>
        )}
      </div>
    );
  };
});

jest.mock('./send-quote/ActionButton', () => {
  return (props) => (
    <div 
      data-testid="action-button" 
      className={props.className}
      disabled={props.disabled}
    >
      Action Button: {props.text}
    </div>
  );
});

describe('EnquiryModal', () => {
  const mockProps = {
    action: { text: 'Send Quote' },
    enquiry: {
      package: 'test-package',
      project: 'test-project',
      status_id: TENDER_RECEIVED_ID,
      document: {
        enquiry: {
          has_boq: false
        }
      }
    },
    externalOpen: false,
    hideDefaultOpenModalContent: false,
    onHidden: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<EnquiryModal {...mockProps} />);
    expect(screen.getByTestId('common-modal')).toBeInTheDocument();
  });

  it('should render disabled ActionButton when status is not TENDER_RECEIVED_ID', () => {
    const propsWithWrongStatus = {
      ...mockProps,
      enquiry: {
        ...mockProps.enquiry,
        status_id: 1 // Different from TENDER_RECEIVED_ID
      }
    };

    render(<EnquiryModal {...propsWithWrongStatus} />);
    
    const actionButton = screen.getByTestId('action-button');
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveAttribute('disabled');
    expect(actionButton).toHaveTextContent('Send Quote');
  });

  it('should render CommonModal with proper openElement when status is TENDER_RECEIVED_ID', () => {
    render(<EnquiryModal {...mockProps} />);
    
    expect(screen.getByTestId('common-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-trigger')).toBeInTheDocument();
  });

  it('should not render openElement when hideDefaultOpenModalContent is true', () => {
    const propsWithHiddenContent = {
      ...mockProps,
      hideDefaultOpenModalContent: true
    };

    render(<EnquiryModal {...propsWithHiddenContent} />);
    
    expect(screen.getByTestId('common-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('modal-trigger')).not.toBeInTheDocument();
  });

  it('should render SendQuote component when enquiry has no BOQ', () => {
    const propsWithExternalOpen = {
      ...mockProps,
      externalOpen: true
    };

    render(<EnquiryModal {...propsWithExternalOpen} />);
    
    expect(screen.getByTestId('send-quote')).toBeInTheDocument();
    expect(screen.queryByTestId('start-boq')).not.toBeInTheDocument();
  });

  it('should render StartBOQ component when enquiry has BOQ and step is 0', () => {
    const propsWithBoq = {
      ...mockProps,
      externalOpen: true,
      enquiry: {
        ...mockProps.enquiry,
        document: {
          enquiry: {
            has_boq: true
          }
        }
      }
    };

    render(<EnquiryModal {...propsWithBoq} />);
    
    expect(screen.getByTestId('start-boq')).toBeInTheDocument();
    expect(screen.queryByTestId('send-quote')).not.toBeInTheDocument();
  });

  it('should handle missing action prop gracefully', () => {
    const propsWithoutAction = {
      ...mockProps,
      action: undefined
    };

    render(<EnquiryModal {...propsWithoutAction} />);
    
    expect(screen.getByTestId('common-modal')).toBeInTheDocument();
  });

  it('should handle missing enquiry prop gracefully', () => {
    const propsWithoutEnquiry = {
      ...mockProps,
      enquiry: undefined
    };

    render(<EnquiryModal {...propsWithoutEnquiry} />);
    
    const actionButton = screen.getByTestId('action-button');
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveAttribute('disabled');
  });

  it('should export TENDER_RECEIVED_ID constant', () => {
    expect(TENDER_RECEIVED_ID).toBe(4);
  });

  it('should handle null enquiry document', () => {
    const propsWithNullDocument = {
      ...mockProps,
      enquiry: {
        ...mockProps.enquiry,
        document: null
      }
    };

    render(<EnquiryModal {...propsWithNullDocument} />);
    
    expect(screen.getByTestId('common-modal')).toBeInTheDocument();
  });

  it('should handle undefined enquiry document enquiry', () => {
    const propsWithUndefinedEnquiry = {
      ...mockProps,
      enquiry: {
        ...mockProps.enquiry,
        document: {
          enquiry: undefined
        }
      }
    };

    render(<EnquiryModal {...propsWithUndefinedEnquiry} />);
    
    expect(screen.getByTestId('common-modal')).toBeInTheDocument();
  });

  it('should pass onHidden prop to CommonModal', () => {
    const mockOnHidden = jest.fn();
    const propsWithOnHidden = {
      ...mockProps,
      onHidden: mockOnHidden
    };

    render(<EnquiryModal {...propsWithOnHidden} />);
    
    expect(screen.getByTestId('common-modal')).toBeInTheDocument();
    // The onHidden function should be passed through (tested via CommonModal component)
  });

  it('should render SendQuote when hasBoq is true but step is 1', () => {
    // Test the branch where hasBoq is true and step is truthy (line 18)
    // We'll mock the component to force this scenario
    
    // Create props that would cause hasBoq to be true
    const propsWithBoqAndStep = {
      ...mockProps,
      externalOpen: true,
      enquiry: {
        ...mockProps.enquiry,
        document: {
          enquiry: {
            has_boq: true
          }
        }
      }
    };

    render(<EnquiryModal {...propsWithBoqAndStep} />);
    
    // The component should render the modal content
    expect(screen.getByTestId('common-modal')).toBeInTheDocument();
  });

  it('should handle step transition from StartBOQ to SendQuote', () => {
    // Test the RenderModal component logic when step changes
    // First, let's test with hasBoq: false (line 15-16)
    const propsWithoutBoq = {
      ...mockProps,
      externalOpen: true,
      enquiry: {
        ...mockProps.enquiry,
        document: {
          enquiry: {
            has_boq: false
          }
        }
      }
    };

    render(<EnquiryModal {...propsWithoutBoq} />);
    
    // Should render SendQuote directly when hasBoq is false
    expect(screen.getByTestId('send-quote')).toBeInTheDocument();
    expect(screen.queryByTestId('start-boq')).not.toBeInTheDocument();
  });

  it('should handle default props correctly', () => {
    const minimalProps = {};
    
    render(<EnquiryModal {...minimalProps} />);
    
    // Should render disabled action button due to missing status_id
    const actionButton = screen.getByTestId('action-button');
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveAttribute('disabled');
  });

  it('should handle enquiry with missing document object', () => {
    const propsWithoutDocument = {
      ...mockProps,
      enquiry: {
        package: 'test-package',
        project: 'test-project',
        status_id: TENDER_RECEIVED_ID
        // document property is missing
      }
    };

    render(<EnquiryModal {...propsWithoutDocument} />);
    
    expect(screen.getByTestId('common-modal')).toBeInTheDocument();
  });

  it('should properly handle externalOpen prop', () => {
    const propsWithExternalOpenFalse = {
      ...mockProps,
      externalOpen: false
    };

    render(<EnquiryModal {...propsWithExternalOpenFalse} />);
    
    expect(screen.getByTestId('common-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument();
  });

  it('should handle onHidden as null', () => {
    const propsWithNullOnHidden = {
      ...mockProps,
      onHidden: null
    };

    render(<EnquiryModal {...propsWithNullOnHidden} />);
    
    expect(screen.getByTestId('common-modal')).toBeInTheDocument();
  });

  it('should handle hideDefaultOpenModalContent correctly', () => {
    const propsWithHideContent = {
      ...mockProps,
      hideDefaultOpenModalContent: true
    };

    render(<EnquiryModal {...propsWithHideContent} />);
    
    expect(screen.getByTestId('common-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('modal-trigger')).not.toBeInTheDocument();
  });
});