import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { prosperOrange, prosperOrange2, prosperBoxRed } =
  CONSTANTS.colors.prosper;
const { white, azureishWhite } = CONSTANTS.colors.general;
const { iconSearchGreen } = CONSTANTS.s3;
const { LG_SCREEN } = CONSTANTS.dimensions;

const StyledOfferingColumns = styled.div`
  display: flex;
  flex-flow: wrap;
  align-content: start;
  flex: 1;
  box-sizing: border-box;
  flex-basis: 33.33%;
  padding: 0 24px;
  box-sizing: border-box;
  margin-bottom: 10px;
  position: relative;

  @media (max-width: ${LG_SCREEN - 1}px) {
    flex-basis: 100%;
    padding: 0;
  }

  #clink-autocomplete-listbox {
    top: 90px;
    width: calc(100% - 49px);
  }

  label {
    font-size: 16px;
    font-weight: bold;
    color: ${prosperBoxRed};

    @media (max-width: ${LG_SCREEN - 1}px) {
      font-size: 14px;
    }
  }

  & > div {
    width: 100%;

    .autocomplete-input-wrapper {
      width: 100%;
      box-sizing: border-box;
      display: flex;
      flex-wrap: wrap;
      border: none;
      position: relative;

      &:after {
        content: url(${iconSearchGreen});
        position: absolute;
        left: 11px;
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
        flex-basis: 100%;
        height: 46px !important;
        order: -1;
        border: 1px solid ${azureishWhite} !important;
        border-radius: 6px;
        margin-bottom: 14px;
        padding-left: 35px;
      }
    }
  }
`;

export { StyledOfferingColumns };
