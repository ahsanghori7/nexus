import React, { useState } from 'react';
import PropTypes from 'prop-types';
import TextField from '@mui/material/TextField';

/**
 * ClinkInput Component
 *
 * @param {string} value - Initial value of the input
 * @param {function} focus - Callback triggered on focus
 * @param {function} change - Callback triggered on change, receives (newValue, oldValue)
 * @param {function} validate - Function to validate input value, should return a boolean
 * @param {function} parser - Function to transform input value
 * @param {function} keydown - Callback triggered on key down event
 * @param {function} blur - Callback triggered on blur event
 * @param {function} renderer - Function to render the value before displaying it
 * @param {string} defaultValue - Default value when input is empty and unfocused
 * @param {string} name - Name attribute of the input field
 * @param {string} type - Input type (e.g., 'text', 'number', 'password')
 * @param {string} className - Custom class name for styling
 * @param {boolean} disabled - Whether the input is disabled
 */
const ClinkInputV2 = ({
  value: initialValue = '',
  focus,
  change,
  validate,
  parser,
  keydown,
  blur,
  renderer,
  defaultValue,
  name,
  label,
  type = 'text',
  className,
  disabled = false,
}) => {
  // Convert initialValue to string if it's a number or other type
  const [value, setValue] = useState(
    initialValue !== null && initialValue !== undefined
      ? String(initialValue)
      : ''
  );
  const [focused, setFocused] = useState(false);

  const handleOnFocus = () => {
    setFocused(true);
    if (focus) focus();
  };

  const handleOnChange = (e) => {
    let newValue = e.target.value;

    // Validate the input value
    if (validate && !validate(newValue)) return;

    // Parse the input value if parser is provided
    if (parser) newValue = parser(newValue);

    // Call the change callback if provided
    if (change) change(newValue, value);

    // Always store value as string internally
    setValue(String(newValue));
  };

  const handleKeyDown = (e) => {
    if (keydown) keydown(e);
  };

  const handleOnBlur = () => {
    setFocused(false);
    if (blur) blur();
  };

  // Determine the displayed value without nested ternaries
  const getDisplayedValue = () => {
    // Case 1: Show default value when not focused and no value
    if (!focused && !value && defaultValue) {
      return defaultValue;
    }

    // Case 2: Use renderer when provided
    if (renderer) {
      return renderer(value, { state: { focused }, setFocused });
    }

    // Case 3: Default - show the value as is
    return value;
  };

  return (
    <TextField
      name={name}
      label={label}
      type={type}
      className={className}
      onFocus={handleOnFocus}
      onChange={handleOnChange}
      onKeyDown={handleKeyDown}
      onBlur={handleOnBlur}
      value={getDisplayedValue()}
      disabled={disabled}
      variant="outlined"
      fullWidth
    />
  );
};

ClinkInputV2.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  focus: PropTypes.func,
  change: PropTypes.func,
  validate: PropTypes.func,
  parser: PropTypes.func,
  keydown: PropTypes.func,
  blur: PropTypes.func,
  renderer: PropTypes.func,
  defaultValue: PropTypes.string,
  label: PropTypes.string,
  name: PropTypes.string,
  type: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

export default ClinkInputV2;
