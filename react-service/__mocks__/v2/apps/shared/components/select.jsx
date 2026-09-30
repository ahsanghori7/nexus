// Mock for v2/apps/shared/components/select (SelectDialog)
import React from 'react';

const SelectDialog = ({
  title,
  options = [],
  setter,
  hasCookie,
  name,
  placeholder,
  initialOption,
  context,
  ...props
}) => {
  const handleChange = (selectedOptions) => {
    if (setter) {
      setter(selectedOptions);
    }
  };

  const handleClick = () => {
    // Simulate selecting the first two options when clicked
    const mockSelectedOptions = options.slice(0, 2);
    handleChange(mockSelectedOptions);
  };

  return (
    <div
      data-testid={`select-dialog-${name}`}
      data-title={title}
      data-placeholder={placeholder}
      data-context={context}
      data-has-cookie={hasCookie}
      onClick={handleClick}
      {...props}
    >
      <div data-testid="select-dialog-title">{title}</div>
      <div data-testid="select-dialog-placeholder">{placeholder}</div>
      <div data-testid="select-dialog-options">
        {options.map((option, index) => (
          <div key={option.id || index} data-testid={`option-${option.id || index}`}>
            {option.name || option.label || option.title}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectDialog;
