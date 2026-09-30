import React from 'react';

const FormControl = React.forwardRef(({ children, sx, ...props }, ref) => (
  <div data-testid="formcontrol" sx={sx} ref={ref} {...props}>
    {children}
  </div>
));

FormControl.displayName = 'FormControl';

export default FormControl;
