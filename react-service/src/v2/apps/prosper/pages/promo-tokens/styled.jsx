import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { white } = CONSTANTS.colors.general;
const { prosperPurple } = CONSTANTS.colors.prosper;
const { backgroundShapesInternal } = CONSTANTS.s3;

// TODO: This file does not belong into global shared folder
const StyledPromoTokens = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0px;
  padding: 0px;

  img {
    padding: 50px;
  }
`;

const StyledSubPanel = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 200px;
  background-color: ${prosperPurple};
  background-image: url(${backgroundShapesInternal});
  background-size: cover;
  background-position: 100% 29%;
  background-repeat: no-repeat;
`;

const StyledH1 = styled.h1`
  font-size: 48px;
  text-align: center;
  font-weight: bold;
  color: ${white};
`;

export { StyledPromoTokens, StyledSubPanel, StyledH1 };
