// __mocks__/@mui/material/InputBase.jsx
import * as React from 'react';

const InputBase = React.forwardRef((props, ref) => {
  return React.createElement('input', {
    className: 'MuiInputBase-root',
    'data-testid': 'input-base',
    ...props,
    ref,
  });
});

InputBase.displayName = 'InputBase';

export default InputBase;
