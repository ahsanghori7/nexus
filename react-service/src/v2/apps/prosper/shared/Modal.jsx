import React from 'react';
import { Modal, Button } from 'clink-components';
import { StyledModalContent } from './styled';

const ProsperModal = ({
  render,
  openButton = <Button className="package-modal">Open</Button>,
}) => {
  return (
    <Modal
      className="action-required-modal"
      openElement={openButton}
      render={render}
    />
  );
};

export default ProsperModal;
export { StyledModalContent };
