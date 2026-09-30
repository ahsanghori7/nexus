import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { LG_SCREEN } = CONSTANTS.dimensions;

const StyledLogoWrapper = styled.div`
  display: flex;
  flex-flow: wrap;
  margin-bottom: 30px;
  padding-left: 8px;

  @media (max-width: ${LG_SCREEN - 1}px) {
    padding-left: 0;
    margin-bottom: 20px;
  }
`;

const StyledColumns = styled.div`
  display: flex;
  flex-flow: wrap;
  align-content: start;
  flex: 1;
  box-sizing: border-box;

  @media (max-width: ${LG_SCREEN - 1}px) {
    flex-basis: 100%;
  }

  .panel-wrapper {
    .clink-form__input {
      min-height: auto;
      box-sizing: border-box;

      & > div {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        box-sizing: border-box;
      }

      .panel-body {
        min-width: auto;
      }
    }
  }
`;

const StyledLogoColumnPrimary = styled(StyledColumns)`
  padding-right: 8px;

  @media (max-width: ${LG_SCREEN - 1}px) {
    margin-bottom: 20px;
    padding-right: 0;
  }

  @media (min-width: ${LG_SCREEN}px) {
    flex-basis: calc(100% - 370px);
  }

  .panel-wrapper {
    .panel-body {
      min-height: 300px;

      @media (min-width: ${LG_SCREEN}px) {
        min-height: 350px;
        box-sizing: border-box;
      }

      .panel-body-children {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        .clink-form__input {
          width: 100%;
        }
      }
    }
  }
`;

const StyledLogoColumnSecondary = styled(StyledColumns)`
  padding-left: 8px;

  @media (max-width: ${LG_SCREEN - 1}px) {
    padding-left: 0;
  }

  @media (min-width: ${LG_SCREEN}px) {
    flex-basis: 330px;
  }

  .panel-wrapper {
    .panel-body {
      padding: 26px 30px;
      box-sizing: border-box;
      height: 300px;

      @media (min-width: ${LG_SCREEN}px) {
        height: 350px;
      }

      .panel-body-children {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        .clink-form__input {
          width: 100%;
          padding: 0px !important;
        }
      }
    }
  }
`;

export {
  StyledLogoWrapper,
  StyledLogoColumnPrimary,
  StyledLogoColumnSecondary,
};
