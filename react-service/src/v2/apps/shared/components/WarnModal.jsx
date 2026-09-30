import React from 'react';
import { Modal, ModalContent } from 'clink-components';
import {
  StyledModalContent,
  StyledH1,
  StyledTokenModalText,
} from 'v2/apps/prosper/shared/styled';

/* TODO: Refactor styles */

const NormalContent = ({ children }) => (
  <ModalContent className="center">{children}</ModalContent>
);
const NormalH1 = ({ children }) => <h1>{children}</h1>;
const NormalMessage = ({ children }) => (
  <div className="center">{children}</div>
);

const ProsperContent = ({ children }) => (
  <StyledModalContent className="packages-modal-content">
    {children}
  </StyledModalContent>
);
const ProsperH1 = ({ children }) => <StyledH1>{children}</StyledH1>;
const ProsperMessage = ({ children }) => (
  <StyledTokenModalText>{children}</StyledTokenModalText>
);

const WarnModal = ({
  title = 'Error',
  message = 'There was an error when sending the instruction/ncr',
  open = true,
  onHidden = () => null,
  className = '',
  theme = null,
}) => {
  let Content = NormalContent;
  let H1 = NormalH1;
  let Message = NormalMessage;
  if (theme && theme === 'prosper') {
    Content = ProsperContent;
    H1 = ProsperH1;
    Message = ProsperMessage;
  }
  return (
    <Modal
      className={`warn-modal ${className}`}
      externalOpen={open}
      onHidden={onHidden}
      render={() => (
        <Content className="packages-modal-content">
          <H1>{title}</H1>
          <Message>{message}</Message>
        </Content>
      )}
    />
  );
};

export default WarnModal;
