import React from 'react';
import Modal from '../../../global/components/modal';
import Content from './Content';

const ConfirmModal = ({
  data,
  title = '',
  subtitle = '',
  confirmLabel = '',
  disabled,
  OpenModalButton,
  callback,
}) => {
  const OpenButton = ({ handleClick }) => (
    <OpenModalButton handleClick={handleClick} disabled={disabled} />
  );

  return (
    <Modal
      title={title}
      subtitle={subtitle}
      showClose={false}
      ShowButton={OpenButton}
      className="modal-confirm-action"
      render={(modalProps) => {
        const { setShow } = modalProps;
        return (
          <Content
            data={data}
            setShow={setShow}
            callback={callback}
            confirmLabel={confirmLabel}
          />
        );
      }}
    />
  );
};

export default ConfirmModal;
