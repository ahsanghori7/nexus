import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { SM_SCREEN, MD_SCREEN } = CONSTANTS.dimensions;
const { white } = CONSTANTS.colors.general;
const { prosperBoxGreen, prosperGreenBorder } = CONSTANTS.colors.prosper;

const StyledModalContent = styled.div`
  display: flex;
  flex-direction: column;
  text-align: center;
  align-items: center;

  h1 {
    display: flex;
    align-items: center;
    text-transform: uppercase;
    font-size: 17px;
    font-weight: bold;

    @media (min-width: ${MD_SCREEN}px) {
      font-size: 21px;
    }

    & > span {
      margin-right: 10px;

      img {
        width: 22px;
        height: 22px;
      }
    }
  }

  .package-modal-text {
    font-size: 17px;
    font-weight: 300;
    max-width: 470px;
    margin-top: 30px;
    margin-bottom: 50px;
    line-height: 1.3;

    @media (min-width: ${MD_SCREEN}px) {
      font-size: 21px;
    }
  }

  button {
    font-size: 14px;
    background-color: ${prosperBoxGreen};
    border-color: ${prosperGreenBorder};
    color: ${white};
    text-decoration: none;
    padding: 14px 32px;
    border-radius: 6px;
    height: auto;
    font-weight: bold;

    &:hover {
      background-color: ${prosperGreenBorder};
      border-color: ${prosperBoxGreen};
      color: ${white};
    }

    @media (min-width: ${MD_SCREEN}px) {
      font-size: 17px;
    }
  }

  a {
    font-size: 14px;
    font-weight: normal;
    padding: 0;
    min-width: 201px;
    min-height: 42px;
    display: flex;
    justify-content: center;
    align-items: center;

    @media (min-width: ${MD_SCREEN}px) {
      font-size: 17px;
    }
  }
`;

const StyledTokenModalText = styled.div`
  font-size: 21px;
  font-weight: 300;
  max-width: 400px;
  margin: 30px 0 0;
  line-height: 1.4;

  b {
    font-weight: 600;
  }

  @media (max-width: ${SM_SCREEN - 1}px) {
    padding-left: 18px;
    padding-right: 18px;
    font-size: 17px;
  }
`;

const StyledH1 = styled.h1`
  font-size: 21px !important;

  @media (max-width: ${SM_SCREEN - 1}px) {
    padding-left: 10px;
    padding-right: 10px;
    font-size: 17px !important;
  }
`;

export { StyledModalContent, StyledTokenModalText, StyledH1 };
