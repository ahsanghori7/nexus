import React from 'react';
import { Form } from 'react-bootstrap';
import isNil from 'lodash/isNil';
import { Field } from 'formik';
import { CONSTANTS } from 'clink-components';
import RadioInput from './radio-input';
import InputFile from './InputFile';
import FieldError from '../FieldError';
import FieldLabel from '../FieldLabel';
import FieldHolder from '../FieldHolder';
import Checkbox from './Checkbox';

const { heatWave } = CONSTANTS.colors.general;

const IconWrapper = ({ children }) => (
  <div className="icon-input-wrapper">{children}</div>
);

const InputField = ({
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
  options,
  placeholder,
  required = false,
  resize = false,
  rows,
  accept,
  multiple = false,
  setFieldValue,
  value = null,
  setValidation = null,
  cdn = null,
  toggleButton = true,
  info = null,
  tooltip = null,
  tooltipInfo = null,
  checkboxHidden = false,
  customErrors = {},
  triggerCustomErrors = false,
  labelError = false,
  readOnly = false,
  inputIcon = null,
  highlight = false,
  missingRef = null,
  testId = undefined,
}) => {
  const validation = isNil(setValidation)
    ? validationFieldSchema[name]
    : setValidation;

  const highlightProp = highlight
    ? {
        style: {
          border: `1px solid ${heatWave}`,
        },
      }
    : {};

  return (
    <Field name={name} type={type} validate={validation}>
      {({ field }) => {
        const { value: fieldValue, ...rest } = field;
        const input = {
          ...rest,
          type,
          placeholder,
          info,
          readOnly,
          value: isNil(value) ? fieldValue : value,
          onChange: handleChange || field.onChange,
          onBlur: handleBlur || field.onBlur,
          onFocus: handleFocus || field.onFocus,
          onClick: handleClick || field.onClick,
        };
        let formControl = (
          <Form.Control
            {...input}
            data-testid={testId}
            onChange={(event) => {
              input.onChange(event);
              if (callback) {
                callback({ val: event.target.value, fieldName: name });
              }
            }}
            {...highlightProp}
            ref={(el) => {
              if (missingRef) {
                missingRef.input = el;
              }
              return true;
            }}
          />
        );
        if (type === 'reference') {
          formControl = (
            <input
              name={name}
              type="button"
              onClick={handleClick}
              value={value}
              className="form-control"
            />
          );
        }
        if (type === 'radio') {
          formControl = (
            <RadioInput
              options={options}
              field={field}
              setFieldValue={setFieldValue}
              value={value}
              handleChange={handleChange}
              toggleButton={toggleButton}
            />
          );
        }
        if (type === 'checkbox') {
          formControl = (
            <Checkbox
              options={options}
              field={field}
              setFieldValue={setFieldValue}
              value={value}
              handleChange={handleChange}
              toggleButton={toggleButton}
              tooltip={tooltip}
              tooltipInfo={tooltipInfo}
              checkboxHidden={checkboxHidden}
              callback={callback}
            />
          );
        }
        if (type === 'textarea') {
          formControl = (
            <Form.Control
              as={type}
              {...input}
              onChange={(event) => {
                setFieldValue(input.name, event.target.value);
              }}
              className={resize ? '' : 'no-resize'}
              placeholder={placeholder}
              rows={rows}
              {...highlightProp}
              ref={(el) => {
                if (missingRef) {
                  missingRef.input = el;
                }
                return true;
              }}
            />
          );
        }
        if (type === 'file') {
          formControl = (
            <InputFile
              name={name}
              input={input}
              accept={accept}
              multiple={multiple}
              setFieldValue={setFieldValue}
              cdn={cdn}
            />
          );
        }
        if (type === 'hidden') {
          formControl = <input {...input} data-testid={testId} />;
        }

        const newClassName =
          error && labelError ? `${className} field-holder__error` : className;
        return type === 'hidden' ? (
          formControl
        ) : (
          <FieldHolder className={newClassName} data-testid={testId}>
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
            <IconWrapper>
              {formControl}
              {inputIcon}
            </IconWrapper>
            {description && <div className="field-description">{description}</div>}
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

export default InputField;
