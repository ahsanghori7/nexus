import React from 'react';
import Button from 'react-bootstrap/Button';
import { faAngleRight, faAngleLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const CalendarHeader = ({
  date,
  message,
  fieldName,
  decreaseMonth,
  increaseMonth,
  prevMonthButtonDisabled,
  nextMonthButtonDisabled,
  CustomContent = null,
  onChange = () => null,
}) => (
  <div className="navigation">
    <Button
      size="sm"
      type="button"
      className="navigation--previous"
      onClick={decreaseMonth}
      disabled={prevMonthButtonDisabled}
    >
      <FontAwesomeIcon icon={faAngleLeft} />
    </Button>
    <div className="navigation--custom-content">
      <span className="navigation--current-month">
        {date.toLocaleString('en-US', {
          month: 'long',
          year: 'numeric',
        })}
      </span>
      {Boolean(CustomContent) && (
        <CustomContent name={fieldName} onChange={onChange} message={message} />
      )}
    </div>
    <Button
      size="sm"
      type="button"
      className="navigation--next"
      onClick={increaseMonth}
      disabled={nextMonthButtonDisabled}
    >
      <FontAwesomeIcon icon={faAngleRight} />
    </Button>
  </div>
);

export default CalendarHeader;
