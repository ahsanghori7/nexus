import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { white, clinkGreen, ruby, eerieBlack, clinkPurple2 } =
  CONSTANTS.colors.general;
const { XL_SCREEN, LG_SCREEN, MD_SCREEN, SM_SCREEN } = CONSTANTS.dimensions;
const { proxima_nova1, proxima_nova2 } = CONSTANTS.fonts;

const StyledAddNewWrapper = styled.div`
  width: 100%;
  gap: 19px;
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: space-between;
  box-sizing: border-box;
  padding: 20px 4px;
  flex-wrap: nowrap;
  align-items: baseline;

  @media (max-width: ${LG_SCREEN - 1}px) {
    flex-direction: column;
    align-items: center;
  }
`;

const StyledinstructionColumn = styled.div`
  label {
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 14px;
    margin-top: 14px;
  }
`;

const StyledDropdownColumn = styled(StyledinstructionColumn)`
  flex-basis: 26%;

  @media (min-width: ${LG_SCREEN}px) {
    min-height: 280px;
  }

  @media (max-width: ${LG_SCREEN - 1}px) {
    width: 100%;
    flex-basis: 100%;
  }
`;

const StyledAddDescriptionColumn = styled(StyledinstructionColumn)`
  flex-basis: 48%;
  padding-left: 10px;
  padding-right: 10px;
  max-width: 32vw;

  @media (max-width: ${LG_SCREEN - 1}px) {
    max-width: 100%;
    width: 100%;
    flex-basis: 100%;
    padding-left: 0;
    padding-right: 0;
  }

  label {
    position: relative;

    &:after {
      content: '*';
      margin-left: 4px;
      font-size: 14px;
      color: ${ruby};
    }
  }

  .ql-container {
    border-radius: 10px;
    border: 1px solid #ccc;
    overflow-y: auto;
    height: 155px;

    .ql-editor {
      overflow-y: auto;
      height: 100%;
      padding: 12px 15px;
      line-height: 1.42;
      outline: none;
      tab-size: 4;
      -moz-tab-size: 4;
      text-align: left;
      white-space: pre-wrap;
      word-wrap: break-word;

      p {
        font-size: 16px;
        font-weight: 500;
      }
    }
  }

  .ql-toolbar {
    border-radius: 10px 10px 0 0;
    border: 1px solid #ccc;
    border-bottom: none;

    button {
      &.ql-bold,
      &.ql-italic,
      &.ql-underline,
      &.ql-list {
        width: 38px !important;
        margin: 0;
        padding: 3px !important;
        border-right: none !important;
      }

      &.ql-list[value="ordered"] {
        display: none;
      }
    }
  }
`;

const StyledAddAppendixColumn = styled(StyledinstructionColumn)`
  flex-basis: 30%;
  display: flex;
  flex-wrap: wrap;
  align-items: end;

  @media (max-width: ${XL_SCREEN - 1}px) {
    width: 100%;
    max-width: 310px;
    padding: 0 10px;
  }

  @media (max-width: ${SM_SCREEN - 1}px) {
    max-width: 100%;
    padding-left: 0;
    padding-right: 0;
  }
`;

const StyledDropzone = styled.div`
  flex-basis: 100%;
  position: relative;
  .uploading-box {
    display: flex;
    flex-direction: column;
    text-overflow: ellipsis;
    overflow: hidden;
    p {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
`;

const StyledAddButtons = styled.div`
  flex-basis: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 0px;
  margin-top: 90px;

  @media (min-width: ${MD_SCREEN}px) {
    margin-top: 0px;
    margin-bottom: 90px;
  }

  p {
    font-size: 13px;
    text-align: center;
    color: ${eerieBlack};
    opacity: 0.5;
    max-width: 350px;
    margin: 8px 0 30px;
    line-height: 1.4;
    font-weight: 500;
  }
`;

const StyledButtonsWrapper = styled.div`
  display: flex;
  justify-content: center;

  @media (max-width: ${XL_SCREEN - 1}px) {
    flex-direction: column;
  }

  button {
    font-family: ${proxima_nova1}, ${proxima_nova2};
    margin-left: 6px;
    margin-right: 6px;
    font-size: 18px;
    height: auto;
    width: auto;
    padding: 15px 30px;
    min-width: auto;
    font-weight: 600;
    border-radius: 30px;

    &[color='default'] {
      background-color: ${white};
      border-color: ${clinkGreen};
      color: ${clinkGreen};
    }
  }
`;

const StyledBond = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-basis: 20%;
  font-weight: 800;
  height: 45px;

  @media (max-width: ${SM_SCREEN - 1}px) {
    height: auto;
    padding-top: 12px;
    justify-content: start;
  }
`;

const StyledValueColumn = styled.div`
  flex-basis: 40%;
  flex-grow: 1;

  @media (max-width: ${SM_SCREEN - 1}px) {
    height: auto;
    flex-basis: 100%;
  }

  .clink-form__input {
    position: relative;

    .clink-form__error {
      font-size: 11px;
      position: absolute;
      bottom: -14px;
      left: 0;
    }
  }
`;

const StyledValueColumnLeft = styled(StyledValueColumn)`
  .clink-form__input {
    input {
      outline: 0;
    }

    &:after {
      ${(p) =>
        p.content &&
        `
          content: '${p.content}';
        `}
      position: absolute;
      left: 17px;
      top: 58px;
      font-size: 16px;
      white-space: nowrap;
      font-weight: 800;
    }
  }
`;

const StyledValueColumnRight = styled(StyledValueColumn)`
  display: flex;
  align-items: center;
  height: 45px;

  @media (max-width: ${SM_SCREEN - 1}px) {
  }

  .clink-form__input {
    .checkbox-input-wrapper {
      display: flex;
      align-items: center;

      input {
        width: 21px;
        height: 21px;

        &[type='checkbox'] {
          &:before {
            content: '';
            display: block;
            position: absolute;
            width: 24px;
            height: 24px;
            top: 7px;
            left: -1px;
            border: 1px solid ${clinkPurple2};
            border-radius: 4px;
            background-color: ${white};
          }

          &:checked {
            &:before {
              border-color: ${clinkPurple2};
              background-color: ${clinkGreen};
            }

            &:after {
              content: '';
              display: block;
              width: 7px;
              height: 12px;
              border: solid ${white};
              border-width: 0 2px 2px 0;
              -webkit-transform: rotate(45deg);
              -ms-transform: rotate(45deg);
              transform: rotate(45deg);
              position: absolute;
              top: 10px;
              left: 8px;
            }
          }
        }
      }

      div {
        font-size: 13px;
        padding-left: 16px;
        min-width: 80px;
        max-width: 100px;
      }
    }

    .clink-form__error {
      position: absolute;
      top: 27px;
    }
  }
`;

export {
  StyledAddNewWrapper,
  StyledDropdownColumn,
  StyledAddDescriptionColumn,
  StyledAddAppendixColumn,
  StyledDropzone,
  StyledAddButtons,
  StyledButtonsWrapper,
  StyledBond,
  StyledValueColumn,
  StyledValueColumnLeft,
  StyledValueColumnRight,
};
