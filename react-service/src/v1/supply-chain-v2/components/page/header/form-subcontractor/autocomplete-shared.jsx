import React from 'react';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Search from '@mui/icons-material/Search';
import { CONSTANTS } from 'clink-components';
import SupplyChainHelper from 'v1/supply-chain-v2/helpers';

const { lightPeriwinkle, clinkPurple, clinkGreen, striped } = CONSTANTS.colors.general;

export const getOptionLabel = (option) => option?.label || option?.name || '';

export const getOptionId = (option) => option?.id ?? option?.value;

export const dedupeOptionsById = (options) =>
  options.filter(
    (value, index, self) =>
      index
      === self.findIndex((item) => Number(getOptionId(item)) === Number(getOptionId(value))),
  );

export const isOptionEqualToValue = (option, value) =>
  Number(getOptionId(option)) === Number(getOptionId(value));

export const sortSelectedOptionsFirst = (options, selectedValues = []) => {
  if (!selectedValues.length) {
    return options;
  }

  const unselected = options.filter(
    (option) => !selectedValues.some((value) => isOptionEqualToValue(option, value)),
  );

  const orderedSelected = selectedValues
    .map((value) => options.find((option) => isOptionEqualToValue(option, value)))
    .filter(Boolean);

  return [...orderedSelected, ...unselected];
};

export const filterOptionsBySearch = (options, search, selectedValues = []) => {
  const deduped = dedupeOptionsById(options);
  if (!search) {
    return sortSelectedOptionsFirst(deduped, selectedValues);
  }
  const query = search.toLowerCase();
  return deduped.filter((option) =>
    getOptionLabel(option).toLowerCase().includes(query),
  );
};

export const isClickInsideAutocomplete = (target, containerRef) => {
  if (containerRef.current?.contains(target)) {
    return true;
  }

  return Boolean(
    target.closest?.('.MuiAutocomplete-popper')
    || target.closest?.('[data-supply-chain-autocomplete-dropdown]'),
  );
};

// Shared styles for autocomplete text fields
export const AUTOCOMPLETE_TEXT_FIELD_STYLES = {
  height: 'auto',
  '& .MuiAutocomplete-tag': {
    backgroundColor: 'transparent !important',
    border: `1px solid ${lightPeriwinkle} !important`,
    color: `${clinkPurple} !important`,
  },
  '& .MuiInputBase-root': {
    minHeight: '40px',
    maxHeight: '120px',
    height: 'auto',
    overflowY: 'auto',
    borderRadius: '4px',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: `1px solid ${lightPeriwinkle} !important`,
  },
  '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
    border: `1px solid ${lightPeriwinkle} !important`,
  },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
    border: `1px solid ${clinkPurple} !important`,
  },
  '& .MuiInputBase-input': {
    display: 'none !important',
  },
};

export const DROPDOWN_PAPER_SX = {
  border: `1px solid ${lightPeriwinkle}`,
  borderRadius: '4px',
  boxShadow: 4,
  overflow: 'hidden',
};

// Shared popper configuration generator
export const getAutocompleteSlotProps = (placement = 'bottom-start') => ({
  popper: {
    placement,
    disablePortal: true,
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, 4],
        },
      },
      {
        name: 'preventOverflow',
        options: {
          padding: 8,
          boundary: 'clippingParents',
        },
      },
    ],
    sx: {
      zIndex: (theme) => theme.zIndex.modal + 1,
      width: '100% !important',
    },
  },
  listbox: {
    sx: {
      maxHeight: 240,
      p: 0,
      '& .MuiAutocomplete-option': {
        borderBottom: `1px solid ${lightPeriwinkle}`,
      },
    },
  },
});

// Shared option equality comparison
export const renderOptionWithCheckbox = (props, option, { selected }) => {
  const { key, ...otherProps } = props;
  return (
    <li
      key={key}
      {...otherProps}
      style={{
        ...otherProps.style,
        backgroundColor: selected ? striped : otherProps.style?.backgroundColor,
      }}
    >
      <Checkbox
        checked={selected}
        sx={{
          marginRight: 1,
          color: lightPeriwinkle,
          '&.Mui-checked': {
            color: clinkGreen,
          },
        }}
      />
      {getOptionLabel(option)}
    </li>
  );
};

export const renderAutocompleteTags = (value, getTagProps) =>
  value.map((option, index) => (
    <Chip
      {...getTagProps({ index })}
      key={getOptionId(option)}
      label={getOptionLabel(option)}
      size="small"
      sx={{
        backgroundColor: 'transparent',
        border: `1px solid ${lightPeriwinkle}`,
        color: clinkPurple,
      }}
    />
  ));

// Custom Paper component with search bar
export const DropdownPaper = ({ children, search, onSearchChange, searchInputRef, ...props }) => {
  React.useEffect(() => {
    const focusTimer = window.setTimeout(() => {
      searchInputRef?.current?.focus();
    }, 0);

    return () => window.clearTimeout(focusTimer);
  }, [searchInputRef]);

  return (
    <Paper
      {...props}
      data-supply-chain-autocomplete-dropdown
      sx={{ ...DROPDOWN_PAPER_SX, ...props.sx }}
    >
      <Box
        sx={{ p: 1, borderBottom: '1px solid', borderColor: lightPeriwinkle }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <TextField
          inputRef={searchInputRef}
          size="small"
          fullWidth
          autoFocus
          placeholder="Search..."
          value={search ?? ''}
          onChange={(e) => onSearchChange(e.target.value)}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start" sx={{ ml: 2, color: 'text.secondary' }}>
                  <Search />
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>
      <Box onMouseDown={(event) => event.preventDefault()}>
        {children}
      </Box>
    </Paper>
  );
};

// LIFO onChange handler generator
export const tagOrderingHandler = (currentValues, handleChange) => (event, newValue) => {
  // If a new item was added, put it at the beginning (LIFO)
  if (newValue.length > currentValues.length) {
    const newItem = newValue.find(item =>
      !currentValues.some(current => Number(getOptionId(current)) === Number(getOptionId(item)))
    );
    const reorderedValue = newItem
      ? [newItem, ...currentValues]
      : newValue;
    handleChange(SupplyChainHelper.selectOptionV2(reorderedValue));
  } else {
    // Item was removed, update normally
    handleChange(SupplyChainHelper.selectOptionV2(newValue));
  }
};
