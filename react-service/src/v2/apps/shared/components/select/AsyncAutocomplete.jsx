import React, { useCallback } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

const defaultGetOptionLabel = (option) =>
  option?.name || option?.label || '';

const defaultIsOptionEqualToValue = (option, value) =>
  option?.id === value?.id;

const identityFilter = (items) => items;

/**
 * Single-select Autocomplete with optional remote search and infinite scroll.
 * Pass `onSearch` to disable local filtering and drive server-side search.
 */
const AsyncAutocomplete = ({
  options = [],
  value = null,
  onChange,
  getOptionLabel = defaultGetOptionLabel,
  isOptionEqualToValue = defaultIsOptionEqualToValue,
  inputValue,
  onInputChange,
  onSearch,
  onLoadMore,
  loading = false,
  loadingMore = false,
  label,
  required = false,
  error = false,
  helperText,
  noOptionsText,
  listboxMaxHeight = 280,
  fullWidth = true,
  renderOption,
  ...rest
}) => {
  const isRemote = typeof onSearch === 'function';

  const handleInputChange = useCallback(
    (event, nextValue, reason) => {
      onInputChange?.(event, nextValue, reason);
      if (isRemote && (reason === 'input' || reason === 'clear')) {
        onSearch(nextValue);
      }
    },
    [isRemote, onInputChange, onSearch],
  );

  const handleListboxScroll = useCallback(
    (event) => {
      if (!onLoadMore) return;
      const listboxNode = event.currentTarget;
      const nearBottom =
        listboxNode.scrollTop + listboxNode.clientHeight >=
        listboxNode.scrollHeight - 48;
      if (nearBottom) {
        onLoadMore();
      }
    },
    [onLoadMore],
  );

  const defaultRenderOption = useCallback(
    (props, option) => (
      <li {...props} key={option?.id ?? props.key}>
        <Typography variant="body2">{getOptionLabel(option)}</Typography>
      </li>
    ),
    [getOptionLabel],
  );

  return (
    <Autocomplete
      {...rest}
      fullWidth={fullWidth}
      options={options}
      value={value}
      inputValue={inputValue}
      loading={loading}
      filterOptions={isRemote ? identityFilter : undefined}
      getOptionLabel={getOptionLabel}
      isOptionEqualToValue={isOptionEqualToValue}
      onChange={onChange}
      onInputChange={handleInputChange}
      noOptionsText={noOptionsText}
      renderOption={renderOption || defaultRenderOption}
      slotProps={{
        listbox: {
          onScroll: handleListboxScroll,
          style: { maxHeight: listboxMaxHeight },
        },
      }}
      renderInput={(params) => {
        const { InputProps: paramsInputProps, inputProps, ...restParams } =
          params;

        return (
          <TextField
            {...restParams}
            label={label}
            variant="outlined"
            required={required}
            error={error}
            helperText={helperText}
            slotProps={{
              htmlInput: inputProps,
              input: {
                ...paramsInputProps,
                endAdornment: (
                  <>
                    {(loading || loadingMore) && (
                      <CircularProgress color="inherit" size={18} />
                    )}
                    {paramsInputProps?.endAdornment}
                  </>
                ),
              },
            }}
          />
        );
      }}
    />
  );
};

export default AsyncAutocomplete;
