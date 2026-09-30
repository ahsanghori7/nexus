import React, { useState } from 'react';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import EventIcon from '@mui/icons-material/Event';
import moment from 'moment';

const EditDate = ({
  id,
  field,
  date,
  defaultDate = null,
  enquirySentDate,
  shouldDisableDate,
  contextType = 'clink',
  dispatch,
}) => {
  const [value, setValue] = useState(date ? moment(date) : null);

  const context = useContext(contextType);
  const { actions } = context;

  const handleChange = (newValue) => {
    setValue(newValue);
  };

  const handleAccept = () => {
    if (value) {
      dispatch(
        actions.updateTender({
          tid: id,
          data: {
            [field]: ['tender_return', 'start_on_site'].includes(field)
              ? value.format('DD-MM-YYYY')
              : value.format('YYYY-MM-DD'),
          },
        })
      );
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterMoment}>
      <MobileDatePicker
        slotProps={{
          dialog: {
            PaperProps: { sx: { maxWidth: '320px' } },
          },
          textField: {
            variant: 'standard',
            placeholder: 'TBC',
            InputProps: {
              disableUnderline: true,
              endAdornment: !enquirySentDate ? (
                <InputAdornment position="end">
                  <IconButton edge="end" color="success">
                    <EventIcon />
                  </IconButton>
                </InputAdornment>
              ) : null,
              sx: {
                '& .MuiInputBase-input': {
                  textAlign: 'right',
                  cursor: !enquirySentDate ? 'pointer' : 'initial',
                  fontSize: '14px',
                  '&::placeholder': {
                    opacity: '1 !important',
                  },
                },
              },
            },
          },
        }}
        value={value}
        onChange={handleChange}
        onOpen={() => {
          if (!date && defaultDate) {
            setValue(moment(defaultDate));
          }
        }}
        onClose={() => {
          if (!date && defaultDate) {
            setValue(null);
          }
        }}
        onAccept={handleAccept}
        format="DD/MM/YYYY"
        shouldDisableDate={shouldDisableDate}
        disabled={!!enquirySentDate}
      />
    </LocalizationProvider>
  );
};

const mapStateToProps = (state) => {
  return {
    project: state.project,
  };
};

export default connect(mapStateToProps)(EditDate);
