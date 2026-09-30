import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const { prosperBoxGreen, boxInset } = CONSTANTS.colors.prosper;
const { white } = CONSTANTS.colors.general;
const { checkmarkGreen } = CONSTANTS.s3;
const { XL_SCREEN } = CONSTANTS.dimensions;

const StyledCheckboxWrapper = styled.div`
  position: relative;
  flex-basis: 50%;
  display: flex;
  align-items: center;

  @media (max-width: ${XL_SCREEN - 1}px) {
    flex-basis: 100%;
    margin-top: 0;
  }

  .clink-form__input {
    display: flex;
    flex-wrap: nowrap;
    flex-direction: row-reverse;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-left: 30px !important;

    @media (max-width: ${XL_SCREEN - 1}px) {
      padding-left: 4px !important;
      justify-content: flex-start;
    }

    label {
      font-size: 11px !important;
      color: black !important;
      margin-bottom: 0 !important;
      padding-left: 10px;
    }
  }

  [type='checkbox'] {
    width: 24px !important;
    height: 24px !important;
    color: ${prosperBoxGreen} !important;
    vertical-align: middle;
    -webkit-appearance: none;
    background: none;
    border: 0 !important;
    outline: 0;
    flex-grow: 0;
    border-radius: 50%;
    background-color: ${white};
    transition: background 300ms;
    cursor: pointer;
    border-radius: 4px !important;
  }

  [type='checkbox']::before {
    content: '';
    color: transparent;
    display: block;
    width: inherit;
    height: inherit;
    border-radius: inherit;
    border: 0;
    background-color: transparent;
    background-size: contain;
    box-shadow: inset 0 0 0 1px ${boxInset};
  }

  /* Checked */

  [type='checkbox']:checked {
    background-color: currentcolor;
  }

  [type='checkbox']:checked::before {
    box-shadow: none;
    background-image: url(${checkmarkGreen});
    background-color: ${white};
    background-size: 14px;
    background-position: center;
    background-repeat: no-repeat;
    width: 22px;
    height: 22px;
    margin-top: 1px;
    margin-left: 1px;
    border-radius: 3px;
  }
`;

export { StyledCheckboxWrapper };
