import React from 'react';

const Autocomplete = React.forwardRef((props, ref) => {
  const {
    renderInput,
    onInputChange,
    options = [],
    value,
    ...rest
  } = props;

  // Create mock params for renderInput that match MUI structure
  const inputParams = {
    ...rest,
    InputProps: {
      ...rest.InputProps,
      onChange: (event) => {
        if (onInputChange) {
          onInputChange(event, event.target.value);
        }
      }
    },
    inputProps: {
      ...rest.inputProps,
      value: (value && value.label) || ''
    },
    value: (value && value.label) || '',
    onChange: (event) => {
      if (onInputChange) {
        onInputChange(event, event.target.value);
      }
    },
    ref
  };

  return (
    <div data-testid="autocomplete-container">
      {renderInput && renderInput(inputParams)}
    </div>
  );
});

Autocomplete.displayName = 'Autocomplete';

export default Autocomplete;
