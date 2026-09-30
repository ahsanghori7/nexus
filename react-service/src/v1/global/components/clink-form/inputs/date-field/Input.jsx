import React, { forwardRef } from 'react';
import CalendarSvg from '../../../../public/images/svg/icon-calendar.svg';
import AngleDown from '../../../../public/images/svg/angle-down.svg';

const DateInput = forwardRef(
  ({ value, onClick, input, children, highlightProp }, ref) => {
    return (
      <div className="date-field" ref={ref}>
        <CalendarSvg className="calendar" onClick={onClick} />
        <input
          {...input}
          {...highlightProp}
          className="date-input form-control"
          type="text"
          onClick={onClick}
          value={value}
          readOnly
        />
        <AngleDown className="angle-down" onClick={onClick} />
        {children}
      </div>
    );
  }
);

export default DateInput;
