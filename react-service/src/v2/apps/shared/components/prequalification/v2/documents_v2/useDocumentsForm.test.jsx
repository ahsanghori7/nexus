import React from 'react';
import { render, screen } from '@testing-library/react';
import useDocumentsForm from './useDocumentsForm';

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(),
}));

// Mock the common.js file
jest.mock('./common', () => jest.fn());

// Test component that uses the hook
const TestComponent = ({ data, typeDocument }) => {
  const hookResult = useDocumentsForm(data, typeDocument);
  
  return (
    <div data-testid="hook-result">
      <div data-testid="values">{JSON.stringify(hookResult.values)}</div>
      <div data-testid="has-handleSubmit">{typeof hookResult.handleSubmit === 'function' ? 'true' : 'false'}</div>
      <div data-testid="has-reset">{typeof hookResult.reset === 'function' ? 'true' : 'false'}</div>
      <div data-testid="has-trigger">{typeof hookResult.trigger === 'function' ? 'true' : 'false'}</div>
      <div data-testid="has-register">{typeof hookResult.register === 'function' ? 'true' : 'false'}</div>
      <div data-testid="has-setValue">{typeof hookResult.setValue === 'function' ? 'true' : 'false'}</div>
      <div data-testid="has-resetField">{typeof hookResult.resetField === 'function' ? 'true' : 'false'}</div>
      <div data-testid="has-control">{typeof hookResult.control === 'object' ? 'true' : 'false'}</div>
      <div data-testid="has-errors">{typeof hookResult.errors === 'object' ? 'true' : 'false'}</div>
    </div>
  );
};

describe('useDocumentsForm Hook', () => {
  let mockUseForm;
  let mockCreateDocObj;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Get the mocked modules
    const { useForm } = jest.requireMock('react-hook-form');
    const createDocObj = jest.requireMock('./common');
    
    mockUseForm = useForm;
    mockCreateDocObj = createDocObj;
    
    // Setup default mock implementations
    mockCreateDocObj.mockReturnValue({
      section: 'test-section',
      id: '',
      label: '',
      date: '',
      price: '',
      description: null,
      document: []
    });
    
    mockUseForm.mockReturnValue({
      reset: jest.fn(),
      control: { _defaultValues: {}, _formState: {} },
      trigger: jest.fn(),
      register: jest.fn(),
      setValue: jest.fn(),
      getValues: jest.fn(() => ({ testField: 'testValue' })),
      handleSubmit: jest.fn(),
      resetField: jest.fn(),
      formState: { errors: {} }
    });
  });

  describe('Hook Initialization', () => {
    it('should initialize with default values from createDocObj', () => {
      const testData = { id: 1, label: 'Test Document' };
      const testType = 'INS';
      
      render(<TestComponent data={testData} typeDocument={testType} />);
      
      expect(mockCreateDocObj).toHaveBeenCalledWith(testData, testType);
      expect(mockCreateDocObj).toHaveBeenCalledTimes(1);
    });

    it('should call useForm with correct defaultValues', () => {
      const expectedDefaultValues = {
        section: 'insurance',
        id: 'test-id',
        label: 'Test Insurance',
        date: '2023-01-01',
        price: '1000',
        description: 'Test description',
        document: []
      };
      
      mockCreateDocObj.mockReturnValue(expectedDefaultValues);
      
      render(<TestComponent data={{ id: 'test-id' }} typeDocument="INS" />);
      
      expect(mockUseForm).toHaveBeenCalledWith({ 
        defaultValues: expectedDefaultValues 
      });
    });

    it('should handle null or undefined data parameter', () => {
      render(<TestComponent data={null} typeDocument="ACC" />);
      
      expect(mockCreateDocObj).toHaveBeenCalledWith(null, 'ACC');
      expect(mockUseForm).toHaveBeenCalled();
    });

    it('should handle null or undefined typeDocument parameter', () => {
      const testData = { id: 1 };
      
      render(<TestComponent data={testData} typeDocument={null} />);
      
      expect(mockCreateDocObj).toHaveBeenCalledWith(testData, null);
      expect(mockUseForm).toHaveBeenCalled();
    });
  });

  describe('Return Values', () => {
    it('should return all required properties', () => {
      render(<TestComponent data={{}} typeDocument="QUA" />);
      
      expect(screen.getByTestId('has-handleSubmit')).toHaveTextContent('true');
      expect(screen.getByTestId('has-reset')).toHaveTextContent('true');
      expect(screen.getByTestId('has-trigger')).toHaveTextContent('true');
      expect(screen.getByTestId('has-register')).toHaveTextContent('true');
      expect(screen.getByTestId('has-setValue')).toHaveTextContent('true');
      expect(screen.getByTestId('has-resetField')).toHaveTextContent('true');
      expect(screen.getByTestId('has-control')).toHaveTextContent('true');
      expect(screen.getByTestId('has-errors')).toHaveTextContent('true');
    });

    it('should return values from getValues function', () => {
      const mockGetValues = jest.fn(() => ({ 
        field1: 'value1', 
        field2: 'value2' 
      }));
      
      mockUseForm.mockReturnValue({
        reset: jest.fn(),
        control: {},
        trigger: jest.fn(),
        register: jest.fn(),
        setValue: jest.fn(),
        getValues: mockGetValues,
        handleSubmit: jest.fn(),
        resetField: jest.fn(),
        formState: { errors: {} }
      });
      
      render(<TestComponent data={{}} typeDocument="HS" />);
      
      expect(screen.getByTestId('values')).toHaveTextContent(JSON.stringify({ 
        field1: 'value1', 
        field2: 'value2' 
      }));
      expect(mockGetValues).toHaveBeenCalled();
    });

    it('should return correct function references', () => {
      const mockReset = jest.fn();
      const mockTrigger = jest.fn();
      const mockRegister = jest.fn();
      const mockSetValue = jest.fn();
      const mockHandleSubmit = jest.fn();
      const mockResetField = jest.fn();
      const mockControl = { test: 'control' };
      const mockErrors = { field: 'error' };
      
      mockUseForm.mockReturnValue({
        reset: mockReset,
        control: mockControl,
        trigger: mockTrigger,
        register: mockRegister,
        setValue: mockSetValue,
        getValues: jest.fn(() => ({})),
        handleSubmit: mockHandleSubmit,
        resetField: mockResetField,
        formState: { errors: mockErrors }
      });
      
      render(<TestComponent data={{}} typeDocument="ENV" />);
      
      // Just verify that functions are properly returned as functions
      expect(screen.getByTestId('has-handleSubmit')).toHaveTextContent('true');
      expect(screen.getByTestId('has-reset')).toHaveTextContent('true');
      expect(screen.getByTestId('has-trigger')).toHaveTextContent('true');
      expect(screen.getByTestId('has-register')).toHaveTextContent('true');
      expect(screen.getByTestId('has-setValue')).toHaveTextContent('true');
      expect(screen.getByTestId('has-resetField')).toHaveTextContent('true');
      expect(screen.getByTestId('has-control')).toHaveTextContent('true');
      expect(screen.getByTestId('has-errors')).toHaveTextContent('true');
    });
  });

  describe('Different Document Types', () => {
    it('should work with insurance documents', () => {
      const insuranceData = {
        id: 'ins-1',
        label: 'Public Liability Insurance',
        date: '2024-12-31',
        price: '2000000'
      };
      
      render(<TestComponent data={insuranceData} typeDocument="INS" />);
      
      expect(mockCreateDocObj).toHaveBeenCalledWith(insuranceData, 'INS');
    });

    it('should work with accreditation documents', () => {
      const accreditationData = {
        id: 'acc-1',
        label: 'ISO 9001 Certificate',
        date: '2025-01-15',
        description: 'Quality management system'
      };
      
      render(<TestComponent data={accreditationData} typeDocument="ACC" />);
      
      expect(mockCreateDocObj).toHaveBeenCalledWith(accreditationData, 'ACC');
    });

    it('should work with quality documents', () => {
      const qualityData = {
        id: 'qua-1',
        label: 'Quality Policy',
        document: 'quality-policy.pdf'
      };
      
      render(<TestComponent data={qualityData} typeDocument="QUA" />);
      
      expect(mockCreateDocObj).toHaveBeenCalledWith(qualityData, 'QUA');
    });

    it('should work with health & safety documents', () => {
      const hsData = {
        id: 'hs-1',
        label: 'Health & Safety Policy',
        document: 'hs-policy.pdf'
      };
      
      render(<TestComponent data={hsData} typeDocument="HS" />);
      
      expect(mockCreateDocObj).toHaveBeenCalledWith(hsData, 'HS');
    });

    it('should work with environmental documents', () => {
      const envData = {
        id: 'env-1',
        label: 'Environmental Policy',
        document: 'env-policy.pdf'
      };
      
      render(<TestComponent data={envData} typeDocument="ENV" />);
      
      expect(mockCreateDocObj).toHaveBeenCalledWith(envData, 'ENV');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data object', () => {
      render(<TestComponent data={{}} typeDocument="INS" />);
      
      expect(mockCreateDocObj).toHaveBeenCalledWith({}, 'INS');
      expect(mockUseForm).toHaveBeenCalled();
    });

    it('should handle data with extra documents', () => {
      const dataWithExtra = {
        id: 'test-1',
        label: 'Test Document',
        extra: [
          { id: 'extra-1', label: 'Extra Document 1', file: 'extra1.pdf' },
          { id: 'extra-2', label: 'Extra Document 2', file: 'extra2.pdf' }
        ]
      };
      
      render(<TestComponent data={dataWithExtra} typeDocument="INS" />);
      
      expect(mockCreateDocObj).toHaveBeenCalledWith(dataWithExtra, 'INS');
    });

    it('should handle data with complete document information', () => {
      const completeData = {
        id: 'complete-1',
        label: 'Complete Document',
        date: '2024-01-01',
        price: '5000',
        description: 'A complete document with all fields',
        document: 'complete-doc.pdf',
        original_file: 'original-complete-doc.pdf'
      };
      
      render(<TestComponent data={completeData} typeDocument="ACC" />);
      
      expect(mockCreateDocObj).toHaveBeenCalledWith(completeData, 'ACC');
    });

    it('should handle form state errors correctly', () => {
      const formErrors = {
        label: { type: 'required', message: 'Label is required' },
        date: { type: 'pattern', message: 'Invalid date format' }
      };
      
      mockUseForm.mockReturnValue({
        reset: jest.fn(),
        control: {},
        trigger: jest.fn(),
        register: jest.fn(),
        setValue: jest.fn(),
        getValues: jest.fn(() => ({})),
        handleSubmit: jest.fn(),
        resetField: jest.fn(),
        formState: { errors: formErrors }
      });
      
      render(<TestComponent data={{}} typeDocument="QUA" />);
      
      expect(screen.getByTestId('has-errors')).toHaveTextContent('true');
    });
  });

  describe('Complex Data Integration', () => {
    it('should pass through complex document structures', () => {
      const complexData = {
        id: 'complex-1',
        label: 'Complex Document',
        date: '2024-06-15',
        price: '10000',
        description: 'A complex document structure',
        document: 'complex-doc.pdf',
        original_file: 'original-complex.pdf',
        extra: [
          {
            id: 'extra-complex-1',
            certificate: 'CERT001',
            label: 'Additional Certificate',
            file: 'additional-cert.pdf',
            original_file: 'original-additional-cert.pdf'
          }
        ]
      };
      
      render(<TestComponent data={complexData} typeDocument="ACC" />);
      
      expect(mockCreateDocObj).toHaveBeenCalledWith(complexData, 'ACC');
    });

    it('should handle undefined values gracefully', () => {
      render(<TestComponent data={undefined} typeDocument={undefined} />);
      
      expect(mockCreateDocObj).toHaveBeenCalledWith(undefined, undefined);
      expect(mockUseForm).toHaveBeenCalled();
    });

    it('should call getValues and return current form values', () => {
      const mockValues = {
        section: 'test',
        id: 'test-id',
        label: 'Test Label',
        date: '2024-01-01',
        price: '1000'
      };
      
      mockUseForm.mockReturnValue({
        reset: jest.fn(),
        control: {},
        trigger: jest.fn(),
        register: jest.fn(),
        setValue: jest.fn(),
        getValues: jest.fn(() => mockValues),
        handleSubmit: jest.fn(),
        resetField: jest.fn(),
        formState: { errors: {} }
      });
      
      render(<TestComponent data={{}} typeDocument="INS" />);
      
      expect(screen.getByTestId('values')).toHaveTextContent(JSON.stringify(mockValues));
    });
  });
});