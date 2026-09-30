import React from 'react';
import { InputCalendar } from 'clink-components';
import { MuiDateRangeContainer, MuiCalendarContainer } from './Mui.styled';

const DateRange = ({ start, end, handleStart, handleEnd }) => (
  <MuiDateRangeContainer>
    <MuiCalendarContainer>
      <InputCalendar
        label="From"
        type="text"
        name="from-date"
        placeholder="Test placeholder"
        theme="prosper"
        value={start}
        controlledOnChange={handleStart}
        setDirty={() => null}
        data-testid="daterange-input-from"
      />
    </MuiCalendarContainer>
    <MuiCalendarContainer>
      <InputCalendar
        label="To"
        type="text"
        name="from-date"
        placeholder="Test placeholder"
        theme="prosper"
        value={end}
        controlledOnChange={handleEnd}
        setDirty={() => null}
        data-testid="daterange-input-to"
      />
    </MuiCalendarContainer>
  </MuiDateRangeContainer>
);

export default DateRange;
