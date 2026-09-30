import React from 'react';

export const NumericFormat = React.forwardRef((props, ref) => {
  const {
    value,
    onValueChange,
    onChange,
    onBlur,
    getInputRef,
    thousandSeparator,
    decimalScale,
    allowNegative,
    fixedDecimalScale,
    valueIsNumericString,
    ...other
  } = props;

  const handleChange = (e) => {
    if (onValueChange) {
      onValueChange({
        value: e.target.value,
        formattedValue: e.target.value,
        floatValue: parseFloat(e.target.value) || 0
      });
    }
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <input
      {...other}
      ref={getInputRef || ref}
      data-testid="number-format-custom"
      value={value || ''}
      onChange={handleChange}
      onBlur={onBlur}
      type="text"
    />
  );
});

export default NumericFormat;
