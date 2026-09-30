import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { white } = CONSTANTS.colors.general;
const { prosperBoxShadow2, prosperGreenBorder } = CONSTANTS.colors.prosper;
const { avantGardeGothicPRO } = CONSTANTS.fonts;
const { LG_SCREEN } = CONSTANTS.dimensions;

const StyledLoadMore = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 37px;
  margin-bottom: 104px;

  @media (min-width: ${LG_SCREEN}px) {
    margin-top: 61px;
    margin-bottom: 121px;
  }

  button {
    color: ${white};
    font-size: 19px;
    width: 198px;
    height: 63px;
    padding: 0;
    border-radius: 6px;
    box-shadow: 0 0 13px ${prosperBoxShadow2};
    font-family: ${avantGardeGothicPRO};
    font-weight: normal;

    @media (min-width: ${LG_SCREEN}px) {
      font-size: 26px;
      height: 82px;
      width: 259px;
    }

    &:hover {
      background-color: ${prosperGreenBorder};
      color: ${white};
    }
  }
`;

export default StyledLoadMore;
