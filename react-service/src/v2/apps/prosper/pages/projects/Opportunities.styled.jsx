import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { japaneseIndigo, blueMagentaViolet, white } = CONSTANTS.colors.general;
const { prosperBoxShadow, prosperGrayBorder } = CONSTANTS.colors.prosper;
const { MD_SCREEN, LG_SCREEN } = CONSTANTS.dimensions;

// TODO: implement styles to sccs OR extract dimmension to a global file
const StyledOpportunities = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding-top: 22px;
  justify-content: start;

  .card__item {
    border: 1px solid ${prosperGrayBorder};
    box-shadow: 0 0 9px ${prosperBoxShadow};
    background-color: ${white};
    flex-direction: column;
    flex-basis: 100%;
    box-sizing: border-box;
    position: relative;

    @media only screen and (min-width: ${MD_SCREEN}px) {
      flex-basis: calc(50% - 9px);
    }

    @media only screen and (min-width: ${LG_SCREEN}px) {
      flex-basis: calc(33.33% - 6px);
    }
  }

  .card__item--body-project {
    font-size: 21px;
    height: 21px;
    text-align: left;
    letter-spacing: -0.23px;
    color: ${blueMagentaViolet};
    opacity: 1;
    margin-bottom: 26px;
  }

  ${(p) =>
    p.justify &&
    `
    justify-content: center;
  `}
`;

const StyledOpportunitiesHeader = styled.div`
  font-size: 18px;

  span {
    display: inline-block;
    font-weight: normal;

    &.two-dots {
      color: ${japaneseIndigo};
      font-weight: normal;
      margin-right: 10px;
      margin-top: 0px;
    }
  }

  .project-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-top: 1px;
  }

  .project-matches {
    font-size: 10px !important;

    span {
      display: contents;
    }

    @media only screen and (min-width: ${MD_SCREEN}px) {
      font-size: 18px !important;

      span {
        font-size: 18px;
      }
    }
  }

  h1 {
    display: inline-flex;
  }

  @media only screen and (min-width: ${MD_SCREEN}px) {
    font-size: 27px;
  }
`;

export default StyledOpportunities;
export { StyledOpportunitiesHeader };
