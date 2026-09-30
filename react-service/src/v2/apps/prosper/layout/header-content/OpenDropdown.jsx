import React from 'react';
import styled from 'styled-components';
import { ProfileSection, CONSTANTS } from 'clink-components';

const { MD_SCREEN } = CONSTANTS.dimensions;

const StyledContainer = styled.div`
  width: 231px;

  @media (max-width: ${MD_SCREEN - 1}px) {
    width: 70px;
  }

  .profile-section {
    justify-content: 'flex-start';
  }
`;

const OpenDropdown = ({
  isOpen,
  align,
  handleClick,
  profileProps,
  ...rest
}) => {
  const handleOpen = () => handleClick(!isOpen);
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions
    <StyledContainer onClick={handleOpen}>
      <ProfileSection {...rest} profileProps={{ ...profileProps, isOpen }} />
    </StyledContainer>
  );
};

export default OpenDropdown;
