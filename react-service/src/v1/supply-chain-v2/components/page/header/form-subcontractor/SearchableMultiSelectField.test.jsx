import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchableMultiSelectField from './SearchableMultiSelectField';

jest.mock('@mui/material/Autocomplete', () => ({
  __esModule: true,
  default: ({ onOpen, onClose, renderInput }) => (
    <div data-testid="autocomplete-container">
      <button type="button" data-testid="open-autocomplete" onClick={onOpen}>
        Open
      </button>
      <button
        type="button"
        data-testid="close-autocomplete"
        onClick={() => onClose({}, 'toggleInput')}
      >
        Close
      </button>
      <button
        type="button"
        data-testid="blur-autocomplete"
        onClick={() => onClose({}, 'blur')}
      >
        Blur
      </button>
      {renderInput?.({ inputProps: {} })}
    </div>
  ),
}));

jest.mock('./FieldHolder', () => ({
  __esModule: true,
  default: ({ label, children }) => (
    <div>
      <label htmlFor={`field-${label}`}>{label}</label>
      {children}
    </div>
  ),
}));

jest.mock('./autocomplete-shared', () => ({
  AUTOCOMPLETE_TEXT_FIELD_STYLES: {},
  getAutocompleteSlotProps: jest.fn(() => ({})),
  getOptionLabel: (option) => option.label || option.name || '',
  isOptionEqualToValue: (option, value) => Number(option.id) === Number(value.id),
  renderOptionWithCheckbox: jest.fn(),
  renderAutocompleteTags: jest.fn(() => null),
  DropdownPaper: ({ children }) => <div data-testid="dropdown-paper">{children}</div>,
  filterOptionsBySearch: jest.fn((options) => options),
  isClickInsideAutocomplete: jest.fn(() => true),
  tagOrderingHandler: jest.fn((_currentValues, handleChange) => (_event, newValue) => {
    handleChange(newValue);
  }),
}));

describe('SearchableMultiSelectField', () => {
  const defaultProps = {
    label: 'Assign trades',
    name: 'trades',
    error: {},
    options: [
      { id: 1, label: 'Above Ground Drainage' },
      { id: 2, label: '3D Modelling' },
    ],
    value: [{ id: 1, label: 'Above Ground Drainage' }],
    onChange: jest.fn(),
  };

  test('renders label and autocomplete field', () => {
    render(<SearchableMultiSelectField {...defaultProps} />);

    expect(screen.getByText('Assign trades')).toBeInTheDocument();
    expect(screen.getByTestId('autocomplete-container')).toBeInTheDocument();
  });

  test('opens and closes the dropdown through autocomplete callbacks', () => {
    render(<SearchableMultiSelectField {...defaultProps} />);

    fireEvent.click(screen.getByTestId('open-autocomplete'));
    fireEvent.click(screen.getByTestId('close-autocomplete'));

    expect(screen.getByTestId('autocomplete-container')).toBeInTheDocument();
  });

  test('ignores blur close events', () => {
    render(<SearchableMultiSelectField {...defaultProps} />);

    fireEvent.click(screen.getByTestId('open-autocomplete'));
    fireEvent.click(screen.getByTestId('blur-autocomplete'));

    expect(screen.getByTestId('autocomplete-container')).toBeInTheDocument();
  });
});
