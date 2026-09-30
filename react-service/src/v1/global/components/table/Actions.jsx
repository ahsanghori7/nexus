import React from 'react';
import Button from 'react-bootstrap/Button';
import { faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Modal from '../modal';

const Actions = () => (
  <>
    <Button size="sm" variant="success" type="button">
      View Profile
    </Button>
    <Button size="sm" variant="outline-primary" type="button">
      Remove
    </Button>
    <Button size="sm" variant="outline-danger" type="button">
      <FontAwesomeIcon icon={faCheckCircle} />
    </Button>
    <Modal title="Modal for you!" />
  </>
);

export default Actions;
