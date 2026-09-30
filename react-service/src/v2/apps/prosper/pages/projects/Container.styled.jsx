import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { SM_SCREEN, MD_SCREEN, LG_SCREEN } = CONSTANTS.dimensions;

// TODO: migrate this to MUI and refactor: get rid of class base CSS solution
const StyledContainer = styled.div`
  max-width: 1330px;
  margin-left: auto;
  margin-right: auto;

  ${(props) => (props.align ? `${props.align};` : ``)}

  .clink-status {
    margin: 20px 0px;
  }
  .table-container {
    width: 100%;
  }

  &.find-opportunities-filters,
  &.registered-filters {
    .filters {
      @media (max-width: ${MD_SCREEN - 1}px) {
        flex-wrap: nowrap;
        padding: 6px 10px;
        width: 100%;
        width: -moz-available;
        width: -webkit-fill-available;
        width: fill-available;
      }

      @media (max-width: ${SM_SCREEN - 1}px) {
        flex-wrap: nowrap;
      }

      .label-filters {
        flex-basis: 100%;

        @media (max-width: ${MD_SCREEN - 1}px) {
          flex-basis: 19%;
          min-width: 50px;
          width: unset;
          font-size: 11px;
          white-space: nowrap;
        }

        @media (max-width: ${MD_SCREEN - 1}px) {
          flex-basis: 50%;
        }
      }

      .filter-field {
        min-width: 136px;
        flex-basis: 24%;
        box-sizing: border-box;

        @media (max-width: ${MD_SCREEN - 1}px) {
          flex-basis: 19%;
          min-width: unset;
          width: unset;
          font-size: 10px;
        }
      }
    }
  }

  &.registered-filters {
    .filters {
      .filter-field {
        @media (max-width: ${SM_SCREEN - 1}px) {
          max-width: 115px !important;
        }
      }
    }
  }

  &.enquiries-filters {
    margin-bottom: 200px;
    min-height: 750px;

    .filters {
      @media (max-width: ${SM_SCREEN - 1}px) {
        flex-wrap: nowrap;
        padding-left: 4px;
      }

      .label-filters {
        @media (max-width: ${LG_SCREEN - 1}px) {
          font-size: 11px;
        }

        @media (max-width: ${SM_SCREEN - 1}px) {
          padding-left: 10px;
          flex: auto;
        }
      }

      .filter-field {
        width: 130px;

        @media (max-width: ${SM_SCREEN - 1}px) {
          width: initial;
          flex-basis: 49%;
        }

        &:nth-of-type(2) {
          width: 80px;

          @media (max-width: ${LG_SCREEN - 1}px) {
            max-width: 80px;
            min-width: auto;

            & > span {
              overflow: hidden;
              line-height: 1.5;
            }
          }

          @media (max-width: ${MD_SCREEN - 1}px) {
            max-width: 65px;
          }
        }
      }

      .max-width-filter {
        @media (max-width: ${LG_SCREEN - 1}px) {
          font-size: 10px;
        }
      }
    }
  }

  &.enquiries-filters,
  &.registered-filters,
  &.find-opportunities-filters {
    .filters {
      .filter-field {
        position: relative;
        padding-left: 0;
        box-sizing: border-box;
        padding-right: 30px;
        justify-content: flex-start;
        padding-left: 18px;
        font-weight: 100;

        @media (max-width: ${MD_SCREEN - 1}px) {
          padding-right: 20px;
          padding-left: 8px;
        }

        @media (max-width: ${SM_SCREEN - 1}px) {
          min-width: 60px;
          max-width: 90px;
        }

        .max-width-filter {
          max-width: 130px;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
          line-height: 1.5;

          @media (max-width: ${MD_SCREEN - 1}px) {
            overflow: unset;
          }

          @media (max-width: ${SM_SCREEN - 1}px) {
            overflow: hidden;
          }
        }

        .clink-dropdown {
          position: absolute;
          right: 0;

          @media (max-width: ${MD_SCREEN - 1}px) {
            width: 20px;
          }
        }
      }
    }
  }

  &.registered-filters {
    .filters {
      .filter-field {
        @media (max-width: ${SM_SCREEN - 1}px) {
          min-width: 100px;
          max-width: 115px;
        }
      }
    }
  }
`;

const StyledEnquiryModal = styled.div`
  button.auto-open-btn {
    display: none;
  }
`;

export default StyledContainer;
export { StyledEnquiryModal };
