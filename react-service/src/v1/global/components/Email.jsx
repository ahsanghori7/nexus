import React from 'react';

const Email = ({ children }) => (
  <u>
    <a href={`mailto:${children}`}>{children}</a>
  </u>
);

export default Email;
