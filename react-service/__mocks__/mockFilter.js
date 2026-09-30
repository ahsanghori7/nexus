import React from 'react';

// Mock for Filter component and its related exports
export const Filter = React.forwardRef(({ label, content, dropdownContentWidth, yOffset, xOffset, ...props }, ref) => (
  <div ref={ref} data-testid="filter-component" {...props}>
    <div data-testid="filter-label">{label}</div>
    <div data-testid="filter-content" style={{ width: dropdownContentWidth }}>
      {content}
    </div>
  </div>
));

export const FilterContent = ({ selected, options, handleClick }) => (
  <div data-testid="filter-content-inner">
    {options?.map((option, index) => (
      <div
        key={option.id || index}
        data-testid={`filter-option-${index}`}
        onClick={() => handleClick(option)}
        style={{
          backgroundColor: selected?.id === option.id ? '#e0e0e0' : 'transparent'
        }}
      >
        {option.label || option.status || option.name}
      </div>
    ))}
  </div>
);

export default Filter;
