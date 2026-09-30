import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { blueMagentaViolet, prosperBoxGrayText, darkJungleGreen } =
  CONSTANTS.colors.general;
const { MD_SCREEN } = CONSTANTS.dimensions;

const StyledRegisteredWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  padding-top: 22px;
  justify-content: start;

  .card__item {
    flex-direction: column;
    align-items: baseline;
    justify-content: space-between;
    ${(p) =>
      p.version === 'v2' &&
      `
      display: flex;
      justify-content: flex-start;
    `}

    .card__item--title {
      margin-bottom: 0;
    }

    ${(p) =>
      p.version === 'v2' &&
      `
      .card__item--image {
        width: 100%
      }
    `}

    .card__item--body {
      ${(p) =>
        p.version === 'v1' &&
        `
        height: calc(100% - 321px);
      `}
      display: flex;
      flex-direction: column;
      justify-content: space-around;

      ${(p) =>
        p.version === 'v2' &&
        `
        flex: 1;
        justify-content: flex-start;
        width: 90%;
      `}
      .link-wrapper {
        padding-top: 0;
        ${(p) =>
          p.version === 'v1' &&
          `
        padding-bottom: 50px;
        `}
      }

      @media (max-width: ${MD_SCREEN - 1}px) {
        height: unset;
        .link-wrapper {
          padding: 0px;
        }
      }
    }
    .card__item--info-line {
      ${(p) =>
        p.version === 'v2' &&
        `
         &:last-child {
          margin-top: auto;
          margin-bottom: 0;
          padding-top: 20px;
          .link-wrapper a {
            margin-bottom: 0;
          }
         }
      `}
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

  .badge-wrapper {
    position: relative;

    .prosper-tooltip-content {
      display: none;
    }

    &:hover {
      .prosper-tooltip-content {
        display: block;
        position: absolute;
        background-color: ${darkJungleGreen};
        max-width: 270px;
        font-size: 11px;
        padding: 12px 10px;
        border-radius: 4px;
        top: 27px;
        left: 0;
        z-index: 1;

        &:after {
          content: '';
          position: absolute;
          bottom: 100%;
          margin-left: -6px;
          border-width: 5px;
          border-style: solid;
          border-color: transparent transparent ${darkJungleGreen} transparent;
        }

        .prosper-tooltip-content-row {
          display: flex;
          flex-wrap: nowrap;
          margin: 7px;
          text-transform: none;

          span {
            margin-left: 5px;
            font-weight: 300;
            color: ${prosperBoxGrayText};
          }
        }
      }
    }
  }
`;

export { StyledRegisteredWrapper };
