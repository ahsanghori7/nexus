import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { prosperOrange, prosperOrange2, prosperBoxRed } =
  CONSTANTS.colors.prosper;
const { japaneseIndigo, white, azureishWhite, aliceBlue } =
  CONSTANTS.colors.general;
const { iconSearchGreen } = CONSTANTS.s3;
const { SM_SCREEN, LG_SCREEN } = CONSTANTS.dimensions;

const StyledContainer = styled.div`
  display: flex;
  flex-flow: wrap;

  .panel-wrapper {
    width: 100%;

    @media (max-width: ${SM_SCREEN - 1}px) {
      max-width: calc(100vw - 40px);
    }

    .panel-body {
      min-width: auto;
    }
  }
`;

const StyledPegasusContainer = styled(StyledContainer)`
  .panel-wrapper {
    padding: 24px 0 24px;

    .panel-header {
      margin: 20px 0 24px;

      h2 {
        font-size: 28px;
        font-weight: bold;
      }
    }

    .panel-body {
      padding: 0;
      border: none;
      box-shadow: none;

      .clink-form__input {
        margin-bottom: 22px;

        label {
          font-weight: bold;
          font-size: 16px;
          color: ${japaneseIndigo};
          margin-bottom: 22px;
        }

        input {
          &:focus,
          &:focus-visible {
            border-width: 1px;
          }
        }
      }

      .checkbox-wrapper {
        .clink-form__input {
          display: flex;
          flex-direction: row-reverse;
          justify-content: flex-end;
          align-items: baseline;

          .checkbox-input-wrapper {
            padding-right: 8px;
          }
        }
      }

      .autocomplete-input-wrapper {
        box-sizing: border-box;
      }
    }
  }

  .company-details--wrapper {
    .company-details--body {
      .panel-body-children {
        .clink-form {
          & > div {
            & > div {
              &:nth-of-type(1) {
                padding-right: 30px;

                @media (max-width: ${LG_SCREEN - 1}px) {
                  padding-right: 0px;
                }
              }

              &:nth-of-type(2) {
                padding-left: 30px;

                @media (max-width: ${LG_SCREEN - 1}px) {
                  padding-left: 0px;
                }
              }
            }
          }
        }
      }
    }
  }
`;

const StyledProsperContainer = styled(StyledContainer)`
  max-width: 1330px;
  margin: 26px auto;

  .profile-cover--wrapper {
    .profile-cover--body {
      padding: 0;
      border: none;
      background-color: transparent;
      box-shadow: none;
    }
  }

  .panel-wrapper {
    .panel-header {
      h2 {
        font-size: 19px;
        font-weight: bold;
        margin-bottom: 20px;
        color: ${japaneseIndigo};

        @media (max-width: ${LG_SCREEN - 1}px) {
          font-size: 16px;
          margin-bottom: 16px;
        }
      }
    }

    .panel-body {
      .panel-body-children {
        form {
          & > div {
            & > div {
              &:last-child {
                display: flex;
                align-items: center;
                justify-content: center;
              }
            }
          }

          .clink-form__input {
            padding: 8px;
            position: relative;

            @media (max-width: ${LG_SCREEN - 1}px) {
              flex-basis: 100%;
            }

            input[type='text']:read-only {
              background-color: ${aliceBlue};
            }

            .clink-form__error {
              padding-top: 10px;
              width: 100%;
              font-size: 14px;
              position: absolute;
              bottom: -6px;
              font-size: 11px;
            }

            label {
              font-size: 16px;
              color: ${prosperBoxRed};
              font-weight: bold;
              margin-bottom: 14px;

              @media (max-width: ${LG_SCREEN - 1}px) {
                font-size: 14px;
              }
            }

            input {
              box-sizing: border-box;
              border-radius: 6px;
              height: 48px;
              font-size: 14px;
            }
          }

          .company-logo-input--input-form {
            .dropzone-wrapper-links__link-wrapper {
              max-width: 250px;
            }

            input[type='file'] {
              height: 70%;

              @media (min-width: ${LG_SCREEN}px) {
                height: 80%;
              }
            }
          }

          .company-profile-input--input-form {
            input[type='file'] {
              height: 70%;

              @media (min-width: ${LG_SCREEN}px) {
                height: 65%;
              }
            }
          }
        }
      }
    }
  }
`;

const StyledColumns = styled.div`
  display: flex;
  flex-flow: wrap;
  align-content: start;
  flex: 1;
  box-sizing: border-box;
`;

const StyledPegasusColumn = styled(StyledColumns)`
  @media (max-width: ${LG_SCREEN - 1}px) {
    width: 100%;
    flex-basis: 100%;
  }

  .panel-wrapper {
    &.offering--wrapper {
      @media (min-width: ${LG_SCREEN}px) {
        padding-left: 0;
        padding-right: 30px;
      }

      .panel-body-children {
        & > div {
          & > div {
            width: 100%;
          }
        }

        label {
          font-size: 16px;
          font-weight: bold;
          margin: 8px 0px 10px;
        }

        .autocomplete-input-wrapper {
          border: none;
          box-sizing: border-box;
          display: flex;
          flex-wrap: wrap;
          position: relative;

          &:after {
            content: url(${iconSearchGreen});
            position: absolute;
            left: 13px;
            top: 16px;
          }

          & > div {
            background-color: ${prosperOrange};
            border-radius: 4px;
            color: ${white};
            font-size: 9px;
            padding: 2px 2px 0px;

            svg {
              color: ${white};
              font-size: 14px;
              background-color: ${prosperOrange};
              border: none;
              border-left: 1px solid ${prosperOrange2};
              border-radius: 0;
            }
          }

          .autocomplete-search-input {
            order: -1;
            flex-basis: 100%;
            height: 46px !important;
            border: 1px solid ${azureishWhite} !important;
            border-radius: 10px;
            margin-bottom: 14px;
            padding-left: 40px;
          }
        }
      }
    }

    &.description--wrapper {
      @media (min-width: ${LG_SCREEN}px) {
        padding-left: 30px;
      }
    }
  }
`;

const StyledProsperColumn = styled(StyledColumns)`
  flex-basis: 50%;
  margin-bottom: 20px;
  padding-left: 8px;

  @media (max-width: ${LG_SCREEN - 1}px) {
    flex-basis: 100%;
    padding-left: 0;
    margin-bottom: 0;
  }

  &:first-of-type {
    padding-left: 0;
    padding-right: 8px;

    @media (max-width: ${LG_SCREEN - 1}px) {
      padding-right: 0;
    }
  }

  .panel-wrapper {
    width: 100%;
    height: 100%;

    .panel-body {
      height: calc(100% - 50px);
      padding: 50px;
      box-sizing: border-box;

      @media (max-width: ${LG_SCREEN - 1}px) {
        padding: 30px 16px;
      }
    }
  }
`;

const StyledFull = styled.div`
  width: 100%;
`;

const StyledFullProsper = styled(StyledFull)`
  .offering--wrapper {
    .offering--body {
      padding: 50px;

      @media (max-width: ${LG_SCREEN - 1}px) {
        padding: 30px 16px 12px;
      }
    }
  }
`;

const StyledWrapper = styled.div`
  display: flex;
  flex-flow: wrap;
`;

const StyledInnerWrapper = styled(StyledWrapper)`
  width: 100%;

  .clink-form__input {
    flex: 1;

    .change-mode-btn {
      padding: 0px;
      border: none;
      text-align: start;
      font-size: 14px;
      color: ${prosperBoxRed};
      font-weight: bold;
      text-decoration: underline;
      background-color: transparent;
    }
  }
`;

const StyledWithMarginAndLoader = styled.div`
  position: relative;
  width: 100%;
  margin-top: 30px;

  &.offering-save-column {
    display: flex;
    justify-content: center;
    align-items: center;

    button {
      padding: 10px 20px;
    }
  }

  .my-company-loading {
    position: absolute;
  }
`;

export {
  StyledWrapper,
  StyledInnerWrapper,
  StyledWithMarginAndLoader,
  StyledContainer,
  StyledPegasusContainer,
  StyledProsperContainer,
  StyledColumns,
  StyledPegasusColumn,
  StyledProsperColumn,
  StyledFull,
  StyledFullProsper,
};
