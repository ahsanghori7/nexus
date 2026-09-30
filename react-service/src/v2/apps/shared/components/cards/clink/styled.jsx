import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { clinkPurple } = CONSTANTS.colors.general;

const StyledWrapperWithImage = styled.div`
  position: relative;

  ${(p) =>
    p.imageSrc &&
    !p.dropdown &&
    `
      cursor: pointer;
      padding: 20px 0px 20px 30px;
      border-bottom: 3px solid transparent;

      &:hover {
        color: ${clinkPurple};
        border-color: ${clinkPurple};

        &::before {
          background-image: url("${p.imageSrcHover}");
        }
      }
    `}

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
      !p.dropdown &&
      `
        background-image: url("${p.imageSrc}");
    `}
  }
`;

export { StyledWrapperWithImage };
