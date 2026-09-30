import React, { useState } from 'react';
import { CONSTANTS } from 'clink-components';
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';
import { Field } from 'formik';
import Select from 'react-select';
import InfoIcon from '@mui/icons-material/Info';
import Person from '@mui/icons-material/Person';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Link from '@mui/material/Link';
import FieldError from '../../FieldError';
import FieldHolder from '../../FieldHolder';
import { defaultStyles, ExtractedOptions } from './assets';
import FieldLabel from '../../FieldLabel';

const { heatWave } = CONSTANTS.colors.general;

const SelectField = ({
  name,
  className = '',
  value,
  error,
  options,
  isMulti = false,
  label = null,
  handleChange = null,
  handleBlur = null,
  handleFocus = null,
  callback = null,
  callbackOptions = null,
  validationFieldSchema = {},
  styles = defaultStyles,
  components = {},
  extractedOptions = false,
  CustomExtracted = null,
  children,
  placeholder,
  required = false,
  setValidation = null,
  innerIcon = null,
  customErrors = {},
  triggerCustomErrors = false,
  labelError = false,
  autoSelectUniqueOption = false,
  isDisabled = false,
  isLoading = false,
  handleEnter = false,
  optionIsDisable = false,
  tooltipLabel = null,
  goToBoq = null,
  highlight = false,
  missingRef = null,
  noOptionsMessage = () => 'No Options',
  loadingMessage = () => 'Loading...',
  selectedOptionTooltip = false,
  menuPortalTarget = null,
  testId = undefined,
}) => {
  const highlightProp = {
    control: (baseStyles) =>
      highlight
        ? { ...baseStyles, border: `1px solid ${heatWave} !important` }
        : baseStyles,
  };
  const portalStyles = menuPortalTarget
    ? {
        menu: (baseStyles) => ({ ...baseStyles, zIndex: 9999 }),
        menuPortal: (baseStyles) => ({ ...baseStyles, zIndex: 9999 }),
      }
    : {};

  const [search, setSearch] = useState('');
  const validation = isNil(setValidation)
    ? validationFieldSchema[name]
    : setValidation;
  const ExtractedComponent = isNil(CustomExtracted)
    ? ExtractedOptions
    : CustomExtracted;

  let newClassName =
    error && labelError ? `${className} field-holder__error` : className;

  newClassName = isMulti
    ? `${newClassName} react-select-field-holder--multiselect`
    : newClassName;

  const autoSelect = autoSelectUniqueOption && options && options.length === 1;
  const fieldValue = autoSelect ? options[0] : !isEmpty(value) && value;

  const onChange = (newValue) => {
    if (callback) {
      callback({
        newValue,
        val: newValue,
        callbackOptions,
        handleChange,
        name,
        fieldName: name,
      });
    }
    return handleChange(name, newValue);
  };
  const extraProps = {};
  if (handleEnter) {
    extraProps.onKeyDown = (e) => {
      if (e.key === 'Enter') {
        onChange(search);
      }
    };
    extraProps.onInputChange = (searchItem) =>
      setSearch({
        value: searchItem,
        id: searchItem,
        label: searchItem,
        showLabel: '',
      });
    extraProps.noOptionsMessage = () => 'Press Enter to choose Search Value';
  }
  let customOptions = [...options];
  if (optionIsDisable) {
    customOptions = optionIsDisable(options, name);
  }
  return (
    <>
      <FieldHolder
        className={`react-select-field-holder ${newClassName}`}
        data-testid={testId}
        ref={(el) => {
          if (missingRef) {
            missingRef.input = el;
          }
          return true;
        }}
      >
        <FieldLabel
          name={name}
          triggerCustomErrors={triggerCustomErrors}
          labelError={labelError}
          customErrors={customErrors}
          label={
            tooltipLabel || selectedOptionTooltip ? (
              <span className="document-creator-field-label">
                <span>{label}</span>
                {tooltipLabel && (
                  <Tooltip
                    arrow
                    title={tooltipLabel}
                    slotProps={{
                      tooltip: { className: 'document-creator-info-tooltip' },
                      arrow: {
                        className: 'document-creator-info-tooltip-arrow',
                      },
                    }}
                  >
                    <IconButton size="small">
                      <InfoIcon fontSize="small"/>
                    </IconButton>
                  </Tooltip>
                )}
                {selectedOptionTooltip && fieldValue && (
                  <Tooltip title={fieldValue.label}>
                    <IconButton>
                      <Person />
                    </IconButton>
                  </Tooltip>
                )}
              </span>
            ) : (
              label
            )
          }
          className={labelError && 'clink-form__label-error'}
          required={required}
        >
          {children}{' '}
        </FieldLabel>
        <Field
          styles={{ ...styles, ...portalStyles, ...highlightProp }}
          components={components}
          id={name}
          name={name}
          value={fieldValue}
          validate={validation}
          className="react-select-container"
          menuPosition="fixed"
          menuPortalTarget={menuPortalTarget || undefined}
          placeholder={placeholder}
          classNamePrefix="react-select"
          component={Select}
          isMulti={isMulti}
          options={customOptions}
          onChange={onChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          isDisabled={isDisabled}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
          noOptionsMessage={noOptionsMessage}
          {...extraProps}
        />
        <>
          {innerIcon ?? innerIcon}
          {!labelError && (
            <FieldError
              customErrors={customErrors}
              name={name}
              triggerCustomErrors={triggerCustomErrors}
            />
          )}
        </>
        {goToBoq && (
          <Link sx={{ mt: 1 }} href={goToBoq} target="_blank">
            View Digital Price Breakdown
          </Link>
        )}
      </FieldHolder>
      {extractedOptions && !isEmpty(value) && (
        <ExtractedComponent
          value={value}
          name={name}
          handleChange={handleChange}
        />
      )}
    </>
  );
};

export default SelectField;
