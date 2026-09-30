import React from 'react';

// Mock for v2/apps/prosper/shared/crm-components/Item
const Item = ({ icon, type, value, url, loading, mt, gridSx, ...props }) => {
  if (loading) {
    return <div data-testid={`item-loading-${type}`}>Loading...</div>;
  }

  return (
    <div
      data-testid={`item-${type}`}
      data-value={value}
      data-url={url}
      {...props}
    >
      {icon && <img src={icon} alt={`${type}-icon`} />}
      {url ? (
        <a href={value} target="_blank" rel="noopener noreferrer">
          {value}
        </a>
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
};

export default Item;
