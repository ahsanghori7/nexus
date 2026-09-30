import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SendQuote, { TENDER_RECEIVED_ID } from './index';

// Mock the child components
jest.mock('./form', () => {
  return (props) => (
    <div data-testid="send-quote-form">
      <button 
        data-testid="submit-form" 
        onClick={() => props.handleSubmit({
          price: '1000',
          work: '800',
          prelims: '100',
          other: '100',
          programme: '2 weeks'
        })}
      >
        Submit Form
      </button>
      <button 
        data-testid="update-docs" 
        onClick={() => props.updateDocumentsToSend([{ name: 'test.pdf' }])}
      >
        Update Documents
      </button>
    </div>
  );
});

jest.mock('../CommonModal', () => ({
  CommonContent: (props) => (
    <div data-testid="common-content">
      <h1 data-testid="title">{props.title}</h1>
      <h2 data-testid="subtitle">{props.subtitle}</h2>
      <div data-testid="content">{props.children}</div>
    </div>
  )
}));

// Mock services/helpers
jest.mock('services/helpers', () => ({
  analytics: jest.fn((eventName, authorId, groupId, callback) => {
    if (callback) callback();
  })
}));

// Mock subscription helper
jest.mock('v2/helpers/user/subscription', () => {
  return jest.fn().mockImplementation(() => ({
    isExternal: jest.fn((subscriptionId) => subscriptionId === 'external')
  }));
});

describe('SendQuote', () => {
  const mockDispatch = jest.fn();
  const mockHandleClose = jest.fn();
  
  const defaultProps = {
    enquiry: {
      id: '123',
      package: 'Test Package',
      project: 'Test Project',
      id_author: 'author-123',
      group_id: 'group-456'
    },
    dispatch: mockDispatch,
    subcontractor: {
      subscription_id: 'sub-123'
    },
    onHidden: mockHandleClose
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the dispatch mock to return a promise
    mockDispatch.mockImplementation(() => ({
      then: jest.fn((callback) => {
        if (callback) callback();
        return Promise.resolve();
      })
    }));
  });

  it('should render without crashing', () => {
    render(<SendQuote {...defaultProps} />);
    expect(screen.getByTestId('common-content')).toBeInTheDocument();
  });

  it('should render CommonContent with correct title and subtitle', () => {
    render(<SendQuote {...defaultProps} />);
    
    expect(screen.getByTestId('title')).toHaveTextContent('send-quotation');
    expect(screen.getByTestId('subtitle')).toHaveTextContent('Test Package at Test Project');
  });

  it('should render Form component', () => {
    render(<SendQuote {...defaultProps} />);
    
    expect(screen.getByTestId('send-quote-form')).toBeInTheDocument();
  });

  it('should handle default props correctly', () => {
    const propsWithDefaults = {
      dispatch: mockDispatch,
      subcontractor: {}
    };
    
    render(<SendQuote {...propsWithDefaults} />);
    
    expect(screen.getByTestId('subtitle')).toHaveTextContent('trade at project');
  });

  it('should call analytics and dispatch on form submit', async () => {
    const { analytics } = require('services/helpers');
    
    render(<SendQuote {...defaultProps} />);
    
    const submitButton = screen.getByTestId('submit-form');
    fireEvent.click(submitButton);

    expect(analytics).toHaveBeenCalledWith(
      'history.quote.sent',
      'author-123',
      'group-456',
      expect.any(Function)
    );

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CREATE_QUOTE',
          payload: expect.objectContaining({
            enquiryId: '123',
            data: expect.objectContaining({
              document: expect.anything(),
              price: '1000',
              work: '800',
              prelims: '100',
              other: '100',
              programme: '2 weeks'
            })
          })
        })
      );
    });
  });

  it('should enable prosper pro banner for external subscription', async () => {
    const propsWithExternalSub = {
      ...defaultProps,
      subcontractor: {
        subscription_id: 'external'
      }
    };
    
    render(<SendQuote {...propsWithExternalSub} />);
    
    const submitButton = screen.getByTestId('submit-form');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ENABLE_PROSPER_PRO_BANNER',
          payload: {
            enableProsperProBanner: true
          }
        })
      );
    });
  });

  it('should not enable prosper pro banner for non-external subscription', async () => {
    render(<SendQuote {...defaultProps} />);
    
    const submitButton = screen.getByTestId('submit-form');
    fireEvent.click(submitButton);

    await waitFor(() => {
      const prosperProCalls = mockDispatch.mock.calls.filter(call => 
        call[0].type === 'ENABLE_PROSPER_PRO_BANNER'
      );
      
      if (prosperProCalls.length > 0) {
        expect(prosperProCalls[0][0].payload.enableProsperProBanner).toBe(false);
      }
    });
  });

  it('should update documents when updateDocumentsToSend is called', () => {
    render(<SendQuote {...defaultProps} />);
    
    const updateDocsButton = screen.getByTestId('update-docs');
    fireEvent.click(updateDocsButton);

    // Since docsToSend is internal state, we can test by submitting after updating docs
    const submitButton = screen.getByTestId('submit-form');
    fireEvent.click(submitButton);

    // The documents should be included in the form data
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          data: expect.objectContaining({
            document: expect.any(Object) // Since DataTransfer.files becomes a MockFileList
          })
        })
      })
    );
  });

  it('should export TENDER_RECEIVED_ID constant', () => {
    expect(TENDER_RECEIVED_ID).toBe(4);
  });

  it('should handle missing enquiry properties gracefully', () => {
    const propsWithMinimalEnquiry = {
      ...defaultProps,
      enquiry: {}
    };
    
    render(<SendQuote {...propsWithMinimalEnquiry} />);
    
    expect(screen.getByTestId('subtitle')).toHaveTextContent('trade at project');
  });

  it('should handle missing subcontractor prop', () => {
    const propsWithoutSubcontractor = {
      ...defaultProps,
      subcontractor: undefined
    };
    
    expect(() => {
      render(<SendQuote {...propsWithoutSubcontractor} />);
    }).not.toThrow();
    
    expect(screen.getByTestId('common-content')).toBeInTheDocument();
  });

  it('should use default handleClose function when not provided', () => {
    const propsWithoutHandleClose = {
      enquiry: defaultProps.enquiry,
      dispatch: mockDispatch,
      subcontractor: defaultProps.subcontractor
    };
    
    expect(() => {
      render(<SendQuote {...propsWithoutHandleClose} />);
    }).not.toThrow();
    
    expect(screen.getByTestId('common-content')).toBeInTheDocument();
  });

  it('should create FileList from documents correctly', () => {
    render(<SendQuote {...defaultProps} />);
    
    // First add some documents
    const updateDocsButton = screen.getByTestId('update-docs');
    fireEvent.click(updateDocsButton);
    
    // Then submit the form
    const submitButton = screen.getByTestId('submit-form');
    fireEvent.click(submitButton);

    // Verify that the DataTransfer and FileList creation logic was triggered
    expect(mockDispatch).toHaveBeenCalled();
  });

  it('should handle handleClose default parameter correctly', () => {
    const propsWithoutHandleClose = {
      enquiry: {
        id: '123',
        package: 'Test Package',
        project: 'Test Project',
        id_author: 'author-123',
        group_id: 'group-456'
      },
      dispatch: mockDispatch,
      subcontractor: {}
      // handleClose is intentionally omitted to test the default parameter
    };
    
    // Should render without error
    render(<SendQuote {...propsWithoutHandleClose} />);
    expect(screen.getByTestId('common-content')).toBeInTheDocument();
    
    // Should be able to submit form without errors even with default handleClose
    const submitButton = screen.getByTestId('submit-form');
    expect(() => fireEvent.click(submitButton)).not.toThrow();
  });
});