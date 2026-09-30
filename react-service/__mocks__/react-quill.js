import React, { forwardRef } from 'react';

// Use forwardRef to properly handle refs
const ReactQuill = forwardRef(({ children, ...props }, ref) => {
  return (
    <div
      data-testid="mock-react-quill"
      role="textbox"
      aria-multiline="true"
      ref={ref}
      {...props}
    >
      {children}
    </div>
  );
});

// Mock the static properties and methods
ReactQuill.Quill = require('./quill.js');
ReactQuill.displayName = 'ReactQuill';

ReactQuill.defaultProps = {
  theme: 'snow',
  modules: {},
  formats: []
};

module.exports = ReactQuill;
