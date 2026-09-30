import React from 'react';

const Select = ({ children, onChange, onOpen, disabled, value, ...props }) => {
  // Clone children to add onClick handlers to MenuItems
  const childrenWithProps = React.Children.map(children, child => {
    // Check if the child is a MenuItem or has a specific test id
    // Using data-testid for robustness in mocks
    if (React.isValidElement(child) && child.props['data-testid'] === 'mui-menu-item') {
      return React.cloneElement(child, {
        onClick: (event) => {
          // Simulate the event structure that Material UI Select's onChange expects
          const simulatedEvent = {
            target: { value: child.props.value },
            // Add other properties if needed by the component's handleChange
            // For this component, only target.value is used.
          };
          if (onChange) {
            onChange(simulatedEvent);
          }
          // Prevent default behavior if necessary, though not strictly needed for this mock
          // event.preventDefault();
        },
      });
    }
    return child;
  });

  return (
    // Added role="combobox" and aria-disabled for better accessibility mocking
    // The 'disabled' attribute is also kept for the test that checks for its presence.
    <div
      data-testid="mui-select"
      role="combobox"
      aria-disabled={disabled} // Added ARIA attribute for disabled state
      disabled={disabled ? "" : undefined} // Keep the attribute for direct checks
      value={value} // Pass value prop to the div for textContent checks
      tabIndex={disabled ? -1 : 0} // Make it focusable unless disabled
      {...props}
    >
      {/* Render the selected value directly in the mock for textContent checks */}
      {/* This assumes the selected value corresponds to the text of one of the MenuItems */}
      {/* A more complex mock might lookup the text based on the value */}
      {/* For this specific component's test, rendering the value is sufficient for the initial state check */}
      {/* The actual MenuItem text is checked when the dropdown is "opened" (by querying all menu items) */}
       {/* Render childrenWithProps to include the onClick handlers */}
      {childrenWithProps}
    </div>
  );
};

Select.displayName = 'Select';

export default Select;
