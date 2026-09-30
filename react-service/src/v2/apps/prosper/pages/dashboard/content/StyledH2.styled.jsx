import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { japaneseIndigo } = CONSTANTS.colors.general;
const { avantGardeGothicPRO } = CONSTANTS.fonts;
const { LG_SCREEN } = CONSTANTS.dimensions;

// TODO: implement styles to sccs OR extract dimmension to a global file
const StyledH2 = styled.h2`
  text-align: left;
  font-family: ${avantGardeGothicPRO}, sans-serif;
  letter-spacing: -0.21px;
  color: ${japaneseIndigo} !important;
  opacity: 1;
  font-size: 19px;
  font-weight: bold;
  padding-bottom: 15px;

  @media (max-width: ${LG_SCREEN - 1}px) {
    font-size: 16px !important;
  }
`;

export default StyledH2;
