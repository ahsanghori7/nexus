import React from 'react';
import ButtonGroup from 'react-bootstrap/ButtonGroup';
import ListGroup from 'react-bootstrap/ListGroup';
import Toggle from './ToggleButton';
import Input from './Input';

const RadioInput = ({
  options,
  field,
  setFieldValue,
  value,
  handleChange,
  className = '',
  toggleButton = true,
}) => {
  return toggleButton ? (
    <ButtonGroup className="radio-button-group">
      {options.map((opt) => (
        <Toggle
          key={opt.id}
          opt={opt}
          handleChange={handleChange}
          setFieldValue={setFieldValue}
          field={field}
          className={className}
          value={value}
        />
      ))}
    </ButtonGroup>
  ) : (
    <ListGroup className="radio-input-group">
      {options.map((opt) => (
        <Input
          key={opt.id}
          opt={opt}
          field={field}
          setFieldValue={setFieldValue}
          value={value}
        />
      ))}
    </ListGroup>
  );
};

export default RadioInput;
