import React from 'react';

const FormLabel = React.forwardRef(({ children, sx, ...props }, ref) => (
  <label data-testid="formlabel" sx={sx} ref={ref} {...props}>
    {children}
  </label>
));

FormLabel.displayName = 'FormLabel';

export default FormLabel;
