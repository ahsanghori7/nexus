import React from 'react';

const Link = ({ children, href, sx, className, component, ...props }) => (
  <a href={href} className={className} style={sx} {...props}>
    {children}
  </a>
);

export default Link;
