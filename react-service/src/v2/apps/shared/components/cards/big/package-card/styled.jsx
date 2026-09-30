import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { avantGardeGothicPRO } = CONSTANTS.fonts;
const { MD_SCREEN, LG_SCREEN } = CONSTANTS.dimensions;
const { japaneseIndigo, white } = CONSTANTS.colors.general;
const {
  auroMetalSaurus,
  prosperBoxRed,
  philippineSilver,
  prosperGrayDisabledText,
  romanSilver,
  lightSlateGray,
  iguanaGreen,
  prosperBoxGreen,
  prosperGreenBorder,
  prosperGrayBorder,
  prosperGrayDisabled,
  wildBlueYonder,
  quickSilver,
  prosperOuterSpace,
  dimGray,
  veryLightGrey,
  zambezi,
  pattensBlue,
  midnight,
  teaGreen,
} = CONSTANTS.colors.prosper;

const StyledCardItemHead = styled.div`
  background-color: ${japaneseIndigo};
  color: ${white};
  min-height: 75px;
  display: flex;
  flex-wrap: nowrap;
  align-items: stretch;
  font-size: 14px;
  font-weight: bold;
  line-height: normal;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;
  flex-direction: column;

  ${(props) =>
    (!props.matched || props.closed) &&
    `
      background-color: ${quickSilver};
      opacity: 0.35;
    `}

  @media (min-width: ${LG_SCREEN}px) {
    font-size: 18px;
    padding-left: 24px;
    padding-right: 24px;
    flex-direction: row;
    min-height: 59px;
  }
`;

const StyledCardItemHeadTitle = styled.div`
  white-space: nowrap;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 47px;

  ${(props) =>
    (!props.matched || props.closed) &&
    `
      color: ${prosperOuterSpace};
    `}

  @media (min-width: ${LG_SCREEN}px) {
    height: unset;
  }
`;

const StyledCardItemHeadDescription = styled.div`
  display: flex;
  flex: 0 1 100%;
  flex-wrap: wrap;
  justify-content: end;
  align-items: center;

  .badge-wrapper {
    width: auto;
    background-color: ${japaneseIndigo};
    border: 1px dotted ${lightSlateGray};
    font-size: 9px;
    text-transform: capitalize;
    box-sizing: border-box;
    height: 22px;
    display: flex;
    align-items: center;
    padding: 0 10px;
    border-radius: 3px;
    margin: 10px;
    margin-left: 0;

    ${(props) =>
      !props.matched &&
      `
        background-color: transparent;
        border: 1px solid ${dimGray};
        color: ${dimGray};
      `}

    &:last-of-type {
      margin-right: 0;
    }
  }

  @media (max-width: ${LG_SCREEN - 1}px) {
    display: none;
  }
`;

const StyledCardItemHeadTags = styled.div`
  font-size: 13px;
  color: ${wildBlueYonder};
  padding: 4px;
  font-weight: 500;
  margin: 10px;

  ${(props) =>
    !props.matched &&
    `
      color: ${prosperOuterSpace};
    `}

  ${(props) =>
    props.closed &&
    `
        color: ${japaneseIndigo};
      `}
`;

const StyledCardItemInfoSubtitle = styled.div`
  font-size: 13px;
  font-weight: bold;
  color: ${prosperBoxRed};
  margin-bottom: 10px;

  ${(props) =>
    (!props.matched || props.closed) &&
    `
      color: ${prosperOuterSpace};
    `}

  @media (min-width: ${MD_SCREEN}px) {
    font-size: 15px;
  }
`;

const StyledCardItemInfoTradesSubtitle = styled(StyledCardItemInfoSubtitle)`
  flex-basis: 100%;
  text-align: center;
  border-top: 1px dotted ${philippineSilver};
  padding-top: 14px;
  color: ${auroMetalSaurus};
  font-size: 10px;
  font-weight: 500;
`;

const StyledCardInfoDescription = styled.div`
  font-size: 12px;
  font-weight: 300;

  @media (min-width: ${MD_SCREEN}px) {
    font-size: 13px;
  }
`;

const StyledCardInfoTradesDescription = styled(StyledCardInfoDescription)`
  min-height: 40px;
  flex-wrap: wrap;
  display: flex;
  justify-content: center;
`;

const StyledCardItemClosed = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgb(202, 206, 209, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  border-radius: 4px;
  z-index: 1;

  @media only screen and (min-width: ${LG_SCREEN}px) {
    justify-content: flex-start;
  }
`;

const StyledCardItemClosedImage = styled.div`
  padding-top: 40px;

  @media only screen and (min-width: ${LG_SCREEN}px) {
    padding-top: 26px;
  }

  img {
    height: 112px;
    width: 112px;

    @media only screen and (min-width: ${LG_SCREEN}px) {
      height: 84px;
      width: auto;
    }

    @media only screen and (max-width: ${LG_SCREEN - 1}px) {
      margin-top: 30px;
    }
  }
`;

const StyledCardItemClosedText = styled.div`
  color: ${prosperGrayDisabledText};
  font-size: 14px;
  font-weight: bold;

  @media only screen and (min-width: ${LG_SCREEN}px) {
    font-size: 13px;
  }

  @media only screen and (max-width: ${LG_SCREEN - 1}px) {
    margin-bottom: 90px;
    font-size: 17px;
  }
`;

const StyledCardItemTrades = styled.div`
  flex-basis: 100%;
  padding: 21px;
  padding-bottom: 0;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;

  @media (min-width: ${LG_SCREEN}px) {
    display: none;
  }

  .badge-wrapper {
    text-align: center;
    padding: 4px 9px 3px 9px;
    width: auto;
    margin-right: 6px;
    font-weight: bold;
    margin-bottom: 4px;
    background-color: ${romanSilver};
    border: 1px solid ${lightSlateGray};
    height: 18px;
    box-sizing: border-box;

    span {
      font-size: 7px;
      padding: 0;
      margin: 0;
      text-transform: capitalize;
      white-space: nowrap;
    }
  }
`;

const StyledInfoLineWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
`;

const StyledLinkWrapper = styled.div`
  min-width: 244px;

  @media (min-width: ${LG_SCREEN}px) {
    min-width: 155px;
  }

  @media (max-width: ${LG_SCREEN - 1}px) {
    flex-basis: 100%;
    display: flex;
    justify-content: center;
  }

  button {
    font-size: 14px;
    font-weight: normal;
    background-color: ${iguanaGreen};
    border-color: ${prosperGreenBorder};
    color: ${white};
    text-decoration: none;
    width: 100%;
    max-width: 243px;
    padding: 0;
    border-radius: 6px;
    margin-bottom: 24px;
    height: auto;
    font-family: ${avantGardeGothicPRO}, sans-serif;
    font-weight: normal;
    min-height: 53px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;

    @media (min-width: ${LG_SCREEN}px) {
      font-size: 14px;
      max-width: 155px;
      margin-bottom: 0;
    }

    &:hover {
      background-color: ${prosperGreenBorder};
    }

    &:disabled {
      background-color: ${prosperGrayDisabled};
      border-color: ${prosperGrayBorder};
      color: ${white};
      pointer-events: none;
      cursor: not-allowed;
      opacity: 1;
    }
  }
`;

const StyledCardItemHeadInfo = styled.div`
  display: flex;
  align-items: center;
  font-weight: 400;
  white-space: nowrap;
  min-height: 28px;
  justify-content: center;
  padding: 0;
  margin: 0;
  font-size: 12px;
  border-left: 1px dotted ${japaneseIndigo};
  border-right: 1px dotted ${japaneseIndigo};

  ${(props) =>
    !props.matched || props.closed
      ? `
      background: ${veryLightGrey};
      color: ${zambezi};
      `
      : `
      background: ${pattensBlue};
      color: ${auroMetalSaurus};
      `}

  @media (min-width: ${LG_SCREEN}px) {
    min-height: 59px;
    justify-content: unset;
    margin-left: 24px;
    padding-left: 24px;
    font-size: 17px;
    border: 0;
    ${(props) =>
      !props.matched || props.closed
        ? `
        background: transparent;
        color: ${zambezi};
        `
        : `
        background: transparent
        linear-gradient(90deg, ${midnight} 0%, ${japaneseIndigo} 100%) 0% 0% no-repeat
        padding-box;
        color: ${prosperBoxGreen};
        `}
  }

  b {
    ${(props) =>
      !props.matched || props.closed
        ? `
        color: ${zambezi};
        `
        : `
        color: ${japaneseIndigo};
        `}
    font-weight: 700;
    margin-right: 5px;

    @media (min-width: ${LG_SCREEN}px) {
      color: ${white};
      ${(props) =>
        !props.matched || props.closed
          ? `
          color: ${zambezi};
          `
          : `
          color: ${white};
          `}
    }
  }
`;

const StyledDaysRemaining = styled.div`
  font-size: 9px;
  color: ${teaGreen};
  text-transform: uppercase;
  font-weight: bold;
  margin-top: 4px;
`;

const StyledDisplayer = styled.div`
  display: none;
  ${(p) =>
    p.show &&
    `
    display: block;
  `}
`;

export {
  StyledCardItemHead,
  StyledCardItemHeadTitle,
  StyledCardItemHeadDescription,
  StyledCardItemHeadTags,
  StyledCardItemHeadInfo,
  StyledCardItemInfoSubtitle,
  StyledCardItemInfoTradesSubtitle,
  StyledCardInfoDescription,
  StyledCardInfoTradesDescription,
  StyledCardItemClosed,
  StyledCardItemClosedImage,
  StyledCardItemClosedText,
  StyledCardItemTrades,
  StyledInfoLineWrapper,
  StyledLinkWrapper,
  StyledDaysRemaining,
  StyledDisplayer,
};
