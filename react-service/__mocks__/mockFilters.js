import React from 'react';

const MockFilters = ({ filterTitle, children }) => (
  <div data-testid="filters-component">
    <div data-testid="filter-title">{filterTitle}</div>
    <div data-testid="filters-children">{children}</div>
  </div>
);

export default MockFilters;
