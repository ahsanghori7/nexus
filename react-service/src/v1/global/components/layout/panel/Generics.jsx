import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const Header = ({ title }) => {
  return (
    <h3>{title}</h3>
  );
};

const Toggle = ({ icon, handleClick }) => (
  <Accordion.Toggle
    as={Button}
    onClick={handleClick}
    eventKey="0"
    className="accordion-toggle-button"
  >
    <FontAwesomeIcon icon={icon} />
  </Accordion.Toggle>
);

export { Header, Toggle };
