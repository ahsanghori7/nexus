import React from 'react';
import FormLabel from 'react-bootstrap/FormLabel';
import { Tooltip, CONSTANTS } from 'clink-components';
import InfoTooltip from './inputs/InfoTooltip';
import FieldError from './FieldError';
import LazyImage from '../LazyImage';

const { iconRecommendedOrange } = CONSTANTS.s3;

const FieldLabel = ({
  children,
  info = null,
  name,
  label,
  required,
  labelError,
  customErrors,
  triggerCustomErrors,
  setHasError,
  recommended = false,
}) => (
  <FormLabel
    htmlFor={name}
    className={`${labelError ? 'clink-form__label-error' : ''} ${
      recommended ? 'recommended' : ''
    }`}
  >
    <span className="clink-form__label-copy">
      {children} {label} {required && <div className="required">*</div>}
    </span>
    {info && <InfoTooltip info={info} />}
    {recommended && (
      <Tooltip
        text="Give yourself at least 6 weeks prior to a start on site date"
        offset={{ top: -40, left: 26 }}
        theme="recommended"
      >
        Recommended
        <LazyImage src={iconRecommendedOrange} alt="Recommended Icon" />
      </Tooltip>
    )}

    {labelError && (
      <FieldError
        customErrors={customErrors}
        name={name}
        triggerCustomErrors={triggerCustomErrors}
        setHasError={setHasError}
      />
    )}
  </FormLabel>
);

export default FieldLabel;
