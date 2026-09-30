import { renderHook } from '@testing-library/react-hooks';
import useDocumentsForm from './useDocumentsForm';

// Mock react-hook-form
jest.mock('react-hook-form', () => ({
  useForm: jest.fn(() => ({
    reset: jest.fn(),
    control: {},
    trigger: jest.fn(),
    register: jest.fn(),
    setValue: jest.fn(),
    getValues: jest.fn(() => ({ mockField: 'mockValue' })),
    handleSubmit: jest.fn(),
    resetField: jest.fn(),
    formState: { errors: {} },
  })),
}));

// Mock the common module
jest.mock('./common', () => jest.fn(() => ({ defaultField: 'defaultValue' })));

describe('useDocumentsForm', () => {
  it('should return form utilities', () => {
    const mockData = { field1: 'value1' };
    const mockTypeDocument = 'testType';
    
    const { result } = renderHook(() => useDocumentsForm(mockData, mockTypeDocument));
    
    expect(result.current).toHaveProperty('values');
    expect(result.current).toHaveProperty('reset');
    expect(result.current).toHaveProperty('control');
    expect(result.current).toHaveProperty('trigger');
    expect(result.current).toHaveProperty('register');
    expect(result.current).toHaveProperty('setValue');
    expect(result.current).toHaveProperty('handleSubmit');
    expect(result.current).toHaveProperty('resetField');
    expect(result.current).toHaveProperty('errors');
  });

  it('should return values from getValues', () => {
    const mockData = { field1: 'value1' };
    const mockTypeDocument = 'testType';
    
    const { result } = renderHook(() => useDocumentsForm(mockData, mockTypeDocument));
    
    expect(result.current.values).toEqual({ mockField: 'mockValue' });
  });

  it('should return errors from formState', () => {
    const mockData = { field1: 'value1' };
    const mockTypeDocument = 'testType';
    
    const { result } = renderHook(() => useDocumentsForm(mockData, mockTypeDocument));
    
    expect(result.current.errors).toEqual({});
  });

  it('takes a snapshot', () => {
    const mockData = { field1: 'value1' };
    const mockTypeDocument = 'testType';
    
    const { result } = renderHook(() => useDocumentsForm(mockData, mockTypeDocument));
    
    expect(result.current).toMatchSnapshot();
  });
});