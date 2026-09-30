import React from 'react';

const toCamelCase = (key) =>
  key.replace(/-([a-z])/g, (_, char) => char.toUpperCase());

const extractInlineStyles = (sx, style) => {
  const styles = { ...(typeof style === 'object' ? style : {}) };

  if (!sx) {
    return styles;
  }

  const applyEntries = (entry) => {
    if (!entry || typeof entry !== 'object') {
      return;
    }

    Object.entries(entry).forEach(([key, value]) => {
      if (typeof value === 'object' || key.startsWith('&') || key.startsWith('@')) {
        return;
      }

      styles[toCamelCase(key)] = value;
    });
  };

  if (Array.isArray(sx)) {
    sx.forEach(applyEntries);
  } else {
    applyEntries(sx);
  }

  return styles;
};

const Tab = React.forwardRef(({ label, sx, style, ...props }, ref) => (
  <div
    data-testid="tab"
    data-label={label}
    style={extractInlineStyles(sx, style)}
    ref={ref}
    {...props}
  >
    {label}
  </div>
));

Tab.displayName = 'Tab';

export default Tab;
