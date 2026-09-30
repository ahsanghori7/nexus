import React, { useState, useRef } from 'react';
import { CONSTANTS } from 'clink-components';
import FormControl from 'react-bootstrap/FormControl';
import isNil from 'lodash/isNil';
import { Field } from 'formik';
import pennyToCurrency from 'v2/helpers/currency/v1';
import FieldError from '../../FieldError';
import FieldLabel from '../../FieldLabel';
import FieldHolder from '../../FieldHolder';
import { NumericFormat } from 'react-number-format';

const { heatWave } = CONSTANTS.colors.general;

const Index = ({
  name,
  error,
  className = '',
  type,
  label = null,
  description = null,
  handleChange = null,
  handleBlur = null,
  handleFocus = null,
  handleClick = null,
  callback = null,
  validationFieldSchema = {},
  children,
  placeholder,
  required = false,
  value = null,
  setValidation = null,
  info = null,
  customErrors = {},
  triggerCustomErrors = false,
  labelError = false,
  highlight = false,
  missingRef = null,
  justNumber = false,
  testId = undefined,
  disabled = false,
}) => {
  const highlightProp = highlight
    ? {
        style: {
          border: `1px solid ${heatWave}`,
        },
      }
    : {};
  const validation = isNil(setValidation)
    ? validationFieldSchema[name]
    : setValidation;

  const [edit, setEdit] = useState(false);
  const moneyEl = useRef(null);
  const textEl = useRef(null);
  const pennyValueRef = useRef(0);
  // Before using the blur func, we show the text input
  const customHandleBlur = (blurCallback = () => null) => {
    setEdit(false);
    blurCallback();
  };
  const moneyValue = justNumber ? value : pennyToCurrency(value);
  return (
    <Field name={name} type={type} validate={validation}>
      {({ field, form }) => {
        const { value: fieldValue, ...rest } = field;
        const input = {
          ...rest,
          ref: textEl,
          type: 'number',
          min: '0',
          step: 'any',
          placeholder,
          info,
          value: isNil(value) ? fieldValue : value,
          onChange: handleChange || field.onChange,
          onBlur: (e) => {
            const blurFunc = handleBlur || field.onBlur;
            customHandleBlur(() => blurFunc(e));
          },
          onMouseDown: (e) => {
            e.preventDefault();
          },
          onFocus: handleFocus || field.onFocus,
          onClick: handleClick || field.onClick,
          className: `money-input ${!edit && 'hidden'}`,
        };
        const moneyInput = {
          ...input,
          ref: moneyEl,
          placeholder,
          value: moneyValue,
          type: 'text',
          ...highlightProp,
          onBlur: () => {
            customHandleBlur();
          },
          onFocus: handleFocus || field.onFocus,
          onClick: () => {
            textEl.current.focus();
            setEdit(true);
          },
          className: `money-display ${edit && 'hidden'}`,
        };

        const newClassName =
          error && labelError ? `${className} field-holder__error` : className;
        return (
          <FieldHolder className={`${newClassName} money-field`} data-testid={testId}>
            {label && (
              <FieldLabel
                name={field.name}
                triggerCustomErrors={triggerCustomErrors}
                labelError={labelError}
                customErrors={customErrors}
                label={label}
                info={info}
                required={required}
              >
                {children}
              </FieldLabel>
            )}
            {label && description}
            <div
              className="money-field--inputs"
              ref={(el) => {
                if (missingRef) {
                  missingRef.input = el;
                }
                return true;
              }}
            >
              <NumericFormat
                value={(field.value || 0) / 100}
                customInput={FormControl}
                thousandSeparator=","
                decimalSeparator="."
                prefix="£"
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                disabled={disabled}
                onValueChange={(values) => {
                  const pennyValue = Math.round((values.floatValue || 0) * 100);
                  pennyValueRef.current = pennyValue;
                  form.setFieldValue(field.name, pennyValue);
                }}
                onFocus={handleFocus || field.onFocus}
                onBlur={() => {
                  input.onBlur({ target: { value: pennyValueRef.current } });
                }}
              />
            </div>
            {!labelError && (
              <FieldError
                customErrors={customErrors}
                name={name}
                triggerCustomErrors={triggerCustomErrors}
              />
            )}
          </FieldHolder>
        );
      }}
    </Field>
  );
};

export default Index;
