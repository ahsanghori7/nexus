import React, { useState, useEffect } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import EventIcon from '@mui/icons-material/Event';

const CompletionDate = ({
  onDateSelect,
  disabled = false,
  initialDate = null,
  projectStartDate,
}) => {
  const [value, setValue] = useState(initialDate ? dayjs(initialDate) : null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setValue(initialDate ? dayjs(initialDate) : null);
  }, [initialDate]);

  const handleDateChange = (selectedDate, context) => {
    if (context?.validationError) return;
    setValue(selectedDate);
  };

  const handleAccept = (selectedDate) => {
    if (selectedDate && onDateSelect) {
      const formattedDate = selectedDate.format('YYYY-MM-DD');
      onDateSelect(formattedDate);
    }
  };

  const handleOpen = () => {
    if (!disabled) {
      setOpen(true);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        views={['year', 'month', 'day']}
        minDate={projectStartDate ? dayjs(projectStartDate) : undefined}
        disableFuture
        format="DD/MM/YYYY"
        value={value}
        onChange={handleDateChange}
        onAccept={handleAccept}
        open={open}
        onOpen={handleOpen}
        onClose={handleClose}
        disabled={disabled}
        slotProps={{
          textField: {
            size: 'small',
            placeholder: 'Select date',
            onClick: handleOpen,
            inputProps: { 'data-testid': 'completion-date-picker' },
            sx: {
              '& input': { pl: '0px !important' },
              '& .MuiInputBase-root': {
                fontSize: '0.875rem',
              },
            },
            InputProps: {
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 0 }}>
                  <IconButton
                    onClick={handleOpen}
                    disabled={disabled}
                    size="small"
                  >
                    <EventIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              endAdornment: null,
            },
          },
          popper: {
            onMouseLeave: handleClose,
          },
        }}
      />
    </LocalizationProvider>
  );
};

export default CompletionDate;
