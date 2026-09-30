import React from 'react';
import { Button, Modal, ModalContent } from 'clink-components';
import { useTranslation } from 'react-i18next';

const ConfirmModal = ({
  data,
  buttonLabel,
  selected,
  title = '',
  subtitle = '',
  handleConfirm,
  className = 'confirm-modal',
  customOpenElement = null,
}) => {
  const { t } = useTranslation();
  return (
    <Modal
      className={className}
      openElement={
        customOpenElement || (
          <Button layout="dropdown" align="left">
            {selected ? (
              <b style={{ fontWeight: 'bold' }}>{`${buttonLabel}`}</b>
            ) : (
              buttonLabel
            )}
          </Button>
        )
      }
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
              {t('no')}
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
              {t('yes')}
            </Button>
          </div>
        </ModalContent>
      )}
    />
  );
};

export default ConfirmModal;
