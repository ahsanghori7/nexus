import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { clinkLightPurple, white, darkCharcoal } = CONSTANTS.colors.general;

const StyledDropdownContent = styled.div`
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: visible;
  color: ${darkCharcoal};

  &:after {
    content: '';
    width: 10px;
    height: 10px;
    background-color: ${white};
    border: 1px solid ${clinkLightPurple};
    position: absolute;
    top: -6px;
    transform: rotate(45deg);
    border-bottom: none;
    border-right: 0;
    right: 14px;
  }

  &.left-align {
    a,
    button,
    .MuiButtonBase-root {
      text-align: left;
      justify-content: flex-start;
      &:hover {
        color: inherit;
        font-weight: 600;
      }
    }
  }
`;

export { StyledDropdownContent };
