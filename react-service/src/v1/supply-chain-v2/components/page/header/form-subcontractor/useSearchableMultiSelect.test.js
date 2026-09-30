import { renderHook, act } from '@testing-library/react-hooks';
import useSearchableMultiSelect from './useSearchableMultiSelect';
import { isClickInsideAutocomplete } from './autocomplete-shared';

jest.mock('./autocomplete-shared', () => {
  const actual = jest.requireActual('./autocomplete-shared');
  return {
    ...actual,
    isClickInsideAutocomplete: jest.fn(() => false),
    tagOrderingHandler: jest.fn((currentValues, handleChange) => (_event, newValue) => {
      handleChange(newValue);
    }),
  };
});

describe('useSearchableMultiSelect', () => {
  const options = [
    { id: 1, label: 'Above Ground Drainage' },
    { id: 2, label: '3D Modelling' },
  ];

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('initialises closed with empty search and filtered options', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useSearchableMultiSelect({ options, value: [], onChange }),
    );

    expect(result.current.open).toBe(false);
    expect(result.current.search).toBe('');
    expect(result.current.filteredOptions).toEqual(options);
  });

  test('updates search and filtered options', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useSearchableMultiSelect({ options, value: [], onChange }),
    );

    act(() => {
      result.current.setSearch('3D');
    });

    expect(result.current.search).toBe('3D');
    expect(result.current.filteredOptions).toEqual([{ id: 2, label: '3D Modelling' }]);
  });

  test('closes dropdown and clears search', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useSearchableMultiSelect({ options, value: [], onChange }),
    );

    act(() => {
      result.current.setOpen(true);
      result.current.setSearch('3D');
    });

    act(() => {
      result.current.close();
    });

    expect(result.current.open).toBe(false);
    expect(result.current.search).toBe('');
  });

  test('registers click outside listener while open', () => {
    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
    const onChange = jest.fn();
    const { result, unmount } = renderHook(() =>
      useSearchableMultiSelect({ options, value: [], onChange }),
    );

    act(() => {
      result.current.setOpen(true);
    });

    expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

    unmount();
    addEventListenerSpy.mockRestore();
  });

  test('forwards selection changes through tagOrderingHandler', () => {
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useSearchableMultiSelect({ options, value: [], onChange }),
    );
    const newValue = [{ id: 1, label: 'Above Ground Drainage' }];

    act(() => {
      result.current.handleChange({}, newValue);
    });

    expect(onChange).toHaveBeenCalledWith(newValue);
  });

  test('closes when clicking outside the autocomplete', () => {
    isClickInsideAutocomplete.mockReturnValue(false);
    const onChange = jest.fn();
    const { result } = renderHook(() =>
      useSearchableMultiSelect({ options, value: [], onChange }),
    );

    act(() => {
      result.current.setOpen(true);
      result.current.setSearch('3D');
    });

    act(() => {
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    });

    expect(result.current.open).toBe(false);
    expect(result.current.search).toBe('');
  });

  test('keeps option order stable while open and selecting without search', () => {
    const onChange = jest.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useSearchableMultiSelect({ options, value, onChange }),
      { initialProps: { value: [] } },
    );

    act(() => {
      result.current.setOpen(true);
    });

    const orderOnOpen = result.current.filteredOptions.map((option) => option.id);

    rerender({ value: [{ id: 2, label: '3D Modelling' }] });

    expect(result.current.filteredOptions.map((option) => option.id)).toEqual(orderOnOpen);
  });
});
