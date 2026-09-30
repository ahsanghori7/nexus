import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { carretDownGray } = CONSTANTS.s3;
const {
  darkCharcoal,
  white,
  clinkLightPurple,
  lightPeriwinkle,
  eerieBlack,
  clinkBackgroundPurple,
  clinkGreen,
} = CONSTANTS.colors.general;
const { prosperGrayBorder } = CONSTANTS.colors.prosper;
const { LG_SCREEN, SM_SCREEN } = CONSTANTS.dimensions;
const { sofia, proxima_nova1, proxima_nova2 } = CONSTANTS.fonts;

const StyledTeamContainer = styled.div`
  background-color: ${clinkBackgroundPurple};
  min-height: 100vh;
  box-sizing: border-box;

  .team-panel {
    border: 1px solid ${clinkLightPurple} !important;
    border-radius: 8px;
    background-color: ${white};
  }

  .team-panel--wrapper {
    margin-bottom: 20px;

    .team-panel--body {
      padding: 0;
      min-width: auto;
      background-color: transparent;
      border: none !important;
      box-shadow: none !important;
    }
  }
`;

const StyledTeamContent = styled.div`
  max-width: 100%;

  @media (max-width: ${LG_SCREEN - 1}px) {
    margin-left: 0;
    margin-right: 0;
  }

  .autocomplete-input-wrapper {
    position: relative;

    &:after {
      content: url(${carretDownGray});
      right: 20px;
      top: 2px;
      position: absolute;
      pointer-events: none;
      height: 35px;
      display: flex;
      align-items: center;
    }
  }

  .team-panel-invite {
    &--wrapper {
      margin-bottom: 18px;
    }
    &--body {
      &-children {
        border: none !important;
      }
      .clink-form {
        display: flex;
        min-height: auto;
        flex-wrap: wrap;
        align-items: flex-start;

        @media (max-width: ${LG_SCREEN - 1}px) {
          justify-content: space-between;
        }

        .clink-button {
          top: 363px;
          width: 148px;
          height: 40px;
          background: ${clinkGreen};
          border-radius: 40px;
          opacity: 1;
          text-align: center;
          font-family: ${proxima_nova1}, ${proxima_nova2};
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0px;
          color: ${white};
          opacity: 1;
          &:disabled {
            background: ${clinkLightPurple};
          }
          margin-top: 28px;
        }

        .clink-form__input {
          width: 100%;
          max-width: 281px;
          margin-right: 8px;

          &:nth-child(3) {
            position: relative;
            @media (min-width: ${LG_SCREEN - 1}px) {
              margin-right: 17px;
            }
          }

          @media (max-width: ${LG_SCREEN - 1}px) {
            margin-right: 0;
            max-width: 100%;
            max-width: 100%;
            margin-bottom: 20px;
          }

          @media (max-width: ${SM_SCREEN - 1}px) {
            max-width: initial;
            &:not(:first-child) {
              margin-top: 8px;
            }
          }

          label {
            text-align: left;
            font-family: ${proxima_nova1}, ${proxima_nova2};
            letter-spacing: 0px;
            color: ${eerieBlack};
            opacity: 1;
            font-size: 14px;
            margin-bottom: 14px;
            font-weight: 500;
          }

          input {
            background: ${white};
            border: 1px solid ${lightPeriwinkle};
            border-radius: 4px;
            opacity: 1;
            height: 40px;
            text-indent: 1em;
            padding-left: 2px;
            font-weight: 400;
            font-size: 16px;

            &::placeholder {
              text-align: left;
              font-family: ${proxima_nova1}, ${proxima_nova2};
              letter-spacing: 0px;
              color: ${darkCharcoal};
              opacity: 0.47;
              font-size: 16px;
              font-weight: 100;
              opacity: 0.47;
              font-weight: 500;
            }
          }
        }
      }
    }
  }
  .your-team-panel,
  .team-panel-invite {
    &--body {
      padding-top: 24px;
      padding-bottom: 45px;
      @media (max-width: ${LG_SCREEN - 1}px) {
        min-width: initial;
        padding-bottom: 26px;
      }
    }
    &--body,
    &--header {
      border: none !important;
      box-shadow: none !important;
    }
  }
  .your-team-panel--body {
    padding: 0px 32px 20px;

    .your-team-panel--body-children {
      border: none !important;
    }
  }
  .team-panel-invite {
    &--header {
      border-bottom: 1px solid ${clinkLightPurple} !important;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }
  }
`;

const StyledTeamReset = styled.div`
  display: none;
`;

const StyledTeamPanelContent = styled.div`
  padding: 0px;
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;

  .table-container {
    form {
      min-height: unset !important;
      .MuiAutocomplete-clearIndicator {
        display: none;
      }
    }

    table {
      tbody {
        tr {
          td {
            vertical-align: top;
            line-height: 40px;

            .clink-form__input {
              ul {
                position: unset !important;
              }
            }

            img {
              transform: translate(0px, -12px);
            }
          }

          td {
            .clink-form__input {
              & > div {
                ul {
                  border: 1px solid ${lightPeriwinkle};

                  li {
                    min-height: auto;
                    font-size: 16px;
                    padding: 11.5px 16px;
                    background-color: ${white};
                    font-weight: normal;
                    line-height: 20px;

                    &:hover {
                      font-weight: 700;
                      background-color: ${clinkBackgroundPurple};
                    }

                    &:not(:last-of-type) {
                      border-bottom: 1px solid ${lightPeriwinkle};
                    }
                  }
                }
              }
            }

            .clink-dropdown {
              align-items: center;
              justify-content: center;
              width: unset;

              .clink-dropdown-open {
                box-shadow: none;
                border-radius: 4px;
                height: 40px;
                width: 40px;
                padding: 10px;
                min-width: 40px;
                border: 2px solid ${clinkLightPurple};
                background-color: transparent;
              }
            }
          }
        }
      }
    }
  }
`;

const StyledPageTitle = styled.h1`
  font-size: 32px;
  color: ${darkCharcoal};
  margin-bottom: 36px;
  font-family: ${sofia}, sans-serif;
  font-weight: 500;
`;

const StyledPageSubtitle = styled.h2`
  padding: 19px 24px;
  width: 100%;
  box-sizing: border-box;
  font-size: 18px;
  border-bottom: 1px solid ${clinkLightPurple};
  text-align: left;
  font-family: ${proxima_nova1}, ${proxima_nova2};
  font-weight: 600;
  letter-spacing: 0px;
  color: ${eerieBlack} !important;
  margin-bottom: 0;

  &.bordered-down {
    border-bottom: 1px solid ${prosperGrayBorder};
  }
`;

export {
  StyledTeamContainer,
  StyledPageTitle,
  StyledPageSubtitle,
  StyledTeamPanelContent,
  StyledTeamContent,
  StyledTeamReset,
};
