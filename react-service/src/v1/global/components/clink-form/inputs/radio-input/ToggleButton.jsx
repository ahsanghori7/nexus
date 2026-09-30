import React from 'react';
import { ToggleButton } from 'react-bootstrap';
import { faCheckSquare, faSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Toggle = ({
  field,
  handleChange,
  setFieldValue,
  value,
  className = '',
  opt,
}) => (
  <ToggleButton
    id={opt.id}
    type="radio"
    key={opt.id}
    variant={
      String(value) === String(opt.value)
        ? 'outline-success'
        : 'outline-secondary'
    }
    className={`${className} toggle-button`}
    name={field.name}
    value={opt.value}
    checked={String(value) === String(opt.value)}
    onChange={(event) => {
      const valueRadioBtn = event.currentTarget.value;
      setFieldValue(field.name, valueRadioBtn);

      if (handleChange) {
        handleChange(field, opt);
      }
    }}
  >
    {opt.label}
    &nbsp;
    <FontAwesomeIcon
      className="icon-radio-button"
      icon={String(value) === String(opt.value) ? faCheckSquare : faSquare}
    />
  </ToggleButton>
);

export default Toggle;
