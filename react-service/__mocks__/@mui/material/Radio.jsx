import React from 'react';

const Radio = ({ icon, checkedIcon, checked, onChange, ...props }) => {
  // If checked is provided without onChange, add readOnly to avoid React warning
  const inputProps = {
    type: "radio",
    "data-testid": "mock-radio",
    ...props
  };

  if (checked !== undefined) {
    inputProps.checked = checked;
  }

  if (onChange) {
    inputProps.onChange = onChange;
  } else if (checked !== undefined) {
    inputProps.readOnly = true;
  }

  return React.createElement('input', inputProps);
};

export default Radio;
