import React from 'react';
import { Button, Image } from 'clink-components';
import { StyledActionButtonText } from './form/styled';

const ActionsButton = ({
  disabled = false,
  text = '',
  imgSrc = '',
  className = '',
  width = 60,
}) => {
  return (
    <Button data-testid="send-quote-action-btn" className={className} disabled={disabled}>
      <Image src={imgSrc} />
      <StyledActionButtonText width={width}>{text}</StyledActionButtonText>
    </Button>
  );
};

export default ActionsButton;
