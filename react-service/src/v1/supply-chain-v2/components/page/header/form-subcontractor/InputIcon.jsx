import React from 'react';
import styled from 'styled-components';
import Spinner from '../../../../../global/public/images/svg/icon-clink-logo-static.svg';

const IconWrapper = ({ children }) => (
  <div className="icon-input-wrapper">{children}</div>
);

const StyledTooltip = styled.div`
  position: relative;
  &:hover .tooltip-icon-text {
    visibility: visible;
  }
`;
const StyledTooltipText = styled.span`
  visibility: hidden;
  width: 174px;
  height: 36px;
  font-family: 'proxima_nova', 'sofia_pro_softlight', sans-serif;
  font-weight: bold;
  font-size: 14px;
  background-color: black;
  color: #fff;
  text-align: center;
  padding-top: 8px;
  border-radius: 6px;
  position: absolute;
  top: -37px;
  right: -20px;
  z-index: 1;
  &:after {
    content: '';
    display: block;
    top: 100%;
    position: absolute;
    border: 6px solid transparent;
    border-top: 6px solid black;
    transform: translateX(-50%);
    left: 82%;
  }
`;

// Todo: check if we could use InputIcon from list folder in the future
const InputIcon = () => (
  <StyledTooltip className="tooltip-icon">
    <Spinner />
    <StyledTooltipText className="tooltip-icon-text">
      C-Link network member
    </StyledTooltipText>
  </StyledTooltip>
);

export default InputIcon;
export { IconWrapper };
