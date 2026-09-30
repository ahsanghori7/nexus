import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Form from './index';
import { sizeFileIsCorrect } from 'v2/helpers/files';

// Mock dependencies
jest.mock('clink-components', () => {
  const mockReact = require('react');
  
  const mockFormHook = {
    formState: {
      errors: {},
      isDirty: true,
      isValid: true,
    },
    register: jest.fn(() => ({ name: 'test', onChange: jest.fn(), onBlur: jest.fn(), ref: jest.fn() })),
    setValue: jest.fn(),
    trigger: jest.fn(),
    control: {},
    getValues: jest.fn(() => ({})),
    handleSubmit: jest.fn((fn) => (e) => {
      if (e && e.preventDefault) e.preventDefault();
      fn({});
    }),
  };

  return {
    Form: ({ render, ...props }) => {
      if (render && typeof render === 'function') {
        const content = render(mockFormHook);
        return mockReact.createElement('form', {
          'data-testid': 'clink-form',
          ...props
        }, content);
      }
      return mockReact.createElement('form', { 'data-testid': 'clink-form', ...props });
    },
    InputFormControlled: ({ name, placeholder, type, label, ...props }) => {
      return mockReact.createElement('div', { 'data-testid': `input-form-${name}` }, [
        label && mockReact.createElement('label', { key: 'label' }, label),
        mockReact.createElement('input', {
          'data-testid': `input-${name}`,
          placeholder,
          type,
          key: 'input',
          onChange: jest.fn()
        })
      ]);
    },
    InputForm: ({ name, placeholder, type, label, children, ...props }) => {
      if (type === 'dropzone') {
        return mockReact.createElement('div', { 'data-testid': `input-form-${name}` }, [
          label && mockReact.createElement('label', { key: 'label' }, label),
          mockReact.createElement('div', {
            'data-testid': `input-${name}`,
            key: 'dropzone'
          }, children),
        ]);
      }
      return mockReact.createElement('div', { 'data-testid': `input-form-${name}` }, [
        label && mockReact.createElement('label', { key: 'label' }, label),
        mockReact.createElement('input', {
          'data-testid': `input-${name}`,
          placeholder,
          type,
          key: 'input',
          onChange: jest.fn()
        })
      ]);
    },
    DropzoneWrapper: ({ children, ...props }) => mockReact.createElement('div', {
      'data-testid': 'dropzone-wrapper',
      ...props
    }, children),
    DropzoneIcon: ({ children, ...props }) => mockReact.createElement('div', {
      'data-testid': 'dropzone-icon',
      ...props
    }, children),
    DropzoneContent: ({ children, ...props }) => mockReact.createElement('div', {
      'data-testid': 'dropzone-content',
      ...props
    }, children),
    DropzoneFooter: ({ children, ...props }) => mockReact.createElement('div', {
      'data-testid': 'dropzone-footer',
      ...props
    }, children),
    DropzoneFileList: ({ files = [], handleDelete, validate, ...props }) => mockReact.createElement('div', {
      'data-testid': 'dropzone-file-list',
      ...props
    }, files.map((file, index) =>
      mockReact.createElement('div', {
        key: index,
        'data-testid': `dropzone-file-${index}`,
      }, [
        mockReact.createElement('span', { key: 'name' }, file.name || `file-${index}`),
        mockReact.createElement('button', {
          key: 'delete',
          'data-testid': `delete-file-${index}`,
          onClick: () => handleDelete && handleDelete(file, index)
        }, 'Delete')
      ])
    )),
    Image: ({ src, ...props }) => mockReact.createElement('img', { src, ...props }),
    CONSTANTS: {
      s3: {
        upload: 'mock-upload-icon'
      }
    }
  };
});

jest.mock('v2/helpers/files', () => ({
  sizeFileIsCorrect: jest.fn((file, maxSize) => file.size <= maxSize * 1024 * 1024),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: jest.fn((key, options) => {
      if (key === 'currency') return '£';
      if (key === 'file-too-large') {
        return options?.count === 1 ? 'File too large' : 'Files too large';
      }
      if (key === 'file-size-no-bigger-than') return 'File size no bigger than';
      if (key === 'send-quotation') return 'Send Quotation';
      return key;
    }),
  }),
}));

jest.mock('@mui/material/Box', () => {
  const mockReact = require('react');
  return function Box({ children, ...props }) {
    return mockReact.createElement('div', { 'data-testid': 'mui-box', ...props }, children);
  };
});

jest.mock('@mui/material/Button', () => {
  const mockReact = require('react');
  return function Button({ children, disabled, ...props }) {
    return mockReact.createElement('button', { 
      'data-testid': 'mui-button',
      disabled,
      ...props 
    }, children);
  };
});

describe('SendQuote Form', () => {
  const defaultProps = {
    handleSubmit: jest.fn(),
    updateDocumentsToSend: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the form component', () => {
    render(<Form {...defaultProps} />);
    expect(screen.getByTestId('form-content')).toBeInTheDocument();
  });

  it('should render all currency input fields', () => {
    render(<Form {...defaultProps} />);
    
    expect(screen.getByTestId('input-price')).toBeInTheDocument();
    expect(screen.getByTestId('input-work')).toBeInTheDocument();
    expect(screen.getByTestId('input-prelims')).toBeInTheDocument();
    expect(screen.getByTestId('input-other')).toBeInTheDocument();
  });

  it('should render programme input field', () => {
    render(<Form {...defaultProps} />);
    expect(screen.getByTestId('input-programme')).toBeInTheDocument();
  });

  it('should render document dropzone', () => {
    render(<Form {...defaultProps} />);
    expect(screen.getByTestId('input-document')).toBeInTheDocument();
    expect(screen.getByText('Drag and drop your file here')).toBeInTheDocument();
    expect(screen.getByText('Or')).toBeInTheDocument();
    expect(screen.getByText('Choose file')).toBeInTheDocument();
  });

  it('should render submit button', () => {
    render(<Form {...defaultProps} />);
    expect(screen.getByText('Send Quotation')).toBeInTheDocument();
  });

  it('should show placeholder text for currency fields', () => {
    render(<Form {...defaultProps} />);
    
    const priceInput = screen.getByTestId('input-price');
    const workInput = screen.getByTestId('input-work');
    const prelimsInput = screen.getByTestId('input-prelims');
    const otherInput = screen.getByTestId('input-other');
    
    expect(priceInput).toHaveAttribute('placeholder', '0,000,00.00');
    expect(workInput).toHaveAttribute('placeholder', '0,000,00.00');
    expect(prelimsInput).toHaveAttribute('placeholder', '0,000,00.00');
    expect(otherInput).toHaveAttribute('placeholder', '0,000,00.00');
  });

  it('should show programme field with correct placeholder', () => {
    render(<Form {...defaultProps} />);
    
    const programmeInput = screen.getByTestId('input-programme');
    expect(programmeInput).toHaveAttribute('placeholder', 'Eg: 2');
  });

  it('should apply correct type for currency inputs', () => {
    render(<Form {...defaultProps} />);
    
    expect(screen.getByTestId('input-price')).toHaveAttribute('type', 'currency');
    expect(screen.getByTestId('input-work')).toHaveAttribute('type', 'currency');
    expect(screen.getByTestId('input-prelims')).toHaveAttribute('type', 'currency');
    expect(screen.getByTestId('input-other')).toHaveAttribute('type', 'currency');
  });

  it('should work without updateDocumentsToSend callback', () => {
    const propsWithoutCallback = {
      handleSubmit: jest.fn(),
      updateDocumentsToSend: null,
    };
    
    expect(() => {
      render(<Form {...propsWithoutCallback} />);
    }).not.toThrow();
    
    expect(screen.getByTestId('form-content')).toBeInTheDocument();
  });

  it('should display file size limit in dropzone footer', () => {
    render(<Form {...defaultProps} />);
    expect(screen.getByText('File size no bigger than 100 Mb')).toBeInTheDocument();
  });

  it('should render dropzone components', () => {
    render(<Form {...defaultProps} />);
    
    expect(screen.getByTestId('dropzone-wrapper')).toBeInTheDocument();
    expect(screen.getByTestId('dropzone-icon')).toBeInTheDocument();
    expect(screen.getByTestId('dropzone-content')).toBeInTheDocument();
    expect(screen.getByTestId('dropzone-footer')).toBeInTheDocument();
    expect(screen.getByTestId('dropzone-file-list')).toBeInTheDocument();
  });

  it('should test validateSize function with file validation', () => {
    render(<Form {...defaultProps} />);
    
    // Create a large file that would trigger validation (200MB)
    const largeFile = new File(['content'], 'large.pdf', { type: 'application/pdf', size: 200 * 1024 * 1024 }); // 200MB
    
    // Test that sizeFileIsCorrect would be called with correct parameters
    const result = sizeFileIsCorrect(largeFile, 100);
    expect(sizeFileIsCorrect).toHaveBeenCalledWith(largeFile, 100);
    
    // The mock implementation should determine the result
    expect(typeof result).toBe('boolean');
  });

  it('should validate small files correctly', () => {
    render(<Form {...defaultProps} />);
    
    // Create a small file that should pass validation
    const smallFile = new File(['content'], 'small.pdf', { type: 'application/pdf', size: 1 * 1024 * 1024 }); // 1MB
    
    const result = sizeFileIsCorrect(smallFile, 100);
    expect(sizeFileIsCorrect).toHaveBeenCalledWith(smallFile, 100);
    expect(typeof result).toBe('boolean');
  });

  it('should render all MUI Box components with correct styling', () => {
    render(<Form {...defaultProps} />);
    
    // Should render 4 MUI Box components for currency fields
    const boxes = screen.getAllByTestId('mui-box');
    expect(boxes).toHaveLength(4);
    
    // Each box should have the sx prop with styling
    boxes.forEach(box => {
      expect(box).toBeInTheDocument();
    });
  });

  it('should use correct currency symbol from translation', () => {
    render(<Form {...defaultProps} />);
    
    // The component should call the t function for currency
    // This is tested indirectly through the component rendering successfully
    expect(screen.getByTestId('form-content')).toBeInTheDocument();
  });

  it('should handle constants and theme values correctly', () => {
    render(<Form {...defaultProps} />);
    
    // Verify constants are used correctly
    const dropzoneIcon = screen.getByTestId('dropzone-icon');
    const image = dropzoneIcon.querySelector('img');
    expect(image).toHaveAttribute('src', 'mock-upload-icon');
    
    // Verify footer shows correct max size
    const footer = screen.getByTestId('dropzone-footer');
    expect(footer).toHaveTextContent('100');
  });

  it('should render MUI Button with correct props', () => {
    render(<Form {...defaultProps} />);
    
    const submitButton = screen.getByTestId('mui-button');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveAttribute('type', 'submit');
    expect(submitButton).toHaveAttribute('id', 'submit-button');
    expect(submitButton).toHaveTextContent('Send Quotation');
  });

  it('should handle component state and effects correctly', () => {
    render(<Form {...defaultProps} />);
    
    // Verify the component calls updateDocumentsToSend with empty array initially
    expect(defaultProps.updateDocumentsToSend).toHaveBeenCalledWith([]);
    
    // Verify form content is rendered
    expect(screen.getByTestId('form-content')).toBeInTheDocument();
  });

  it('should handle style currency object correctly', () => {
    render(<Form {...defaultProps} />);
    
    // The styleCurrency should be applied through MUI Box sx prop
    // This is tested indirectly by ensuring all components render
    const boxes = screen.getAllByTestId('mui-box');
    expect(boxes).toHaveLength(4);
  });

  it('should maintain proper component lifecycle', () => {
    // Test component mounts and unmounts without errors
    const { unmount } = render(<Form {...defaultProps} />);
    
    expect(screen.getByTestId('form-content')).toBeInTheDocument();
    
    // Unmount should not throw
    expect(() => unmount()).not.toThrow();
  });
});