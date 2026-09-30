import styled from 'styled-components';
import * as Yup from 'yup';
import { CONSTANTS } from 'clink-components';
import { ValidationSchemes } from '../../../../../global/services/clink';
import {
  DATE_FORMAT,
  DATE_FORMAT_PLACEHOLDER,
} from '../../../../../global/helpers/constants';

const { clinkLightPurple } = CONSTANTS.colors.general;

const Wrapper = styled.div`
  height: 114px;
  padding: 21px 116px;
  background-color: #ededf5;
  border: 1px solid ${clinkLightPurple};
  display: flex;
  justify-content: space-between;
  form {
    width: 100%;
    svg {
      &.calendar,
      &.angle-down {
        top: 11px;
      }
    }
    &:first-child {
      margin-right: 21px;
    }
    .react-datepicker-popper {
      z-index: 111;
      .navigation--current-month {
        line-height: 4;
      }
    }
    .clink-form__label-error.form-label {
      display: flex;
      justify-content: space-between;
      .invalid-feedback {
        font-size: 14px;
        margin-top: 0;
      }
    }
  }
  @media (max-width: 768px) {
    height: 214px;
    padding: 21px;
    flex-direction: column;
    form {
    &:first {
      margin-right: 0;
    }
  }
`;

const validateSchema = (fieldName) =>
  Yup.object().shape({
    [fieldName]: ValidationSchemes.dateExpired,
  });

const callback = (dateObj, service, pack) => {
  const { fieldName, val } = dateObj;
  return (
    validateSchema(fieldName)
      .validate({ [fieldName]: val })
      .then(() =>
        service
          .updateTender({
            [fieldName]: val,
            tid: pack.id,
            state: pack.state,
          })
          // eslint-disable-next-line no-console
          .catch(console.error),
      )
      // eslint-disable-next-line no-console
      .catch(console.error)
  );
};

const formFields = [
  {
    key: 'tenderReturnDate',
    type: 'text',
    name: 'tenderReturnDate',
    label: 'Tender return date',
    className: 'tender-return-date',
    dateFormat: DATE_FORMAT,
    placeholder: DATE_FORMAT_PLACEHOLDER,
    calendar: true,
    required: true,
    labelError: true,
  },
  {
    key: 'tenderStartDate',
    type: 'text',
    name: 'tenderStartDate',
    label: 'Start on site',
    className: 'tender-start-date',
    dateFormat: DATE_FORMAT,
    placeholder: DATE_FORMAT_PLACEHOLDER,
    calendar: true,
    required: true,
    labelError: true,
  },
];

export { callback, validateSchema, formFields, Wrapper };
