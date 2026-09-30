import React from 'react';

const FormHelperText = ({ children, ...props }) => (
  <div data-testid="form-helper-text" {...props}>
    {children}
  </div>
);

export default FormHelperText;
