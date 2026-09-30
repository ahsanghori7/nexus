import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { sofia, proxima_nova1, proxima_nova2 } = CONSTANTS.fonts;
const { LG_SCREEN, XLH_SCREEN } = CONSTANTS.dimensions;
const {
  clinkPurple,
  white,
  clinkLightPurple,
  darkCharcoal,
  clinkLightGray,
  clinkBackgroundPurple,
  eerieBlack,
} = CONSTANTS.colors.general;

const StyledPageTitle = styled.h1`
  font-size: 32px;
  color: ${darkCharcoal};
  margin-bottom: 36px;
  font-family: ${sofia}, sans-serif;
  font-weight: 500;
`;

const StyledPageSubtitle = styled.h2`
  font-size: 24px;
  color: ${clinkPurple};
  margin: 12px 0 24px;
  font-family: ${sofia}, sans-serif;
  font-weight: 500;
`;

const StyledProjectsContainer = styled.div`
  background-color: ${clinkBackgroundPurple};
  padding-bottom: 160px;

  .team-card-container {
    height: auto;
    display: flex;
    flex-wrap: wrap;
    padding-right: 0;

    @media (min-width: ${LG_SCREEN}px) {
      flex-basis: 50%;
      display: flex;
      align-content: center;
      justify-content: space-around;
    }

    @media (max-width: ${XLH_SCREEN - 1}px) {
      flex-basis: 100%;
    }

    .card__item--subtitle {
      text-align: left;
      font-family: ${proxima_nova1}, ${proxima_nova2} !important;
      font-weight: 600;
      font-size: 16px;
      letter-spacing: 0px;
      color: ${eerieBlack};
      opacity: 1;
    }
  }

  .project-management--wrapper,
  .project-name--wrapper {
    margin-bottom: 20px;

    .project-management--body,
    .project-name--body {
      min-width: auto;
    }

    &.coming-soon {
      position: relative;

      &:before {
        content: 'Coming soon';
        z-index: 2;
        position: absolute;
        top: 10px;
        left: calc(50% - 100px);
        background-color: ${clinkLightGray};
        color: ${darkCharcoal};
        padding: 20px;
        border-radius: 10px;
        font-size: 24px;
        text-transform: uppercase;
        padding: 10px 20px;
        font-family: ${sofia}, sans-serif;
        font-weight: 500;
      }

      &:after {
        content: '';
        z-index: 1;
        position: absolute;
        width: 100%;
        height: 100%;
        background-color: ${white};
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        opacity: 0.8;
        border-radius: 6px;
      }
    }
  }

  .project-name--wrapper {
    padding: 0 20px;

    .project-name--body {
      padding: 0;
    }
  }

  .project-management--wrapper {
    .project-management--body {
      padding: 0;
      border: none;
      box-shadow: none;
    }

    .card__item {
      cursor: pointer;
    }
  }
`;

const StyledProjectsContentDesktop = styled.div`
  display: flex;
  justify-content: space-between;

  @media (max-width: ${XLH_SCREEN - 1}px) {
    flex-direction: column;
    padding-left: 20px;
  }
`;

const StyledDropdownContent = styled.div`
  margin: -16px -8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: visible;

  &:after {
    content: '';
    width: 10px;
    height: 10px;
    background-color: ${white};
    border: 1px solid ${clinkLightPurple};
    position: absolute;
    top: -6px;
    transform: rotate(45deg);
    border-bottom: none;
    border-right: 0;
    right: 14px;
  }

  a {
    &:not(:last-child) {
      border-bottom: 1px solid ${clinkLightPurple};
    }
    padding: 14px;
    text-decoration: none;
    color: ${darkCharcoal};
    font-size: 14px;
    font-weight: bold;
  }
`;

export {
  StyledPageTitle,
  StyledProjectsContainer,
  StyledPageSubtitle,
  StyledDropdownContent,
  StyledProjectsContentDesktop,
};
