import React from 'react';

const FormControlLabel = ({ control, label, value, onChange, ...props }) => {
  // Clone the control element and add the value and onChange handler
  const controlWithProps = React.cloneElement(control, {
    ...control.props,
    value: value !== undefined ? value : control.props.value,
    onChange: (e) => {
      // Create a synthetic event with the FormControlLabel's value
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: value || e.target.value || ''
        }
      };

      // Call the original control's onChange if it exists
      if (control.props.onChange) {
        control.props.onChange(syntheticEvent);
      }

      // Call the FormControlLabel's onChange if it exists
      if (onChange) {
        onChange(syntheticEvent);
      }
    }
  });

  return (
    <label data-testid="mui-form-control-label" {...props}>
      {controlWithProps}
      {label && <span>{label}</span>}
    </label>
  );
};

export default FormControlLabel;
