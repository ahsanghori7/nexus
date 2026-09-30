// __mocks__/@mui/material/Fade.jsx
import * as React from 'react';

const Fade = React.forwardRef((props, ref) => {
  const { in: inProp, children, ...other } = props;

  // Simple mock that shows/hides children based on 'in' prop
  if (!inProp) {
    return null;
  }

  return (
    <div ref={ref} {...other}>
      {children}
    </div>
  );
});

Fade.displayName = 'Fade';

export default Fade;
