import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { avantGardeGothicPRO } = CONSTANTS.fonts;
const { SM_SCREEN, MD_SCREEN, LG_SCREEN, XL_SCREEN } = CONSTANTS.dimensions;
const { white, japaneseIndigo, darkJungleGreen } = CONSTANTS.colors.general;
const { prosperBoxRed, blackCoral, darkGoldenrod } = CONSTANTS.colors.prosper;

const StyledContainer = styled.div`
  display: flex;
  align-items: center;

  @media (max-width: ${MD_SCREEN - 1}px) {
    width: calc(100% - 66px);
    justify-content: space-between;
  }

  @media (max-width: ${SM_SCREEN - 1}px) {
    position: relative;
    width: 100%;
    height: 77px;
  }

  .clink-dropdown {
    width: 100%;

    @media (max-width: ${MD_SCREEN - 1}px) {
      padding-left: 30px;

      position: absolute;
      right: 0;
      width: 50%;
      top: 0;
      padding-left: 0;

      & > div {
        width: 100%;
      }
    }
  }
`;

const StyledNotifications = styled.div`
  height: 100%;
  display: flex;
  align-items: center;

  .prosper-tokens {
    span {
      display: none;
    }
  }

  @media (min-width: ${LG_SCREEN}px) {
    .prosper-tokens {
      span {
        display: block;
      }
    }
  }

  @media (max-width: ${SM_SCREEN - 1}px) {
    position: absolute;
    left: 0;
    width: 50%;
    justify-content: center;
  }
`;

const StyledList = styled.ul`
  color: white;
  list-style: none;
  text-align: right;
  font-family: ${avantGardeGothicPRO}, sans-serif;
  font-size: 14px;
  letter-spacing: -0.1px;
  opacity: 1;
  margin: 0;
  padding: 0;

  @media (min-width: ${MD_SCREEN}px) {
    padding: 0px 47px;
  }
  a {
    text-decoration: none;
  }
`;

const StyledListItem = styled.li`
  font-size: 14px;
  text-decoration: none;
  color: ${white};
  &:hover {
    background-color: ${japaneseIndigo};
    cursor: pointer;
  }
  padding: 0;
  margin-bottom: 5px;
  &:last-child {
    margin-bottom: 17px;

    @media (min-width: ${MD_SCREEN}px) {
      margin-bottom: 12px;
    }
  }
  font-weight: 400;

  @media (min-width: ${MD_SCREEN}px) {
    margin-bottom: 14px;
  }
`;

const StyledToken = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 130px;

  button {
    padding: 0;
    box-sizing: border-box;
    width: auto;
    min-width: auto;
    background-color: transparent;
    border-radius: 50%;
    border: none;
    position: relative;

    @media (max-width: ${MD_SCREEN - 1}px) {
      margin-left: -20px;
    }
  }

  .buy-more-tokens-box {
    transform: translate(0px, -11px);
  }

  .card__item--link {
    padding: 17px 27px;
    white-space: nowrap;
    margin-right: 10px;

    @media (max-width: ${XL_SCREEN - 1}px) {
      padding: 14px 20px;
    }

    @media (max-width: ${LG_SCREEN - 1}px) {
      padding: 8px;
      font-size: 11px;
      border-radius: 3px;
      margin-right: 10px;
    }
  }
`;

const StyledTokenSM = styled(StyledToken)`
  @media (min-width: ${MD_SCREEN}px) {
    display: none;
  }
  @media (max-width: ${SM_SCREEN - 1}px) {
    padding-right: 20px;
  }
`;

const StyledTokenLG = styled(StyledToken)`
  @media (max-width: ${MD_SCREEN - 1}px) {
    display: none;
  }

  @media (max-width: ${SM_SCREEN - 1}px) {
    display: none;
  }
  ${(p) =>
    p.canClaimFreeTokens &&
    `
  ,buy-more-tokens-box {
    transform: translate(-40px, 0px);
  }
  `}
  ${(p) =>
    !p.showInbox &&
    `
    margin-right: 15px;
  `}
`;

const StyledSeparator = styled.div`
  width: 1px;
  height: calc(90% - 10px);
  margin-top: 9px;
  margin-bottom: 5px;
  background-color: ${darkJungleGreen};
  border-right: 1px solid ${blackCoral};

  @media (max-width: ${SM_SCREEN - 1}px) {
    visibility: hidden;
  }
`;

const StyledBuyTokenBanner = styled.div`
  background-color: ${prosperBoxRed};
  color: ${white};
  width: max-content;
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 10px;
  box-sizing: border-box;
  border-radius: 4px;
  font-weight: 500;
  position: relative;
  margin-right: 16px;

  &:after {
    content: '';
    width: 0;
    height: 0;
    border: 5px solid transparent;
    border-bottom: 5px solid ${prosperBoxRed};
    border-left: 5px solid ${prosperBoxRed};
    position: absolute;
    right: -4px;
    top: 6px;
    transform: rotate(-20deg) scale(2, 2);
  }
`;

const StyledTokensNumber = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: ${darkGoldenrod};
  position: relative;
  top: -25px;
  ${(p) =>
    p.isSafari &&
    `
    top: -31px;
  `}
  ${(p) =>
    p.isIpad &&
    `
    top: -32px;
  `}
  ${(p) =>
    p.isLabel &&
    `
    top: 10px;
  `}
`;

const StyledNavProfileWrapper = styled.div`
  display: flex;

  @media (max-width: ${MD_SCREEN - 1}px) {
    max-width: 92px;
    height: 77px;
  }

  @media (max-width: ${SM_SCREEN - 1}px) {
    max-width: 150px;
  }
`;

export {
  StyledContainer,
  StyledList,
  StyledListItem,
  StyledNotifications,
  StyledSeparator,
  StyledTokenSM,
  StyledTokenLG,
  StyledBuyTokenBanner,
  StyledTokensNumber,
  StyledNavProfileWrapper,
};
