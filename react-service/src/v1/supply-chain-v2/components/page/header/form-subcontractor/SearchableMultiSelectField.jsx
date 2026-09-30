import React, { useRef, useCallback } from 'react';
import AutocompleteMui from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import FieldHolder from './FieldHolder';
import useSearchableMultiSelect from './useSearchableMultiSelect';
import {
  AUTOCOMPLETE_TEXT_FIELD_STYLES,
  getAutocompleteSlotProps,
  getOptionLabel,
  isOptionEqualToValue,
  renderOptionWithCheckbox,
  renderAutocompleteTags,
  DropdownPaper,
} from './autocomplete-shared';

const SearchableMultiSelectField = ({
  label,
  name,
  error,
  options,
  value,
  onChange,
}) => {
  const {
    open,
    setOpen,
    search,
    setSearch,
    searchRef,
    containerRef,
    close,
    filteredOptions,
    handleChange,
  } = useSearchableMultiSelect({ options, value, onChange });

  const listboxRef = useRef(null);
  const scrollPositionRef = useRef(0);

  const handleListboxScroll = useCallback((event) => {
    scrollPositionRef.current = event.currentTarget.scrollTop;
  }, []);

  const handleSelectionChange = useCallback((event, newValue, reason, details) => {
    handleChange(event, newValue, reason, details);
    requestAnimationFrame(() => {
      if (listboxRef.current) {
        listboxRef.current.scrollTop = scrollPositionRef.current;
      }
    });
  }, [handleChange]);

  const autocompleteSlotProps = getAutocompleteSlotProps();

  return (
    <FieldHolder label={label} name={name} error={error}>
      <div ref={containerRef} style={{ position: 'relative' }}>
        <AutocompleteMui
          open={open}
          onOpen={() => setOpen(true)}
          onClose={(_, reason) => {
            if (reason !== 'blur') {
              close();
            }
          }}
          multiple
          disableCloseOnSelect
          value={value}
          options={filteredOptions}
          getOptionLabel={getOptionLabel}
          filterOptions={(items) => items}
          isOptionEqualToValue={isOptionEqualToValue}
          onChange={handleSelectionChange}
          slots={{ paper: DropdownPaper }}
          slotProps={{
            ...autocompleteSlotProps,
            listbox: {
              ...autocompleteSlotProps.listbox,
              ref: listboxRef,
              onScroll: handleListboxScroll,
            },
            paper: {
              search,
              onSearchChange: setSearch,
              searchInputRef: searchRef,
            },
          }}
          renderTags={renderAutocompleteTags}
          renderOption={renderOptionWithCheckbox}
          renderInput={(params) => (
            <TextField
              {...params}
              sx={AUTOCOMPLETE_TEXT_FIELD_STYLES}
              slotProps={{
                htmlInput: {
                  ...params.inputProps,
                  readOnly: true,
                },
              }}
            />
          )}
        />
      </div>
    </FieldHolder>
  );
};

export default SearchableMultiSelectField;
