import React from 'react';
import { Modal, ModalContent } from 'clink-components';
import { StyledModalContent, StyledH1, StyledTokenModalText } from './styled';

const Content = ({ children, theme }) => {
  if (theme && theme === 'prosper') {
    return (
      <StyledModalContent className="packages-modal-content">
        {children}
      </StyledModalContent>
    );
  }

  return <ModalContent className="center">{children}</ModalContent>;
};

const H1 = ({ children, theme }) => {
  if (theme && theme === 'prosper') {
    return <StyledH1>{children}</StyledH1>;
  }

  return <h1>{children}</h1>;
};

const Message = ({ children, theme }) => {
  if (theme && theme === 'prosper') {
    return <StyledTokenModalText>{children}</StyledTokenModalText>;
  }

  return <div className="center">{children}</div>;
};

const WarnModal = ({
  title = 'Archived',
  message = 'This Enquiry PDF is archived. Please contact with C-Link support for further instructions',
  open = true,
  onHidden = () => null,
  className = '',
  theme = null,
}) => {
  return (
    <Modal
      className={`warn-modal ${className}`}
      externalOpen={open}
      onHidden={onHidden}
      render={() => (
        <Content className="packages-modal-content" theme={theme}>
          <H1 theme={theme}>{title}</H1>
          <Message theme={theme}>{message}</Message>
        </Content>
      )}
    />
  );
};

export default WarnModal;
