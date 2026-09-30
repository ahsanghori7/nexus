import React, {useEffect, useState} from 'react';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputAdornment from '@mui/material/InputAdornment';
import {DateRange as DateRangeIcon} from '@mui/icons-material';
import {AdapterMoment} from '@mui/x-date-pickers/AdapterMoment';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {MobileDatePicker} from '@mui/x-date-pickers/MobileDatePicker';
import moment from 'moment';
import {MuiSubtitle} from 'v2/apps/shared/components/company-v2/Mui.styled';

const DateComponent = ({
  name = 'date',
  label = '',
  value,
  errors,
  trigger,
  register,
  setValue,
  minDate = null,
  maxDate = null,
  dateFormat = 'DD/MM/YYYY',
  requiredDate = true,
  showToolbar = false,
}) => {
  const [internalValue, setInternalValue] = useState(
    value ? moment(value) : null,
  );
  const [error, setError] = useState(null);

  useEffect(() => {
    register(name, {required: requiredDate});
  }, [register, name, requiredDate]);
  const errorMessage = React.useMemo(() => {
    switch (error) {
      default: {
        return 'Required';
      }
    }
  }, [error]);

  useEffect(() => {
    setInternalValue(value ? moment(value) : null);
  }, [value]);

  // Custom TextField to use with the DatePicker
  // eslint-disable-next-line react/no-unstable-nested-components
  const CustomTextField = React.forwardRef((props, ref) => {
    const { error: errorField, InputProps, ...other } = props;

    return (
      <TextField
        {...other}
        ref={ref}
        fullWidth
        error={!!errors[name]}
        placeholder={dateFormat.toLowerCase()}
        helperText={errors[name] ? 'Required' : ''}
        InputProps={{
          ...InputProps,
          endAdornment: (
            <InputAdornment position="start">
              <DateRangeIcon />
            </InputAdornment>
          ),
        }}
      />
    );
  });

  CustomTextField.displayName = 'CustomTextField';

  return (
    <FormControl
      sx={{ '& .MuiInputAdornment-root': { marginRight: '-6px' } }}
      fullWidth
      error={!!errors[name]}
    >
      {Boolean(label) && <MuiSubtitle>{label}</MuiSubtitle>}
      <LocalizationProvider dateAdapter={AdapterMoment}>
        <MobileDatePicker
          {...register(name, { required: requiredDate })}
          value={internalValue}
          onChange={(newDate) => {
            setInternalValue(newDate);
          }}
          format={dateFormat}
          onOpen={() => {
            setInternalValue(internalValue);
          }}
          onClose={() => {
            if (!internalValue) {
              setValue(name, '', {shouldValidate: true, shouldTouch: true});
              trigger(name);
            }
            setInternalValue((prev) => prev ?? (value ? moment(value) : null));
          }}
          onAccept={(date) => {
            const formatted = date ? date.format('YYYY-MM-DD') : '';
            setValue(name, formatted);
            trigger(name); // Trigger validation
          }}
          onError={(newError) => setError(newError)}
          minDate={minDate ? moment(minDate) : undefined}
          maxDate={maxDate ? moment(maxDate) : undefined}
          slots={{
            textField: CustomTextField,
          }}
          slotProps={{
            toolbar: {
              hidden: !showToolbar,
            },
            textField: {
              helperText: error ? errorMessage : undefined,
            },
          }}
        />
      </LocalizationProvider>
    </FormControl>
  );
};

export default DateComponent;
