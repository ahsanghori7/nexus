// Mock for v2/apps/clink/pages/login/mui.styled components
import React from 'react';

export const MuiFormField = ({ children, type = 'text', value = '', onChange, name, ...props }) => (
  <div data-testid="mui-form-field" {...props}>
    <input
      type={type}
      value={value}
      onChange={onChange}
      name={name}
      data-testid="mui-form-field-input"
    />
    {children}
  </div>
);

export const MuiLoginWrapper = ({ children, ...props }) => (
  <div data-testid="mui-login-wrapper" {...props}>
    {children}
  </div>
);

export const MuiTitle = ({ children, ...props }) => (
  <div data-testid="mui-title" {...props}>
    {children}
  </div>
);

export const MuiClinkImage = ({ src, alt, ...props }) => (
  <img data-testid="mui-clink-image" src={src} alt={alt} {...props} />
);

export const MuiLink = ({ children, onClick, ...props }) => (
  <a data-testid="mui-link" onClick={onClick} {...props}>
    {children}
  </a>
);
