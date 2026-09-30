import React, { useState } from 'react';
import PropTypes from 'prop-types';
import isNil from 'lodash/isNil';
import DatePicker, { registerLocale, setDefaultLocale } from 'react-datepicker';
import en from 'date-fns/locale/en-GB';
import DateInput from './Input';
import CalendarHeader from './CalendarHeader';
import 'react-datepicker/dist/react-datepicker.css';
import { getDateValuesV1 } from 'v2/helpers/date';

registerLocale('en', en);
setDefaultLocale(en);

function getFormattedValue(value) {
  return value && typeof value === 'string'
    ? getDateValuesV1(value, true)
    : value;
}

const Datepicker = (props) => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    input,
    minDate = null,
    maxDate = null,
    setHasError = null,
    dateFormat = 'dd-MM-yyyy',
    field: propField,
    handleChange,
    callback,
    value: propValue = null,
    notCloseOnClickOutside = false,
    FormModal = null,
    Aux = null,
    isClearable = false,
    portalId = null,
    CustomContent = null,
    message = '',
    highlightProp = {},
  } = props;

  let formattedValue = getFormattedValue(propValue);
  formattedValue = !formattedValue ? null : formattedValue;
  const onChange = (field, value) => {
    if (setHasError) {
      setHasError(false);
    }

    if (!isNil(handleChange)) {
      handleChange(field.name, getFormattedValue(value));
      if (!isNil(callback)) {
        callback({
          fieldName: field.name,
          val: getFormattedValue(value),
        });
      }
    }
  };
  const manualOpening = {};
  if (notCloseOnClickOutside) {
    manualOpening.open = isOpen;
    manualOpening.onInputClick = () => setIsOpen(!isOpen);
  }

  return typeof formattedValue === 'string' ? (
    <DateInput
      input={input}
      value={formattedValue}
      highlightProp={highlightProp}
    >
      <button
        onClick={() => onChange(input.name, null)}
        type="button"
        className="react-datepicker__close-icon"
      />
    </DateInput>
  ) : (
    <>
      <DatePicker
        dateFormat={dateFormat}
        {...propField}
        {...input}
        popperProps={{
          positionFixed: true,
        }}
        portalId={portalId || undefined}
        selected={formattedValue}
        onChange={(val) => {
          onChange(input, val);
          if (notCloseOnClickOutside) {
            setIsOpen(false);
          }
        }}
        isClearable={isClearable}
        customInput={<DateInput input={input} highlightProp={highlightProp} />}
        minDate={minDate}
        maxDate={maxDate}
        renderCustomHeader={(datePickerProps) => (
          <CalendarHeader
            {...datePickerProps}
            fieldName={input.name}
            onChange={onChange}
            message={message}
            CustomContent={CustomContent}
          />
        )}
        {...manualOpening}
      >
        {FormModal && <FormModal {...manualOpening} />}
      </DatePicker>
      {Aux && <Aux />}
    </>
  );
};

Datepicker.propTypes = {
  input: PropTypes.object.isRequired,
  minDate: PropTypes.instanceOf(Date),
  maxDate: PropTypes.instanceOf(Date),
  setHasError: PropTypes.func,
  dateFormat: PropTypes.string,
  field: PropTypes.object,
  handleChange: PropTypes.func,
  callback: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  notCloseOnClickOutside: PropTypes.bool,
  FormModal: PropTypes.elementType,
  Aux: PropTypes.elementType,
  isClearable: PropTypes.bool,
  portalId: PropTypes.string,
  CustomContent: PropTypes.elementType,
  message: PropTypes.string,
  highlightProp: PropTypes.object,
};

export default Datepicker;
