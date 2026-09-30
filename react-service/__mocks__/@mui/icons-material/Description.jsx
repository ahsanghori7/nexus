// __mocks__/@mui/icons-material/Description.jsx
import * as React from 'react';

const Description = React.forwardRef((props, ref) => {
  return React.createElement('div', {
    'data-testid': 'description-icon',
    ...props,
    ref,
  });
});

export default Description;
