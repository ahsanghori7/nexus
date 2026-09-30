import React from 'react';
import { Image } from 'clink-components';
import { StyledButton } from 'v2/apps/shared/styled/Page.styled';

const ArrowButton = ({
  src = '',
  className = '',
  nextItem = () => null,
  label = '',
}) => (
  <StyledButton
    type="button"
    aria-label={label}
    className={className}
    onClick={nextItem}
  >
    <Image src={src} alt={label.toString()} />
  </StyledButton>
);

export default ArrowButton;
