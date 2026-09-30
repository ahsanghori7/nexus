import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { MD_SCREEN } = CONSTANTS.dimensions;

const StyledRightContent = styled.div`
  @media (max-width: ${MD_SCREEN - 1}px) {
    width: 100%;
  }
`;

export { StyledRightContent };
