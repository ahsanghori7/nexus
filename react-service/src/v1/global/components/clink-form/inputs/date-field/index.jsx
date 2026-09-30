import React, { useState } from 'react';
import { CONSTANTS } from 'clink-components';
import isNil from 'lodash/isNil';
import { Field } from 'formik';
import FieldError from '../../FieldError';
import FieldHolder from '../../FieldHolder';
import FieldLabel from '../../FieldLabel';
import Datepicker from './Datepicker';

const { heatWave } = CONSTANTS.colors.general;

const DateField = ({
  name,
  error,
  className = '',
  callback = null,
  handleChange = null,
  type,
  label = null,
  handleBlur = null,
  handleFocus = null,
  validationFieldSchema = {},
  children,
  placeholder,
  required = false,
  setValidation = null,
  minDate = null,
  maxDate = null,
  dateFormat = 'dd-MM-yyyy',
  customErrors = {},
  triggerCustomErrors = false,
  labelError = false,
  value: valueProps,
  recommended = false,
  notCloseOnClickOutside = false,
  FormModal = null,
  Aux = null,
  isClearable = false,
  portalId = null,
  CustomContent = null,
  message = '',
  highlight = false,
  testId = undefined,
}) => {
  const highlightProp = highlight
    ? {
        style: {
          border: `1px solid ${heatWave}`,
        },
      }
    : {};
  const [hasError, setHasError] = useState(false);
  const validation = isNil(setValidation)
    ? validationFieldSchema[name]
    : setValidation;
  const newClassName =
    (error || hasError) && labelError
      ? `${className} field-holder__error`
      : className;
  return (
    <Field name={name} type={type} validate={validation}>
      {({ field }) => {
        const { value, ...rest } = field;
        const inputValue = isNil(valueProps) ? value : valueProps;
        const input = {
          ...rest,
          type,
          placeholder,
          onBlur: handleBlur || field.onBlur,
          onFocus: handleFocus || field.onFocus,
        };
        return (
          <FieldHolder className={newClassName} data-testid={testId}>
            <FieldLabel
              name={field.name}
              triggerCustomErrors={triggerCustomErrors}
              labelError={labelError}
              customErrors={customErrors}
              label={label}
              className={labelError && 'clink-form__label-error'}
              setHasError={setHasError}
              required={required}
              recommended={recommended}
            >
              {children}
            </FieldLabel>
            <Datepicker
              dateFormat={dateFormat}
              field={field}
              input={input}
              handleChange={handleChange}
              handleFocus={handleFocus}
              callback={callback}
              minDate={minDate}
              maxDate={maxDate}
              value={inputValue}
              setHasError={setHasError}
              recommended={recommended}
              FormModal={FormModal}
              notCloseOnClickOutside={notCloseOnClickOutside}
              Aux={Aux}
              isClearable={isClearable}
              portalId={portalId}
              CustomContent={CustomContent}
              message={message}
              highlightProp={highlightProp}
            />
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

export default DateField;
