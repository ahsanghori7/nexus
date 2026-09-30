// __mocks__/@mui/material/TextField.js
import * as React from 'react';

const TextField = React.forwardRef((props, ref) => {
  const {
    label,
    placeholder,
    helperText,
    error,
    required,
    children,
    InputProps,
    slotProps,
    ...rest
  } = props;

  // Create a deterministic ID based on component props
  const labelKey = label?.replace(/\s+/g, '-').toLowerCase() || 'input';
  const nameKey = rest.name || 'default';
  const id = `textfield-${labelKey}-${nameKey}`;

  // Prefer MUI v6 slotProps.input; fall back to deprecated InputProps
  const resolvedInputProps = {
    ...InputProps,
    ...slotProps?.input,
  };

  // Extract adornments from InputProps / slotProps.input
  const startAdornment = resolvedInputProps?.startAdornment;
  const endAdornment = resolvedInputProps?.endAdornment;
  const inputComponent = resolvedInputProps?.inputComponent;
  const inputProps =
    slotProps?.htmlInput || resolvedInputProps?.inputProps || {};
  const { readOnly, disabled: inputDisabled } = resolvedInputProps;

  // Determine which component to render for input
  const InputComponent = inputComponent || 'input';
  const isCustomComponent = !!inputComponent;

  const sharedInputProps = {
    id,
    placeholder,
    value: props.value,
    onChange: props.onChange || (() => {}),
    'aria-describedby': helperText ? `${id}-helper-text` : undefined,
    required,
    ref,
    readOnly: readOnly || undefined,
    disabled: inputDisabled || props.disabled || undefined,
    ...inputProps,
  };
  return (
    <div
      className={`MuiTextField-root ${error ? 'Mui-error' : ''}`}
      data-testid="textfield"
      inputprops={
        InputProps || slotProps?.input ? '[object Object]' : undefined
      }
      helpertext={helperText || undefined}
      type={props.type || undefined}
    >
      {label && (
        <label htmlFor={id} className="MuiInputLabel-root">
          {label}
          {required && ' *'}
        </label>
      )}
      {/* Render children if present (for unconventional usage like the Text component) */}
      {children && <div data-testid="textfield-children">{children}</div>}

      <div className="MuiInputBase-root">
        {/* Render start adornment */}
        {startAdornment && (
          <div className="MuiInputAdornment-root MuiInputAdornment-positionStart">
            {startAdornment}
          </div>
        )}

        {/* Render the input component */}
        {isCustomComponent ? (
          <InputComponent
            {...sharedInputProps}
            {...Object.keys(rest).reduce((acc, key) => {
              // Filter out non-standard DOM props that shouldn't be passed to HTML input elements
              if (!['onOpen', 'onClose', 'renderInput', 'getOptionLabel', 'freeSolo', 'autoComplete', 'autoHighlight'].includes(key) &&
                  (!key.startsWith('on') || ['onClick', 'onChange', 'onSubmit', 'onFocus', 'onBlur', 'onKeyDown', 'onKeyUp', 'onKeyPress'].includes(key))) {
                acc[key] = rest[key];
              }
              return acc;
            }, {})}
          />
        ) : (
          <input
            type={props.type || 'text'}
            placeholder={placeholder}
            value={props.value}
            onChange={props.onChange || (() => {})}
            aria-describedby={helperText ? `${id}-helper-text` : undefined}
            required={required}
            ref={ref}
            {...(slotProps ? { slotprops: 'true' } : {})}
            {...sharedInputProps}
            {...Object.keys(rest).reduce((acc, key) => {
              // Filter out non-standard DOM props that shouldn't be passed to HTML input elements
              if (!['onOpen', 'onClose', 'renderInput', 'getOptionLabel', 'freeSolo', 'autoComplete', 'autoHighlight'].includes(key) &&
                  (!key.startsWith('on') || ['onClick', 'onChange', 'onSubmit', 'onFocus', 'onBlur', 'onKeyDown', 'onKeyUp', 'onKeyPress'].includes(key))) {
                acc[key] = rest[key];
              }
              return acc;
            }, {})}
          />
        )}

        {/* Render end adornment */}
        {endAdornment && (
          <div className="MuiInputAdornment-root MuiInputAdornment-positionEnd">
            {endAdornment}
          </div>
        )}
      </div>

      {helperText && (
        <p
          id={`${id}-helper-text`}
          className={`MuiFormHelperText-root ${error ? 'Mui-error' : ''}`}
        >
          {helperText}
        </p>
      )}
    </div>
  );
});

TextField.displayName = 'TextField';
module.exports = TextField;
