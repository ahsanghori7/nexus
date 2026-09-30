import React from 'react';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from 'react-bootstrap/Button';
import filter from 'lodash/filter';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { CONSTANTS } from 'clink-components';

const { white, clinkGreen, japaneseIndigo } = CONSTANTS.colors.general;

const defaultStyles = {
  option: (styles, { data }) => {
    const isWitness = data && data.id && data.id === -1;
    let witnessStyles = {};
    if (isWitness) {
      witnessStyles = {
        borderBottom: `1px solid ${japaneseIndigo}`,
        fontWeight: '700',
      };
    }
    return {
      ...styles,
      ...witnessStyles,
      cursor: 'pointer',
    };
  },
  multiValue: (styles) => ({
    ...styles,
    background: clinkGreen,
    marginRight: '10px',
    borderRadius: '10px',
  }),
  multiValueLabel: (styles) => ({
    ...styles,
    background: clinkGreen,
    color: white,
    padding: '5px',
    borderRadius: '10px',
  }),
  multiValueRemove: (styles) => ({
    ...styles,
    color: white,
  }),
};

const ExtractedOptions = ({ value, name, handleChange }) => (
  <ListGroup>
    {value.map((option) => (
      <ListGroup.Item key={option.label}>
        {option.label}
        <Button
          size="sm"
          variant="outline-danger"
          type="button"
          onClick={() =>
            handleChange(
              name,
              filter(value, (val) => val.label !== option.label)
            )
          }
        >
          <FontAwesomeIcon icon={faTimes} />
        </Button>
      </ListGroup.Item>
    ))}
  </ListGroup>
);

export { defaultStyles, ExtractedOptions };
