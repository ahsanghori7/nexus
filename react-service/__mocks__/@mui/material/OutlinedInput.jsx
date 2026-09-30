import React from 'react';

const OutlinedInput = React.forwardRef(({ children, ...props }, ref) => (
  <textarea data-testid="outlined-input" ref={ref} {...props}>
    {children}
  </textarea>
));

OutlinedInput.displayName = 'OutlinedInput';

export default OutlinedInput;
