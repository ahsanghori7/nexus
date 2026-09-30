// Mock for v2/apps/admin/ActionsDropdown
import React from 'react';

const mockActionsDropdown = ({ content = [] }) => (
  React.createElement('div', {
    'data-testid': 'mock-actions-dropdown',
    'data-content-length': Array.isArray(content) ? content.length.toString() : '0'
  }, [
    React.createElement('span', { key: 'actions-dropdown-label' }, 'Actions Dropdown'),
    ...content.map((child, index) => {
      if (React.isValidElement(child)) {
        // If the child already has a key, use it, otherwise generate one
        const key = child.key || `content-${index}`;
        return React.cloneElement(child, { key });
      } else if (child === null || child === undefined) {
        // Skip null/undefined children
        return null;
      } else {
        // Wrap non-React elements
        return React.createElement('div', { key: `content-${index}` }, child);
      }
    }).filter(Boolean) // Remove null/undefined elements
  ])
);

export default mockActionsDropdown;
