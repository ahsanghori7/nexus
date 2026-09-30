import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { japaneseIndigo, white, aliceBlue, bluishGray } =
  CONSTANTS.colors.general;
const { avantGardeGothicPRO } = CONSTANTS.fonts;
const { XL_SCREEN } = CONSTANTS.dimensions;

const StyledFilter = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100px;
  height: 35px;
  padding-left: 20px;
  background: ${aliceBlue} 0% 0% no-repeat padding-box;
  border-radius: 5px;
  font-family: ${avantGardeGothicPRO};

  .clink-dropdown-open {
    background-color: transparent;
    border: none;
    box-shadow: none;
  }

  &.select-status-table {
    width: 100%;
    min-width: 201px;
    max-width: 201px;
    font-size: 14px;
    background-color: ${white};
    border: 1px solid ${bluishGray};

    &.filter-field--opened {
      border: 1px solid ${japaneseIndigo};
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }

    border-radius: 5px;
    opacity: 1;
    font-weight: 500;
    justify-content: space-between;
    height: 45px;

    .select-status-table--dropdown {
      button {
        padding-right: 15px;

        @media (max-width: ${XL_SCREEN - 1}px) {
          padding-right: 0;
        }

        img {
          width: 13.62px;
        }
      }
    }

    @media (max-width: ${XL_SCREEN - 1}px) {
      min-width: 80px;
      max-width: 80px;
      min-height: 28px;
      max-height: 28px;

      font-size: 10px;
      padding-left: 6px;
      padding-top: 2px;
      box-sizing: border-box;

      .select-status-table--dropdown {
        button {
          img {
            width: 9px;
            margin-bottom: 3px;
            margin-left: 12px;
          }
        }
      }
    }
  }
`;

export default StyledFilter;
