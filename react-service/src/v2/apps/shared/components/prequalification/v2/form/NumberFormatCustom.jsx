import React from 'react';
import { NumericFormat } from 'react-number-format';

export const NumberFormatCustom = React.forwardRef((props, ref) => {
  const { inputRef, onChange, value, ...other } = props;

  return (
    <NumericFormat
      {...other}
      getInputRef={inputRef ?? ref}
      onValueChange={(values) => {
        onChange({
          target: {
            value: values.value,
          },
        });
      }}
      valueIsNumericString
      decimalScale={2}
      allowNegative={false}
      thousandSeparator
      fixedDecimalScale
      value={value}
    />
  );
});
