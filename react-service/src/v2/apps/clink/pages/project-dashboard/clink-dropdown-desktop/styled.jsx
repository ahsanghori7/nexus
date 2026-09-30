import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { darkCharcoal, clinkPurple, white, clinkLightPurple } =
  CONSTANTS.colors.general;

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

  button {
    border-radius: 0px;
    font-size: 14px;
    font-weight: bold;
    font-family: proxima-nova, sans-serif !important;
    text-decoration: none;
    color: ${darkCharcoal};

    &:not(:last-child) {
      border-bottom: 1px solid ${clinkLightPurple};
    }

    &:first-child {
      border-top-right-radius: 4px !important;
      border-top-left-radius: 4px !important;
    }

    &:last-child {
      border-bottom-right-radius: 4px !important;
      border-bottom-left-radius: 4px !important;
    }

    &:hover {
      background-color: ${white};
      text-decoration: underline;
    }
  }
`;

const StyledDropdownInterfaceDesktop = styled.div`
  position: relative;
  padding: 20px 0 20px 26px;
  font-size: 16px;
  border-bottom: 3px solid transparent;
  letter-spacing: 0.25px;
  font-weight: 500;
  text-align: left;

  &::before {
    content: '';
    width: 20px;
    height: 20px;
    display: block;
    background-size: contain;
    background-repeat: no-repeat;
    position: absolute;
    left: 0;
    top: 18px;

    ${(p) =>
      p.imageSrc &&
      `
        background-image: url("${p.imageSrc}");
      `}
  }

  &:hover {
    font-weight: bold;
    color: ${clinkPurple};
    border-color: ${clinkPurple};
    letter-spacing: 0;

    &::before {
      ${(p) =>
        p.imageSrcHover &&
        `
          background-image: url("${p.imageSrcHover}");
        `}
    }
  }
`;

export { StyledDropdownContent, StyledDropdownInterfaceDesktop };
