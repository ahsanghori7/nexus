import React from 'react';
import { forwardRef } from 'react';

const Text = forwardRef(({
  label,
  name,
  register = jest.fn(),
  errors = {},
  sx = {},
  ...props
}, ref) => {
  const hasError = errors[name];

  return (
    <div data-testid={`text-input-${name}`} style={sx}>
      <label htmlFor={name}>{label}</label>
      <input
        ref={ref}
        id={name}
        name={name}
        type="text"
        {...register(name)}
        aria-invalid={hasError ? 'true' : 'false'}
        {...props}
      />
      {hasError && (
        <span data-testid={`${name}-error`} style={{ color: 'red' }}>
          {hasError.message}
        </span>
      )}
    </div>
  );
});

Text.displayName = 'MockText';

export default Text;
