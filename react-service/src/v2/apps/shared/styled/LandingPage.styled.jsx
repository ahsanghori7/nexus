import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { LG_SCREEN, MD_SCREEN, SM_SCREEN } = CONSTANTS.dimensions;
const { aliceBlue, blueMagentaViolet, white } = CONSTANTS.colors.general;
const {
  bubbles,
  paleCerulean,
  prosperBoxRed,
  prosperRedBorder,
  prosperBoxShadow2,
} = CONSTANTS.colors.prosper;

const StyledWrapper = styled.div`
  display: flex;
  width: 100%;
  background-color: ${aliceBlue};

  @media (min-width: ${LG_SCREEN}px) {
    margin-top: -40px;
    margin-bottom: -40px;
  }

  @media (max-width: ${LG_SCREEN - 1}px) {
    flex-direction: column;
  }
`;

const StyledHalf = styled.div`
  display: flex;

  @media (min-width: ${LG_SCREEN}px) {
    flex-basis: 50%;
  }
`;

const StyledHalfContent = styled.div`
  padding: 40px;
  width: 100%;
  padding-top: 52px;

  @media (max-width: ${LG_SCREEN - 1}px) {
    padding: 20px 0;
  }
`;

const StyledWrapperLeft = styled(StyledHalf)`
  justify-content: flex-end;
`;

const StyledContentLeft = styled(StyledHalfContent)`
  max-width: 625px;
  padding-right: 30px;
  padding-left: 0;

  @media (max-width: ${LG_SCREEN - 1}px) {
    max-width: 100%;
    padding-right: 0;
  }
`;

const StyledWrapperRight = styled(StyledHalf)`
  justify-content: flex-start;
`;

const StyledContentRight = styled(StyledHalfContent)`
  max-width: 560px;

  @media (min-width: ${LG_SCREEN}px) {
    background: transparent
      linear-gradient(90deg, ${bubbles} 0%, ${aliceBlue} 100%) 0% 0% no-repeat
      padding-box;
  }

  @media (max-width: ${LG_SCREEN - 1}px) {
    max-width: 100%;
  }
`;

const StyledRed = styled.span`
  color: ${prosperBoxRed};
`;

const StyledRedLink = styled.a`
  color: ${prosperBoxRed};
`;

const StyledBold = styled.b`
  font-weight: bold;
  font-size: 16px;

  @media (max-width: ${LG_SCREEN - 1}px) {
    font-size: 13px;
  }
`;

const StyledTitle = styled.h2`
  font-size: 19px;
  font-weight: 600;
  margin-bottom: 30px;

  @media (max-width: ${LG_SCREEN - 1}px) {
    font-size: 16px;
    margin-bottom: 10px;
  }
`;

const StyledP = styled.p`
  font-size: 15px;
  margin-top: 26px;
  line-height: 1.5;

  @media (max-width: ${LG_SCREEN - 1}px) {
    font-size: 11px;
  }
`;

const StyledTitle2 = styled.h3`
  color: ${blueMagentaViolet};
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 15px;
  padding-top: 12px;
  line-height: 1.5;

  @media (max-width: ${LG_SCREEN - 1}px) {
    padding-top: 12px;
    font-size: 13px;
    margin-bottom: 4px;
  }
`;

const StyledDescription = styled.p`
  font-size: 14px;
  font-style: italic;
  line-height: 1.6;
  padding-bottom: 12px;
  padding-right: 50px;

  @media (max-width: ${LG_SCREEN - 1}px) {
    font-size: 11px;
  }
`;

const StyledDiscalimer = styled.p`
  margin-top: 65px;
  font-size: 13px;
  line-height: 1.7;
  margin-bottom: 24px;
  max-width: 460px;

  @media (max-width: ${LG_SCREEN - 1}px) {
    margin-bottom: 20px;
    font-size: 10px;
    margin-top: 30px;
  }
`;

const StyledButtonWrapper = styled.div`
  @media (max-width: ${LG_SCREEN - 1}px) {
    display: flex;
    justify-content: center;
  }

  button {
    &.buy-more-tokens {
      border: 1px solid ${prosperRedBorder};
      font-size: 25px;
      width: 100%;
      max-width: 306px;
      height: 75px;
      box-shadow: 0px 0px 13px ${prosperBoxShadow2};
      margin-bottom: 140px;

      @media (max-width: ${LG_SCREEN - 1}px) {
        font-size: 18px;
        max-width: 229px;
        height: 59px;
        margin-bottom: 60px;
      }
    }
  }

  ${(p) =>
    p.successStories &&
    `
    max-width: 321px;
    width: 100%;
    margin-top: 61px;

    button {
      &.buy-more-tokens {
        font-size: 26px;
        width: 100%;
        max-width: initial;
        margin-bottom: 70px;

        @media (max-width: ${LG_SCREEN - 1}px) {
          max-width: 229px;
          font-size: 18px;
          height: 56px;
          margin-bottom: 24px;
        }
      }
    }

    @media (max-width: ${LG_SCREEN - 1}px) {
      margin-top: 20px;
    }
  `}
`;

const StyledVideo = styled.div`
  width: 100%;
  padding: 8px;
  display: block;
  min-height: 497px;
  background-color: ${white};
  box-sizing: border-box;

  @media (max-width: ${LG_SCREEN - 1}px) {
    min-height: 391px;
  }

  @media (max-width: ${MD_SCREEN - 1}px) {
    min-height: 249px;
  }

  @media (max-width: ${SM_SCREEN - 1}px) {
    min-height: 170px;
  }

  ${(p) =>
    p.howItWorks &&
    `
      @media (min-width: ${LG_SCREEN}px) {
        min-height: auto;
        margin-bottom: 370px;
      }

      @media (max-width: ${LG_SCREEN - 1}px) {
        min-height: 50vw;
      }

    `}
`;

const StyledVideoOld = styled.iframe`
  width: 100%;
  padding: 8px;
  min-height: 403px;
  background-color: ${white};
  box-sizing: border-box;
  @media (max-width: ${MD_SCREEN - 1}px) {
    width: 100%;
    min-height: 194px;
  }
`;

const StyledSmallVideo = styled.div`
  height: 81px;
  padding-top: 12px;
  flex-basis: 132px;
  min-width: 132px;
`;

const StyledTextContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 400px;

  p {
    padding-right: 0px;
  }
`;

const StyledContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: start;
  gap: 10px;
  border-bottom: 1px dotted ${paleCerulean};

  &:last-child {
    border-bottom: none;

    p {
      border-bottom: none;
    }
  }
`;

export {
  StyledWrapper,
  StyledWrapperLeft,
  StyledContentLeft,
  StyledWrapperRight,
  StyledContentRight,
  StyledRed,
  StyledRedLink,
  StyledBold,
  StyledP,
  StyledTitle,
  StyledTitle2,
  StyledDescription,
  StyledDiscalimer,
  StyledButtonWrapper,
  StyledVideo,
  StyledVideoOld,
  StyledSmallVideo,
  StyledTextContainer,
  StyledContainer,
};
