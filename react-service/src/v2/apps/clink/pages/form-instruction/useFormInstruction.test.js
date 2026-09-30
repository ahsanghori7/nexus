import { renderHook } from '@testing-library/react-hooks';
import useFormInstruction from './useFormInstruction';

describe('useFormInstruction', () => {
  let mockSetValue;
  let mockGetValues;
  let mockCreateInstruction;
  
  beforeEach(() => {
    mockSetValue = jest.fn();
    mockGetValues = jest.fn(() => ({
      subcontractor: null,
      package: null,
      pid: 1,
      type: 1,
    }));
    mockCreateInstruction = jest.fn();
  });

  it('returns fullForm as false initially', () => {
    const { result } = renderHook(() =>
      useFormInstruction(null, mockSetValue, mockGetValues, mockCreateInstruction)
    );
    
    expect(result.current.fullForm).toBe(false);
  });

  it('handles subcontractor without packages', () => {
    const subcontractor = { id: 1, name: 'Test Sub' };
    
    const { result } = renderHook(() =>
      useFormInstruction(subcontractor, mockSetValue, mockGetValues, mockCreateInstruction)
    );
    
    expect(result.current.fullForm).toBe(false);
    expect(mockSetValue).not.toHaveBeenCalled();
  });

  it('handles subcontractor with empty packages array', () => {
    const subcontractor = { id: 1, name: 'Test Sub', packages: [] };
    
    const { result } = renderHook(() =>
      useFormInstruction(subcontractor, mockSetValue, mockGetValues, mockCreateInstruction)
    );
    
    expect(result.current.fullForm).toBe(false);
    expect(mockSetValue).not.toHaveBeenCalled();
  });

  it('handles subcontractor with multiple packages', () => {
    const subcontractor = {
      id: 1,
      name: 'Test Sub',
      packages: [
        { id: 1, name: 'Package 1' },
        { id: 2, name: 'Package 2' }
      ]
    };
    
    const { result } = renderHook(() =>
      useFormInstruction(subcontractor, mockSetValue, mockGetValues, mockCreateInstruction)
    );
    
    expect(result.current.fullForm).toBe(false);
    expect(mockSetValue).not.toHaveBeenCalled();
  });

  it('sets package when subcontractor has unique package', () => {
    const subcontractor = {
      id: 1,
      name: 'Test Sub',
      packages: [{ id: 1, name: 'Test Package' }]
    };
    
    // Update mockGetValues to return valid data for this test case
    mockGetValues.mockReturnValue({
      subcontractor,
      package: subcontractor.packages[0],
      pid: 1,
      type: 1,
    });
    
    renderHook(() =>
      useFormInstruction(subcontractor, mockSetValue, mockGetValues, mockCreateInstruction)
    );
    
    expect(mockSetValue).toHaveBeenCalledWith('package', subcontractor.packages[0]);
  });
});