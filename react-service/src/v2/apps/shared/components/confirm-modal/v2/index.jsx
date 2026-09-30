import React from 'react';
import PropTypes from 'prop-types';
import Modal from '@mui/material/Modal';
import Content from './Content';

const ConfirmModal = ({
  id = null,
  openModal = false,
  openButtonModal = null,
  slotProps = {},
  children,
  handleClose = () => {},
  onBackdropClick = null,
}) => {
  const props = onBackdropClick ? { onBackdropClick } : {};
  return (
    <div data-testid="confirm-modal-wrapper">
      {openButtonModal}
      <Modal
        data-testid="confirm-modal"
        slotProps={slotProps}
        id={id}
        open={openModal}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        {...props}
      >
        {children}
      </Modal>
    </div>
  );
};

ConfirmModal.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  openModal: PropTypes.bool,
  openButtonModal: PropTypes.node,
  slotProps: PropTypes.object,
  children: PropTypes.node,
  handleClose: PropTypes.func,
  onBackdropClick: PropTypes.func,
  data: PropTypes.any,
};

export default ConfirmModal;
export { Content };
