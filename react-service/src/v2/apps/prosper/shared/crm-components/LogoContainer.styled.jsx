import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { LG_SCREEN } = CONSTANTS.dimensions;
const LogoContainer = styled.div`
  display: flex;

  img {
    max-width: 140px;
    max-height: 140px;
  }

  @media (max-width: ${LG_SCREEN}px) {
    img {
      max-width: 64px;
      max-height: 64px;
    }
  }
`;

export { LogoContainer };
