import React from 'react';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import ListGroup from 'react-bootstrap/ListGroup';
import withStyles from '@mui/styles/withStyles';
import { CONSTANTS } from 'clink-components';

const { lightPeriwinkle, clinkGreen } = CONSTANTS.colors.general;

const GreenRadio = withStyles({
  root: {
    color: lightPeriwinkle,
    '& svg': {
      fontSize: '1rem',
    },
    '&$checked': {
      color: clinkGreen,
    },
  },
  checked: {},
})((props) => <Radio color="default" {...props} />);

const StyledFormControlLabel = withStyles({
  root: {
    marginBottom: '0',
  },
})((props) => <FormControlLabel color="default" {...props} />);

const RadioInput = ({ opt, field, setFieldValue, value }) => {
  const isChecked = String(value) === String(opt.value);
  const className = isChecked ? 'radio-item-checked' : '';
  const handleChange = () => setFieldValue(field.name, opt.value);
  return (
    <ListGroup.Item className={className} onClick={handleChange}>
      <StyledFormControlLabel
        key={opt.id}
        value={opt.value}
        id={opt.id}
        type="radio"
        name={field.name}
        checked={isChecked}
        onChange={handleChange}
        control={<GreenRadio />}
        label={opt.label}
      />
    </ListGroup.Item>
  );
};

export default RadioInput;
