import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { SM_SCREEN, MD_SCREEN } = CONSTANTS.dimensions;
const { white, japaneseIndigo, black } = CONSTANTS.colors.general;
const { prosperBoxGreen, prosperGreenBorder, prosperBoxRed, darkGoldenrod } =
  CONSTANTS.colors.prosper;

// TODO: Refactor this file OR re-allocate OR migrate to MUI
const StyledModalContent = styled.div`
  ${(p) => p.position && `position: ${p.position};`}
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
  ${(p) =>
    p.noMargin &&
    `
    margin: 0;
  `}

  b {
    font-weight: 600;
  }

  @media (max-width: ${SM_SCREEN - 1}px) {
    padding-left: 18px;
    padding-right: 18px;
    font-size: 17px;
  }
`;

const StyledSuccesContent = styled.div``;

const StyledSuccesContentBox = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const StyledSuccesContentDescription = styled.h3`
  font-size: 21px;
  max-width: 370px;
  margin-bottom: 22px;
`;

const StyledSuccesContentChecked = styled(StyledSuccesContentBox)`
  margin-bottom: 10px;
`;

const StyledSuccesContentStripe = styled(StyledSuccesContentBox)``;

const StyledTokenOffers = styled.div`
  width: 100%;

  @media (max-width: ${SM_SCREEN - 1}px) {
    height: 300px;
    overflow-x: hidden;
    margin: 10px;
    box-sizing: border-box;
    width: calc(100% - 20px);
    padding: 0 10px;

    /* width */
    &::-webkit-scrollbar {
      width: 10px;
    }

    /* Track */
    &::-webkit-scrollbar-track {
      box-shadow: inset 0 0 5px grey;
      border-radius: 10px;
    }

    /* Handle */
    &::-webkit-scrollbar-thumb {
      background: ${japaneseIndigo};
      border-radius: 10px;
    }

    /* Handle on hover */
    &::-webkit-scrollbar-thumb:hover {
      background: ${white};
    }
  }
`;

const StyledTokenOffersItem = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;

  &:not(:nth-last-child(1)) {
    border-bottom: 1px dashed ${japaneseIndigo};
    margin-bottom: 16px;
    padding-bottom: 16px;
  }

  @media (max-width: ${SM_SCREEN - 1}px) {
    flex-direction: column;
  }
`;

const StyledTokenOffersItemPriceToken = styled.div`
  position: relative;
  margin-right: 16px;
`;

const StyledTokenOffersItemPriceTokenNumber = styled.div`
  position: absolute;
  top: calc(50% - 6px);
  left: 0;
  right: 0;
  color: ${darkGoldenrod};
  font-size: 16px;
  font-weight: 800;
`;

const StyledWithMargin = styled.div`
  @media (max-width: ${SM_SCREEN - 1}px) {
    margin-bottom: 10px;
  }
`;

const StyledTokenOffersItemPrice = styled(StyledWithMargin)`
  display: flex;
  align-items: center;
  font-size: 21px;

  @media (max-width: ${SM_SCREEN - 1}px) {
    font-size: 17px;
  }

  @media (min-width: ${SM_SCREEN}px) {
    flex-basis: 165px;
  }
`;

const StyledTokenOffersItemSavings = styled(StyledWithMargin)`
  font-weight: 600;
  font-size: 14px;
`;

const StyledTokenSubnote = styled(StyledWithMargin)`
  font-size: 10px;
  margin-top: 20px;
  margin-bottom: 30px;
`;

const StyledTokenLinkWrapper = styled(StyledWithMargin)`
  margin-top: 36px;
  margin-bottom: 8px;
`;

const StyledTokenLink = styled.a`
  font-size: 13px !important;
  color: ${prosperBoxRed};
`;

const StyledTokenOffersItemButton = styled.div`
  button {
    &.clink-button {
      min-width: auto;
      width: 107px;
      height: 44px;
      box-sizing: border-box;
      font-size: 14px;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      background-color: ${prosperBoxRed};
      border-color: ${prosperBoxRed};
    }
  }
`;

const StyledTokenGreenText = styled.span`
  ${(props) => props.fontWeight && `font-weight: ${props.fontWeight};`}
  color: ${prosperBoxGreen};
  margin-left: 6px;
  white-space: nowrap;
`;

const StyledH1 = styled.h1`
  font-size: 21px !important;
  display: flex;
  flex-wrap: wrap;
  @media (max-width: ${SM_SCREEN - 1}px) {
    padding-left: 10px;
    padding-right: 10px;
    font-size: 17px !important;
  }
`;

const StyledTokenRedText = styled.span`
  color: ${prosperBoxRed};
`;

const StyledNeedHelpWrapper = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;

  @media (max-width: ${MD_SCREEN - 1}px) {
    max-width: 85px;
  }
`;

const StyledNeedHelpDescription = styled.div`
  font-size: 15px;
  font-weight: 300;
  margin-right: 16px;

  @media (max-width: ${MD_SCREEN - 1}px) {
    font-size: 7px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-right: 7px;
    line-height: 1.4;
  }
`;

const StyledNeedHelpBold = styled.b`
  font-weight: bold;
`;

const StyledNeedHelpLigament = styled.span`
  font-weight: 300;
  color: ${black}!important;

  @media (max-width: ${MD_SCREEN - 1}px) {
    display: none;
  }
`;

export {
  StyledModalContent,
  StyledTokenModalText,
  StyledSuccesContent,
  StyledSuccesContentDescription,
  StyledSuccesContentChecked,
  StyledSuccesContentStripe,
  StyledTokenOffers,
  StyledTokenOffersItem,
  StyledTokenOffersItemPrice,
  StyledTokenOffersItemPriceToken,
  StyledTokenOffersItemPriceTokenNumber,
  StyledTokenOffersItemSavings,
  StyledTokenOffersItemButton,
  StyledTokenGreenText,
  StyledH1,
  StyledTokenSubnote,
  StyledTokenLinkWrapper,
  StyledTokenLink,
  StyledTokenRedText,
  StyledNeedHelpWrapper,
  StyledNeedHelpDescription,
  StyledNeedHelpBold,
  StyledNeedHelpLigament,
};
