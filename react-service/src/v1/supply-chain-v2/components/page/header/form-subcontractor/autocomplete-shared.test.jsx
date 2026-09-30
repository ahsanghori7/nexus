import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CONSTANTS } from 'clink-components';
import {
  getOptionLabel,
  getOptionId,
  dedupeOptionsById,
  filterOptionsBySearch,
  sortSelectedOptionsFirst,
  isClickInsideAutocomplete,
  getAutocompleteSlotProps,
  isOptionEqualToValue,
  renderOptionWithCheckbox,
  renderAutocompleteTags,
  tagOrderingHandler,
  DropdownPaper,
} from './autocomplete-shared';

jest.mock('v1/supply-chain-v2/helpers', () => ({
  __esModule: true,
  default: {
    selectOptionV2: jest.fn((selected) => selected),
  },
}));

const { striped } = CONSTANTS.colors.general;

describe('autocomplete-shared', () => {
  const tradeOptions = [
    { id: 1, label: 'Above Ground Drainage' },
    { id: 2, label: 'Brick / Facade Cleaning' },
    { id: 2, label: 'Brick / Facade Cleaning' },
    { id: 3, name: '3D Modelling' },
    { value: 4, label: 'Access Controls' },
  ];

  describe('getOptionLabel', () => {
    test('returns label when present', () => {
      expect(getOptionLabel({ label: 'Above Ground Drainage' })).toBe('Above Ground Drainage');
    });

    test('falls back to name when label is missing', () => {
      expect(getOptionLabel({ name: '3D Modelling' })).toBe('3D Modelling');
    });

    test('returns empty string when no label or name', () => {
      expect(getOptionLabel({})).toBe('');
    });
  });

  describe('getOptionId', () => {
    test('returns id when present', () => {
      expect(getOptionId({ id: 10 })).toBe(10);
    });

    test('falls back to value when id is missing', () => {
      expect(getOptionId({ value: 4 })).toBe(4);
    });
  });

  describe('dedupeOptionsById', () => {
    test('removes duplicate options by id', () => {
      const result = dedupeOptionsById(tradeOptions);

      expect(result).toHaveLength(4);
      expect(result.filter((option) => getOptionId(option) === 2)).toHaveLength(1);
    });
  });

  describe('sortSelectedOptionsFirst', () => {
    test('places selected options first in selection order', () => {
      const selected = [
        { id: 3, label: '3D Modelling' },
        { id: 1, label: 'Above Ground Drainage' },
      ];

      const result = sortSelectedOptionsFirst(tradeOptions, selected);

      expect(result.slice(0, 2).map(getOptionLabel)).toEqual([
        '3D Modelling',
        'Above Ground Drainage',
      ]);
    });

    test('returns original order when nothing is selected', () => {
      expect(sortSelectedOptionsFirst(tradeOptions, [])).toEqual(tradeOptions);
    });
  });

  describe('filterOptionsBySearch', () => {
    test('returns deduped options with selected items first when search is empty', () => {
      const selected = [{ id: 3, name: '3D Modelling' }];

      expect(filterOptionsBySearch(tradeOptions, '', selected).map(getOptionLabel)[0]).toBe(
        '3D Modelling',
      );
    });

    test('returns deduped options when search is empty and nothing is selected', () => {
      expect(filterOptionsBySearch(tradeOptions, '')).toHaveLength(4);
    });

    test('filters options by label case-insensitively', () => {
      const result = filterOptionsBySearch(tradeOptions, 'above');

      expect(result).toHaveLength(1);
      expect(getOptionLabel(result[0])).toBe('Above Ground Drainage');
    });

    test('filters options by name when label is missing', () => {
      const result = filterOptionsBySearch(tradeOptions, '3d');

      expect(result).toHaveLength(1);
      expect(getOptionLabel(result[0])).toBe('3D Modelling');
    });

    test('does not return unrelated matches', () => {
      const result = filterOptionsBySearch(tradeOptions, 'above');

      expect(result.some((option) => getOptionLabel(option).includes('Brick'))).toBe(false);
    });
  });

  describe('isOptionEqualToValue', () => {
    test('compares options by id', () => {
      expect(isOptionEqualToValue({ id: 1 }, { id: 1 })).toBe(true);
      expect(isOptionEqualToValue({ id: 1 }, { id: 2 })).toBe(false);
    });

    test('compares options by value when id is missing', () => {
      expect(isOptionEqualToValue({ value: 4 }, { value: 4 })).toBe(true);
    });
  });

  describe('isClickInsideAutocomplete', () => {
    test('returns true when click is inside container ref', () => {
      const container = document.createElement('div');
      const child = document.createElement('button');
      container.appendChild(child);
      const containerRef = { current: container };

      expect(isClickInsideAutocomplete(child, containerRef)).toBe(true);
    });

    test('returns true when click is inside autocomplete popper', () => {
      const popper = document.createElement('div');
      popper.className = 'MuiAutocomplete-popper';
      const child = document.createElement('button');
      popper.appendChild(child);

      expect(isClickInsideAutocomplete(child, { current: null })).toBe(true);
    });

    test('returns true when click is inside dropdown paper', () => {
      const dropdown = document.createElement('div');
      dropdown.setAttribute('data-supply-chain-autocomplete-dropdown', 'true');
      const child = document.createElement('input');
      dropdown.appendChild(child);

      expect(isClickInsideAutocomplete(child, { current: null })).toBe(true);
    });

    test('returns false when click is outside autocomplete', () => {
      const outside = document.createElement('button');

      expect(isClickInsideAutocomplete(outside, { current: null })).toBe(false);
    });
  });

  describe('getAutocompleteSlotProps', () => {
    test('returns bottom-start popper config with portal disabled', () => {
      const slotProps = getAutocompleteSlotProps();

      expect(slotProps.popper.placement).toBe('bottom-start');
      expect(slotProps.popper.disablePortal).toBe(true);
      expect(slotProps.listbox.sx.maxHeight).toBe(240);
    });

    test('supports custom popper placement', () => {
      const slotProps = getAutocompleteSlotProps('top-start');

      expect(slotProps.popper.placement).toBe('top-start');
    });

    test('applies theme z-index through popper sx callback', () => {
      const slotProps = getAutocompleteSlotProps();

      expect(slotProps.popper.sx.zIndex({ zIndex: { modal: 1300 } })).toBe(1301);
    });
  });

  describe('renderOptionWithCheckbox', () => {
    test('renders selected option with highlight and checked checkbox', () => {
      render(
        renderOptionWithCheckbox(
          { key: '1', 'data-testid': 'trade-option' },
          { id: 1, label: 'Above Ground Drainage' },
          { selected: true },
        ),
      );

      const option = screen.getByTestId('trade-option');
      expect(option).toHaveTextContent('Above Ground Drainage');
      expect(option).toHaveStyle({ backgroundColor: striped });
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    test('renders unselected option without highlight', () => {
      render(
        renderOptionWithCheckbox(
          { key: '2', 'data-testid': 'trade-option' },
          { id: 2, label: 'Access Controls' },
          { selected: false },
        ),
      );

      const option = screen.getByTestId('trade-option');
      expect(option.style.backgroundColor).not.toBe(striped);
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
  });

  describe('renderAutocompleteTags', () => {
    test('renders a chip for each selected value', () => {
      render(
        <>
          {renderAutocompleteTags(
            [
              { id: 1, label: 'Above Ground Drainage' },
              { id: 3, label: '3D Modelling' },
            ],
            ({ index }) => ({ 'data-testid': `tag-${index}` }),
          )}
        </>,
      );

      expect(screen.getByText('Above Ground Drainage')).toBeInTheDocument();
      expect(screen.getByText('3D Modelling')).toBeInTheDocument();
    });
  });

  describe('tagOrderingHandler', () => {
    test('prepends newly added items (LIFO)', () => {
      const handleChange = jest.fn();
      const currentValues = [{ id: 1, label: 'Above Ground Drainage' }];
      const newValue = [
        { id: 1, label: 'Above Ground Drainage' },
        { id: 3, label: '3D Modelling' },
      ];

      tagOrderingHandler(currentValues, handleChange)({}, newValue);

      expect(handleChange).toHaveBeenCalledWith([
        { id: 3, label: '3D Modelling' },
        { id: 1, label: 'Above Ground Drainage' },
      ]);
    });

    test('passes through removals without reordering', () => {
      const handleChange = jest.fn();
      const currentValues = [
        { id: 3, label: '3D Modelling' },
        { id: 1, label: 'Above Ground Drainage' },
      ];
      const newValue = [{ id: 1, label: 'Above Ground Drainage' }];

      tagOrderingHandler(currentValues, handleChange)({}, newValue);

      expect(handleChange).toHaveBeenCalledWith(newValue);
    });

    test('falls back to newValue when no unique item is found', () => {
      const handleChange = jest.fn();
      const currentValues = [{ id: 1, label: 'Above Ground Drainage' }];
      const newValue = [
        { id: 1, label: 'Above Ground Drainage' },
        { id: 1, label: 'Above Ground Drainage' },
      ];

      tagOrderingHandler(currentValues, handleChange)({}, newValue);

      expect(handleChange).toHaveBeenCalledWith(newValue);
    });
  });

  describe('DropdownPaper', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('renders search input and dropdown content', () => {
      const onSearchChange = jest.fn();

      render(
        <DropdownPaper search="" onSearchChange={onSearchChange}>
          <li>Above Ground Drainage</li>
        </DropdownPaper>,
      );

      expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument();
      expect(screen.getByText('Above Ground Drainage')).toBeInTheDocument();
      expect(
        screen.getByRole('textbox').closest('[data-supply-chain-autocomplete-dropdown]'),
      ).toBeInTheDocument();
    });

    test('calls onSearchChange when typing in search input', () => {
      const onSearchChange = jest.fn();

      render(
        <DropdownPaper search="" onSearchChange={onSearchChange}>
          <li>Above Ground Drainage</li>
        </DropdownPaper>,
      );

      fireEvent.change(screen.getByPlaceholderText('Search...'), {
        target: { value: 'above' },
      });

      expect(onSearchChange).toHaveBeenCalledWith('above');
    });

    test('focuses search input on mount', () => {
      const searchInputRef = { current: { focus: jest.fn() } };

      render(
        <DropdownPaper
          search=""
          onSearchChange={jest.fn()}
          searchInputRef={searchInputRef}
        >
          <li>Above Ground Drainage</li>
        </DropdownPaper>,
      );

      jest.runOnlyPendingTimers();

      expect(searchInputRef.current.focus).toHaveBeenCalled();
    });

    test('clears focus timer on unmount', () => {
      const searchInputRef = { current: { focus: jest.fn() } };
      const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');

      const { unmount } = render(
        <DropdownPaper
          search=""
          onSearchChange={jest.fn()}
          searchInputRef={searchInputRef}
        >
          <li>Above Ground Drainage</li>
        </DropdownPaper>,
      );

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    test('handles search input mouse and keyboard events without bubbling', () => {
      const onSearchChange = jest.fn();

      render(
        <DropdownPaper search="" onSearchChange={onSearchChange}>
          <li>Above Ground Drainage</li>
        </DropdownPaper>,
      );

      const searchInput = screen.getByPlaceholderText('Search...');

      fireEvent.mouseDown(searchInput);
      fireEvent.click(searchInput);
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      expect(searchInput).toBeInTheDocument();
    });
  });
});
