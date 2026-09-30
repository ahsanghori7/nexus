import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';
import StyledPage from 'v2/apps/shared/styled/Page.styled';

const {
  prosperBoxShadow,
  prosperGrayBorder,
  prosperRedBorder,
  prosperBoxRed,
  fog,
} = CONSTANTS.colors.prosper;
const { white, japaneseIndigo } = CONSTANTS.colors.general;
const { avantGardeGothicPRO } = CONSTANTS.fonts;
const { MD_SCREEN, LG_SCREEN, XL_SCREEN } = CONSTANTS.dimensions;

const StyledContainer = styled(StyledPage)`
  display: grid;
  grid-template-columns: minmax(390px, 435px) minmax(390px, 435px) minmax(
      390px,
      435px
    );
  gap: 17px;
  ${(p) =>
    p.columns &&
    `
  grid-template-areas:
    'one two three'
    'one two three';
  grid-template-rows: minmax(716px, 716px);
  @media (max-width: ${XL_SCREEN - 1}px) {
    grid-template-areas:
      'one'
      'two'
      'three';
    grid-template-columns: minmax(390px, 435px);
  }
  @media (max-width: ${LG_SCREEN - 1}px) {
    grid-template-rows: minmax(500px, 500px);
  }
  @media (max-width: ${MD_SCREEN - 1}px) {
    grid-template-columns: minmax(250px, 390px);
  }
  `}
  ${(p) =>
    p.grid &&
    `
  grid-template-areas:
    'one four two'
    'one four two'
    'one four three'
    'one four three'
    'five four three'
    'five four three'
  ;
  grid-template-rows: minmax(312px, 312px);
  @media (max-width: ${XL_SCREEN - 1}px) {
    grid-template-areas:
      'one'
      'one'
      'five'
      'five'
      'four'
      'four'
      'two'
      'three'
    ;
    grid-template-columns: minmax(390px, 435px);
  }
  @media (max-width: ${LG_SCREEN - 1}px) {
    padding-top: 20px;
  }
  @media (max-width: ${MD_SCREEN - 1}px) {
    grid-template-columns: minmax(250px, 390px);
  }
  `}
`;

const StyledItem = styled.div`
  ${(p) => p.one && `grid-area: one;`}
  ${(p) => p.two && `grid-area: two;`}
  ${(p) => p.three && `grid-area: three;`}
  ${(p) => p.four && `grid-area: four;`}
  ${(p) => p.five && `grid-area: five;`}
  ${(p) => p.six && `grid-area: six;`}
`;

const StyledContent = styled.div`
  padding: 32px 35px;
  background-color: ${white};
  border: 1px solid ${prosperGrayBorder};
  border-radius: 6px;
  box-shadow: 0 0 9px ${prosperBoxShadow};
  max-height: 617px;
  min-height: 617px;

  @media (max-width: ${XL_SCREEN - 1}px) {
    ${(p) =>
      p.marginBottom &&
      `
      margin-bottom: ${p.marginBottom}px;
    `}
  }

  @media (max-width: ${LG_SCREEN - 1}px) {
    max-height: 350px;
    min-height: 350px;
    ${(p) =>
      p.hasFooter &&
      `
      max-height: 385px;
      min-height: 385px;
    `}
  }
  ${(p) =>
    p.height &&
    `
    max-height: ${p.height}px;
    min-height: ${p.height}px;
  `}
  ${(p) =>
    p.resources &&
    `
    background: transparent linear-gradient(180deg, ${white} 75%, ${fog} 100%) 0% 0% no-repeat padding-box;
    padding: 35px 51px;
    max-height: 233px;
    min-height: 233px;
    @media (max-width: ${LG_SCREEN - 1}px) {
      max-height: 200px;
      min-height: 200px;
      padding: 15px 29px;
    }
  `}
  ${(p) =>
    p.stories &&
    `
    padding: 31px 0px 17px;
    .clink-carousel {
      .carousel.carousel-slider > .control-arrow {
        top: 35%;
      }
    }
    max-height: 212px;
    min-height: 212px;
    @media (max-width: ${LG_SCREEN - 1}px) {
      max-height: 171px;
      min-height: 171px;
      padding: 24px 0px 13px;
    }
  `}
`;

const StyledFooter = styled.div`
  text-align: center;
  button {
    font-family: ${avantGardeGothicPRO};
    width: 200px;
    font-size: 17px;
    padding: 0;
    height: 42px;
    font-family: inherit;
    font-weight: normal;
    &:hover: {
      background-color: ${prosperRedBorder};
    }
  }
`;

const Slide = styled.div`
  height: 212px;
  @media (max-width: ${LG_SCREEN - 1}px) {
    height: 180px;
  }
  ${(p) =>
    p.src &&
    `
      background-image: url("${p.src}");
      background-repeat: no-repeat, repeat;
      background-size: contain;
      background-position-x: 18px;
    `}
`;

const Content = styled.div`
  max-width: 200px;
  width: 100%;
  float: right;
  position: relative;
  right: 63px;
  @media (max-width: ${MD_SCREEN - 1}px) {
    max-width: 158px;
    top: 9px;
    right: 38px;
  }
`;

const QuottedParagraph = styled.p`
  font-family: ${avantGardeGothicPRO};
  display: flex;
  .lazy-load-image-loaded {
    height: 25px;
    img {
      width: 38px;
      @media (max-width: ${MD_SCREEN - 1}px) {
        width: 29px;
      }
    }
    &:last-child {
      align-self: self-end;
    }
  }
`;

const QuottedParagraphText = styled.span`
  text-align: initial;
  font-family: ${avantGardeGothicPRO};
  text-align: left;
  letter-spacing: -0.27px;
  font-style: oblique;
  font-size: 19px;
  font-weight: 300;
  color: ${japaneseIndigo};
  line-height: 25px;
  strong {
    font-weight: 700;
    white-space: nowrap;
  }
  @media (max-width: ${MD_SCREEN - 1}px) {
    font-size: 14px;
    line-height: 17px;
  }
`;

const QuottedParagraphSubtext = styled.p`
  text-align: left;
  letter-spacing: -0.05px;
  color: ${japaneseIndigo};
  font-size: 12px;
  font-weight: 400;
  font-family: ${avantGardeGothicPRO};
  margin: 32px 0 11px;
  text-align: right;
  @media (max-width: ${MD_SCREEN - 1}px) {
    font-size: 10px;
  }
`;

const SubtextStrong = styled.strong`
  color: ${prosperBoxRed};
`;

const ButtonWrapper = styled.p`
  button {
    font-family: ${avantGardeGothicPRO};
    border-radius: 5px;
    opacity: 1;
    height: 36px;
    max-width: 157px;
    width: 100%;
    font-size: 12px;
    @media (max-width: ${LG_SCREEN - 1}px) {
      font-size: 9px;
      height: 29px;
      max-width: 115px;
    }
  }
  ${(p) =>
    p.success &&
    `
    text-align: right;
  `}
  ${(p) =>
    p.resources &&
    `
    text-align: right;
  `}
`;

const PinkHighlight = styled.strong`
  color: ${prosperBoxRed};
`;

const ResourceContent = styled.div`
  ${(p) =>
    p.src &&
    `
    background-image: url("${p.src}");
    background-repeat: no-repeat, repeat;
    background-size: contain;
    background-position: center;
    max-height: 251px;
    min-height: 251px;
    @media (max-width: ${LG_SCREEN - 1}px) {
      max-height: 200px;
      min-height: 200px;
    }
  `}
  display: flex;
  align-items: end;
  justify-contenend;
  justify-content: flex-end;
`;

export default StyledContainer;
export {
  StyledItem,
  StyledContent,
  StyledFooter,
  Slide,
  Content,
  QuottedParagraph,
  QuottedParagraphText,
  QuottedParagraphSubtext,
  SubtextStrong,
  ButtonWrapper,
  PinkHighlight,
  ResourceContent,
};
