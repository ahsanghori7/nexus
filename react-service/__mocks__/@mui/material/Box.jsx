// __mocks__/@mui/material/Box.js
import * as React from 'react';

const toCamelCase = (key) =>
  key.replace(/-([a-z])/g, (_, char) => char.toUpperCase());

const extractInlineStyles = (sx) => {
  const styles = {};
  const applyEntries = (entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    Object.entries(entry).forEach(([key, value]) => {
      if (
        typeof value === 'object' ||
        key.startsWith('@') ||
        key.startsWith('&')
      ) {
        return;
      }

      const normalizedKey = toCamelCase(key);
      styles[normalizedKey] = value;
    });
  };

  if (Array.isArray(sx)) {
    sx.forEach(applyEntries);
  } else {
    applyEntries(sx);
  }

  return styles;
};

const Box = React.forwardRef(({ sx, style, children, ...domProps }, ref) => {
  const inlineStyles = {
    ...(typeof style === 'object' ? style : {}),
    ...extractInlineStyles(sx),
  };

  return React.createElement('div', {
    className: 'MuiBox-root',
    'data-testid': 'mui-box',
    style: inlineStyles,
    ...domProps,
    ref,
  }, children);
});

Box.displayName = 'Box';
module.exports = Box;
