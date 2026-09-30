import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { prosperCursorGray, prosperCursorGrayDark } = CONSTANTS.colors.prosper;
const { japaneseIndigo } = CONSTANTS.colors.general;

const StyledDescriptionItem = styled.div`
  display: flex;
  flex-flow: wrap;
`;

const StyledDescriptionItemContent = styled(StyledDescriptionItem)`
  width: 100%;

  &.description-box {
    .text-editor {
      box-sizing: border-box;
      height: 652px;

      .quill.top-toolbar {
        height: 100%;
      }

      .quill {
        .ql-container {
          max-height: 600px;
          padding: 10px;

          .ql-editor {
            overflow-x: hidden;
            overflow-y: scroll;

            p {
              max-width: 476px;
            }

            /* width */
            &::-webkit-scrollbar {
              width: 10px;
            }

            /* Track */
            &::-webkit-scrollbar-track {
              border-radius: 10px;
              background: ${prosperCursorGray};
            }

            /* Handle */
            &::-webkit-scrollbar-thumb {
              background: ${prosperCursorGrayDark};
              border-radius: 10px;
            }

            /* Handle on hover */
            &::-webkit-scrollbar-thumb:hover {
              background: ${japaneseIndigo};
            }
          }
        }
      }
    }
  }

  .clink-form__input {
    flex: 1;
  }
`;

export { StyledDescriptionItem, StyledDescriptionItemContent };
