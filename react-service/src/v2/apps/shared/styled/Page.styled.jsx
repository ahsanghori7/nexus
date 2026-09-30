import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { SM_SCREEN, MD_SCREEN, LG_SCREEN, XL_SCREEN } = CONSTANTS.dimensions;
const { avantGardeGothicPRO } = CONSTANTS.fonts;
const { japaneseIndigo, white, aliceBlue, blueMagentaViolet, christalle } =
  CONSTANTS.colors.general;
const {
  prosperBoxRed,
  bubbles,
  mauve,
  prosperCursorGray,
  prosperCursorGrayDark,
} = CONSTANTS.colors.prosper;

const StyledContainer = styled.div`
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 17px;
  padding: 24px 40px;
  margin: auto;
  max-width: 1358px;

  @media (min-width: ${LG_SCREEN}px) {
    padding: 0;
  }

  @media (max-width: ${XL_SCREEN - 1}px) {
    flex-direction: column;
    align-items: center;
  }

  @media (max-width: ${LG_SCREEN - 1}px) {
    padding: 24px 0px;
  }

  .carousel-root.clink-carousel {
    max-width: 1358px;
    ${(p) =>
      p.winners &&
      p.page &&
      `
    .slider.animated {
      transform: translate3d(-50%, 0px, 0px) !important;
    }`}
    ${(p) =>
      p.winners &&
      !p.page &&
      `
    .slider.animated {
      transform: translate3d(0%, 0px, 0px) !important;
    }`}

    @media (max-width: ${XL_SCREEN + 100}px) {
      max-width: ${XL_SCREEN}px;
    }

    @media (max-width: ${XL_SCREEN - 1}px) {
      max-width: ${XL_SCREEN}px;
    }

    @media (max-width: ${LG_SCREEN - 1}px) {
      max-width: ${LG_SCREEN}px;
    }

    @media (max-width: ${MD_SCREEN - 1}px) {
      max-width: ${MD_SCREEN}px;
    }

    @media (max-width: ${SM_SCREEN - 1}px) {
      max-width: ${SM_SCREEN}px;
    }

    &.carousel-winners {
      padding: 30px 40px 0;
      box-sizing: border-box;

      @media (max-width: ${LG_SCREEN - 1}px) {
        padding: 16px 34px 0;
      }

      @media (max-width: ${SM_SCREEN - 1}px) {
        padding: 16px 20px 0;
      }

      .carousel {
        &.carousel-slider {
          overflow: visible;

          .control-arrow {
            &.control-next {
              right: -32px;
            }

            &.control-prev {
              left: -32px;
            }

            & > span {
              @media (max-width: ${SM_SCREEN - 1}px) {
                transform: translate(0, -20px);
              }
            }
          }
        }
      }
    }
  }
`;

const StyledText = styled.div`
  color: ${japaneseIndigo};
  ${(p) => p.mauve && `color: ${mauve};`}
  font-size: 15px;
  font-weight: 400;
  font-family: ${avantGardeGothicPRO};
  text-align: left;
  letter-spacing: -0.1px;
  opacity: 1;
  ${(p) => p.margin && `margin: ${p.margin};`}
  word-break: break-all;
`;

const StyledParagraph = styled.p`
  margin-bottom: 15px;
  ${(p) => p.noMargin && `margin: 0;`}

  padding: 10px;
  ${(p) => p.padding && `padding: ${p.padding};`}

  ${(p) => p.center && `text-align: center;`}
  letter-spacing: -0.1px;
  line-height: 24px;
  ${(p) => p.fontSize && `font-size: ${p.fontSize};`}
  ${(p) => p.height && `height: ${p.height};`}
  overflow: hidden;
  overflow-y: auto;
  word-break: break-word;

  @media (max-width: ${LG_SCREEN - 1}px) {
    ${(p) => p.mobFontSize && `font-size: ${p.mobFontSize};`}
  }

  /* width */
  &::-webkit-scrollbar {
    width: 12px;
    border-radius: 10px;
  }

  /* Track */
  &::-webkit-scrollbar-track {
    background: ${prosperCursorGray};
    width: 12px;
    border-radius: 10px;
  }

  /* Handle */
  &::-webkit-scrollbar-thumb {
    background: ${prosperCursorGrayDark};
    width: 12px;
    border-radius: 10px;
  }

  /* Handle on hover */
  &::-webkit-scrollbar-thumb:hover {
    width: 12px;
    background: ${prosperCursorGrayDark};
  }
`;

const StyledStrong = styled.strong`
  font-weight: 700;
  ${(p) =>
    p.pink &&
    `
    color: ${prosperBoxRed};
  `}
  ${(p) =>
    p.purple &&
    `
    color: ${blueMagentaViolet};
  `}
  ${(p) =>
    p.white &&
    `
    color: ${white};
  `}
`;

const StyledTitle = styled.h2`
  text-align: left;
  align-self: start;
  width: 100%;
  font-family: ${avantGardeGothicPRO};
  font-size: 27px;
  letter-spacing: -0.3px;
  color: ${japaneseIndigo};
  opacity: 1;
  margin-top: 51px;
  ${(p) =>
    p.white &&
    `
    color: ${white};
  `}

  @media (max-width: ${LG_SCREEN}px) {
    align-self: initial;
    font-size: 18px;
    text-align: center;
    margin-top: 12px;
  }

  @media (min-width: ${LG_SCREEN}px) {
    padding-left: 10px;
  }
`;

const StyledSection = styled.div`
  ${(p) =>
    p.blue &&
    `
    background: transparent linear-gradient(90deg, ${bubbles} 0%, ${aliceBlue} 100%) 0% 0% no-repeat padding-box;
  `}
  ${(p) =>
    p.purple &&
    `
    background: transparent linear-gradient(90deg, ${blueMagentaViolet} 0%, ${christalle} 100%) 0% 0% no-repeat padding-box;
  `}
`;

const Slide = styled.div`
  ${(p) => p.winners && `margin: 0 20px;`}
  ${(p) =>
    p.clients &&
    `
    & > span {
      height: 180px;
      display: flex!important;
      margin: 50px auto 0;

      img {
        margin: auto;
      }

      @media (max-width: ${LG_SCREEN}px) {
        margin-top: 30px;
      }
    }
  `}
  @media (max-width: ${MD_SCREEN}px) {
    margin: 0;
  }
`;

const StyledButton = styled.button`
  padding: 10px !important;
  z-index: 1 !important;

  &::before {
    display: none !important;
  }

  img {
    height: 26px;
  }

  background: none !important;
  bottom: 160px !important;
`;

const Winners = styled.span`
  height: 326.25px;

  & > div {
    width: 100% !important;

    & > div {
      width: 100% !important;
    }
  }

  @media (max-width: ${LG_SCREEN}px) {
    height: 126.25px;
    height: 45vw;

    & > div {
      margin: auto;
    }
  }
`;

const CompanyLink = styled.a`
  text-align: center;
  text-decoration: underline;
  letter-spacing: -0.09px;
  color: ${prosperBoxRed};
`;

export default StyledContainer;
export {
  Slide,
  Winners,
  StyledSection,
  StyledText,
  StyledParagraph,
  StyledStrong,
  StyledTitle,
  StyledButton,
  CompanyLink,
};
