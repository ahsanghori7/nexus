import React from 'react';
import { Button, Modal, ModalContent } from 'clink-components';

const Content = ({ successs, className, children, theme }) => (
  <ModalContent
    theme={theme}
    className={`info-modal-content ${className}`}
    successs={successs}
  >
    {children}
  </ModalContent>
);
const H1 = ({ children }) => <h1>{children}</h1>;
const Message = ({ children, className }) => (
  <p className={`info-modal-message ${className}`}>{children}</p>
);
const ButtonContainer = ({ children, className }) => (
  <div className={`info-modal-buttons ${className}`}>{children}</div>
);

const InfoModal = ({
  title = '',
  message = '',
  closeLabel = '',
  success = false,
  open = true,
  onHidden = () => null,
  className = '',
  theme = '',
  disableEscapeKeyDown = false,
}) => {
  return (
    <Modal
      theme={theme}
      className={`info-modal ${className}`}
      externalOpen={open}
      onHidden={onHidden}
      disableEscapeKeyDown={disableEscapeKeyDown}
      render={(modalProps) => (
        <Content theme={theme} success={success} className={className}>
          <H1>{title}</H1>
          <Message className={className}>{message}</Message>
          <ButtonContainer className={className}>
            <Button label={closeLabel} handleClick={modalProps.handleClose} />
          </ButtonContainer>
        </Content>
      )}
    />
  );
};

export default InfoModal;
