import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { avantGardeGothicPRO } = CONSTANTS.fonts;

const StyledActionButtonText = styled.div`
  font-family: ${avantGardeGothicPRO};
  font-size: 7px;
  font-weight: bold;
  text-transform: uppercase;
  white-space: break-spaces;
  line-height: 1.4;

  ${(p) =>
    p.width
      ? `width: ${p.width}px; text-indent: ${p.width / 10}px;`
      : 'width: 80px;'}
`;

export { StyledActionButtonText };
