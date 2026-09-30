import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { SM_SCREEN } = CONSTANTS.dimensions;

const ImageContent = styled.div`
  display: inline-flex;
  flex: 3;
  max-width: 85px;

  @media (min-width: ${SM_SCREEN}px) {
    max-width: 100px;
  }
`;

const Content = styled.div`
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  align-items: start;
  flex: 4;
`;

const DeleteContent = styled.div`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  flex: 2;
`;

export { ImageContent, Content, DeleteContent };
