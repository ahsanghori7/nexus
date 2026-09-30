import React from 'react';

export default function InputLabel({ children, sx, error, ...props }) {
  return (
    <label {...props} style={sx}>
      {children}
    </label>
  );
}
