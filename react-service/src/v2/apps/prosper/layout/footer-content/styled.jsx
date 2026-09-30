import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { white } = CONSTANTS.colors.general;
const { pewterBlue } = CONSTANTS.colors.prosper;
const { avantGardeGothicPRO } = CONSTANTS.fonts;

const StyledContainer = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
`;
const StyledContainerItem = styled.div`
  flex: 1 0 100%;
  text-align: center;
  font-family: ${avantGardeGothicPRO};
  font-size: 10px;
  letter-spacing: -0.07px;
  color: ${pewterBlue};
  opacity: 1;
  font-weight: 700px;
  margin-bottom: 4px;
  ${(p) =>
    p.main &&
    `
    color: ${white};
    font-size: 14px;
    letter-spacing: -0.1px;
    font-weight: 400px;
  `}
`;

export { StyledContainer, StyledContainerItem };
