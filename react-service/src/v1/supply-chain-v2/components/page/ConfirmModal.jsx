import React from 'react';
import { Button, Modal, ModalContent } from 'clink-components';

const OpenButton = ({ buttonLabel, selected, handleClick }) => (
  <Button handleClick={handleClick} layout="dropdown" align="left">
    <span className="remove-data-btn">
      {selected ? <b>{`${buttonLabel}`}</b> : buttonLabel}
    </span>
  </Button>
);

const ConfirmModal = ({
  data,
  buttonLabel,
  selected,
  title = '',
  subtitle = '',
  handleConfirm,
}) => (
  <Modal
    openElement={<OpenButton selected={selected} buttonLabel={buttonLabel} />}
    render={(modalProps) => (
      <ModalContent>
        <h1>{title}</h1>
        <small>{subtitle}</small>
        <div className="center">
          <Button
            id="btn-no"
            layout="square"
            color="redButton"
            handleClick={modalProps.handleClose}
          >
            No
          </Button>
          <Button
            id="btn-yes"
            layout="square"
            color="greenButton"
            handleClick={() => {
              if (handleConfirm) handleConfirm(data);
              modalProps.handleClose();
            }}
          >
            Yes
          </Button>
        </div>
      </ModalContent>
    )}
  />
);

export default ConfirmModal;
