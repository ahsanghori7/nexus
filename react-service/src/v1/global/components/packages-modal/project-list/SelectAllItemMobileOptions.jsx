import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import { useTheme } from '@mui/material/styles';
import { CONSTANTS } from 'clink-components';
import commonStyles from './common';

const { white, clinkRed } = CONSTANTS.colors.general;

const CustomButton = React.forwardRef((props, ref) => (
  <Button ref={ref} onClick={props.onClick}>
    New decision date
  </Button>
));

const SelectAllItemMobileOptions = ({
  packages = [],
  makeRequestToUpdate = () => null,
  updateAllPackages = () => null,
  handleUpdateTenders = () => null,
}) => {
  const theme = useTheme();
  const [bulkDate, setBulkDate] = useState(moment());

  const classes = {
    ...commonStyles(theme),
    selectAllMobileOptions: {
      flexBasis: '100%',
      display: 'flex',
      justifyContent: 'center',
      '& .MuiButtonBase-root': {
        textTransform: 'initial',
        height: '26px',
        fontSize: '14px',
        backgroundColor: clinkRed,
        color: white,
        margin: '4px 8px',
        borderRadius: '40px',
      },
    },
  };

  const selectedPackages = packages.filter((pack) => pack.selected);

  const handleOnChangeDate = (date) => {
    setBulkDate(date);
  };

  const handleOnClickAward = () => {
    const newValue = { awarded: true };
    const promises = selectedPackages.map((p) =>
      updateAllPackages(p, newValue),
    );
    makeRequestToUpdate(
      promises,
      { ...newValue, selected: false },
      handleUpdateTenders,
    );
  };

  const handleOnAcceptDate = (date) => {
    if (!date) return;

    const newDate = date.format('YYYY-MM-DD');
    const newValue = { decision_date: newDate };
    const promises = selectedPackages.map((p) =>
      updateAllPackages(p, newValue),
    );
    makeRequestToUpdate(promises, newValue, handleUpdateTenders);
  };

  return (
    <Box sx={classes.listItem} component="li">
      <Box sx={classes.selectAllMobileOptions}>
        <Button onClick={handleOnClickAward}>Award all</Button>
        <LocalizationProvider dateAdapter={AdapterMoment}>
          <MobileDatePicker
            value={bulkDate}
            minDate={moment()}
            onChange={handleOnChangeDate}
            onAccept={handleOnAcceptDate}
            format="DD/MM/YYYY"
            slots={{
              textField: CustomButton,
            }}
          />
        </LocalizationProvider>
      </Box>
    </Box>
  );
};

export default SelectAllItemMobileOptions;
