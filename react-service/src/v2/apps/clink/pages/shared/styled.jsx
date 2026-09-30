import styled from 'styled-components';
import { CONSTANTS, Button } from 'clink-components';

const {
  clinkLightPurple,
  clinkPurple,
  white,
  lightPeriwinkle,
  clinkBackgroundPurple,
  eerieBlack,
  darkCharcoal,
} = CONSTANTS.colors.general;
const { proxima_nova1, proxima_nova2 } = CONSTANTS.fonts;

const StyledContainer = styled.div`
  margin-top: 15px;
  background-color: ${clinkBackgroundPurple};
  padding-bottom: 160px;
  min-height: 100vh;
  box-sizing: border-box;

  .add-new-instruction-form {
    width: 100%;
    min-height: 614px;
  }

  .instruction-nr {
    display: flex;
    justify-content: flex-start;

    & > span {
      flex-basis: 50%;
      min-width: 50px;
    }

    .badge-wrapper {
      flex-basis: 50%;
      margin-left: 0;
    }
  }

  .breadcrumbs {
    margin-bottom: 20px;

    .breadcrumb-item {
      padding: 0px;
      margin: 0px;
      font-size: 16px;
      color: ${clinkPurple};
      text-decoration: underline;

      & > div {
        margin-right: 12px;
        margin-left: 20px;
        color: ${darkCharcoal};
        opacity: 0.5;
      }

      &:before {
        content: '';
      }

      &:last-of-type,
      a {
        color: ${clinkPurple};
        text-align: left;
        text-decoration: underline;
        font-family: ${proxima_nova1}, ${proxima_nova2};
        font-weight: 400;
        font-size: 16px;
        letter-spacing: -0.32px;
        opacity: 1;
      }

      &:last-of-type {
        text-decoration: none;
        font-weight: 600;
      }
    }
  }
`;

const StyledContent = styled.div``;

const StyledPanelContent = styled.div`
  margin: 0px;
  padding: 0px;
  display: flex;
  flex-wrap: wrap;
  background-color: transparent;

  .panel-wrapper {
    width: 100%;

    .panel-body {
      border: 1px solid ${clinkLightPurple};
      border-radius: 8px;
      box-shadow: none;
      padding: 0;

      ${(p) =>
        p.transparent &&
        `
        background-color: transparent;
        border: none;
        `}

      .panel-inner--body {
        border: 0;

        .panel-inner--body-children {
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0px 28px;
          ${(p) =>
            p.extraPadding &&
            `
            padding: 20px 28px;
          `}
        }
      }
    }
  }

  .clink-form {
    min-height: unset;

    .quill {
      min-height: 155px;
    }

    .forecast-budget-input {
      padding: 6px 12px;
      height: unset;
      text-indent: 0;
      font-weight: 500;
      font-family: ${proxima_nova1}, ${proxima_nova2};
      font-size: 16px;
      border-radius: 4px;
      border-color: ${lightPeriwinkle};
      color: ${eerieBlack};
    }
  }

  .badge-wrapper {
    display: inline-flex;
    padding: 2px 6px;
    font-size: 12px;
    font-weight: bold;
    border-radius: 4px;
    margin-left: 34px;
    width: unset;
    height: unset;
    text-transform: uppercase;
  }
`;

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 36px;
`;

const StyledPageSubtitle = styled.h2`
  padding: 19px 24px;
  width: 100%;
  box-sizing: border-box;
  font-size: 18px;
  background-color: ${white};
  border-bottom: 1px solid ${clinkLightPurple};
  border-radius: 8px 8px 0px 0px;
  text-align: left;
  font-family: ${proxima_nova1}, ${proxima_nova2};
  font-weight: 600;
  letter-spacing: 0px;
  color: ${eerieBlack} !important;
`;

const StyledButton = styled(Button)`
  &.clink-button {
    font-size: 16px;
    font-weight: 600;
    font-family: ${proxima_nova1}, ${proxima_nova2};
    color: ${white};
    border-radius: 40px;
    padding: 0;
    margin: 0;
    width: 191px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const StyledBigButton = styled(StyledButton)`
  &.clink-button {
    font-size: 18px;
    padding: 0;
    margin: 77px 0px 63px;
    width: 293px;
    height: 56px;
  }
`;

export {
  StyledContainer,
  StyledHeader,
  StyledPageSubtitle,
  StyledPanelContent,
  StyledContent,
  StyledButton,
  StyledBigButton,
};
