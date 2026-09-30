import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { XL_SCREEN, LG_SCREEN } = CONSTANTS.dimensions;

const StyledDetailsColumns = styled.div`
  display: flex;
  flex-flow: wrap;
  align-content: start;
  flex: 1;
  box-sizing: border-box;
  justify-content: space-between;
  padding: 0;

  @media (min-width: ${XL_SCREEN}px) {
    width: 50%;
    min-width: 40%;
  }

  @media (max-width: ${LG_SCREEN - 1}px) {
    width: 100%;
    flex-basis: 100%;
  }

  .two-input-wrapper {
    @media (min-width: ${XL_SCREEN}px) {
      flex-wrap: nowrap;
    }

    .clink-form__input {
      flex-basis: calc(50% - 10px);

      @media (max-width: ${LG_SCREEN - 1}px) {
        flex-basis: 100%;
      }

      &:nth-of-type(1) {
        @media (min-width: ${XL_SCREEN}px) {
          padding-right: 10px;
          box-sizing: border-box;
        }
      }

      &:nth-of-type(2) {
        @media (min-width: ${XL_SCREEN}px) {
          padding-left: 10px;
          box-sizing: border-box;
        }
      }

      input {
        box-sizing: border-box;
      }
    }
  }

  &.company-details-form-wrapper-right {
    .operating-company-address {
      flex-direction: column;
      flex-wrap: unset;
    }
  }
`;

export { StyledDetailsColumns };
