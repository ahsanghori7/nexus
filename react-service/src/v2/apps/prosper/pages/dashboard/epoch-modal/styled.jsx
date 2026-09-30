import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { LG_SCREEN } = CONSTANTS.dimensions;

const StyledButtonWrapper = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-top: 20px;
  margin-bottom: 40px;

  @media (max-width: ${LG_SCREEN - 1}px) {
    margin-top: 7px;
    margin-bottom: 10px;
  }
`;

const StyledEpochModalContent = styled.div`
  iframe {
    padding: 9px;
    background-color: transparent;

    @media (max-width: ${LG_SCREEN - 1}px) {
      padding: 0;
    }
  }
`;

export { StyledButtonWrapper, StyledEpochModalContent };
