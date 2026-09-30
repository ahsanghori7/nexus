import React from 'react';
import { forwardRef } from 'react';

const Number = forwardRef(({
  label,
  name,
  register = jest.fn(),
  errors = {},
  sx = {},
  ...props
}, ref) => {
  const hasError = errors[name];

  return (
    <div data-testid={`number-input-${name}`} style={sx}>
      <label htmlFor={name}>{label}</label>
      <input
        ref={ref}
        id={name}
        name={name}
        type="number"
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

Number.displayName = 'MockNumber';

export default Number;
