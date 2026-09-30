import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from './modal';

const ConfirmModal = ({
  data = null,
  title = '',
  subtitle = '',
  confirmText = 'Yes, delete',
  cancelText = 'No, go back',
  OpenModal = null,
  showClose = false,
  handleSubmit = () => null,
  handleCancel = (propsModal) => propsModal.setShow(false),
}) => (
  <Modal
    title={title}
    subtitle={subtitle}
    showClose={showClose}
    // eslint-disable-next-line react/no-unstable-nested-components
    ShowButton={(openProps) => (OpenModal ? <OpenModal {...openProps} /> : '')}
    className="confirmation-modal"
    render={(propsModal) => {
      return (
        <div className="confirmation-modal-actions-btn">
          <Button
            className="btn-red"
            type="submit"
            onClick={() => handleSubmit(propsModal, data)}
          >
            {confirmText}
          </Button>
          <Button
            className="btn-inverted"
            onClick={() => handleCancel(propsModal)}
          >
            {cancelText}
          </Button>
        </div>
      );
    }}
  />
);

export default ConfirmModal;
