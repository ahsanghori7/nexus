import React, { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import moment from 'moment';
import { CONSTANTS } from 'clink-components';
import CustomCheckbox from './PackageCustomCheckbox';
import commonStyles from './common';
import CustomButton from './CustomButton';

const { iconDecisionCalendarGrey, iconAwardedGrey } = CONSTANTS.s3;

const SelectAllItem = ({
  min,
  project,
  packages = [],
  makeRequestToUpdate = () => null,
  updateAllPackages = () => null,
  handleAllSelected = () => null,
  handleUpdateTenders = () => null,
}) => {
  const theme = useTheme();
  const [bulkChecked, setBulkChecked] = useState(false);
  const [bulkDate, setBulkDate] = useState(moment());

  const classes = {
    ...commonStyles(theme),
    rigthColumnSelectAll: {
      display: 'none',
      pointerEvents: 'none',
      [theme.breakpoints.down('sm')]: {
        display: 'flex',
        alignItems: 'center',
        width: '76px',
        justifyContent: 'space-between',
        marginRight: '-4px',
      },
    },
    calendarIcon: {
      width: 24,
      height: 24,
      [theme.breakpoints.down('sm')]: {
        height: '15px',
        width: 'auto',
      },
    },
    awardedIcon: {
      [theme.breakpoints.down('sm')]: {
        height: '15px',
        width: 'auto',
      },
    },
  };

  const smallResolution = useMediaQuery(theme.breakpoints.down('sm'));

  const selectedPackages = packages.filter((pack) => pack.selected);

  const handleOnChangeDate = (date) => {
    setBulkDate(date);
  };

  const handleOnAcceptDate = (date) => {
    if (!date) return;

    const newDate = date.format('YYYY-MM-DD');
    const newValue = { decision_date: newDate };
    const promises = selectedPackages.map((p) =>
      updateAllPackages(p, newValue)
    );
    makeRequestToUpdate(promises, newValue, handleUpdateTenders);
  };

  const handleOnChangeSelected = (event) => {
    const newAwarded = event.target.checked;
    setBulkChecked(newAwarded);
    if (newAwarded) {
      const newValue = { awarded: newAwarded };
      const promises = selectedPackages.map((p) =>
        updateAllPackages(p, newValue)
      );
      makeRequestToUpdate(promises, newValue, handleUpdateTenders);
    }
  };

  return (
    <Box
      sx={classes.listItem}
      component="li"
      onClick={(e) => e.preventDefault()}
    >
      <Box sx={classes.leftColumn}>
        <Box sx={classes.textFragmentHeader}>
          <CustomCheckbox
            value={Boolean(project.allSelected)}
            checked={Boolean(project.allSelected)}
            onClick={() => handleAllSelected(project.id, !project.allSelected)}
          />{' '}
          <Typography sx={classes.textFragmentSizeHeader}>
            Select all
          </Typography>
        </Box>
      </Box>
      <Box sx={classes.rightColumn}>
        {(project.allSelected || selectedPackages.length >= min) &&
          !smallResolution && (
            <Box sx={classes.textFragment}>
              <Typography sx={classes.textFragmentHidden}>Awarded</Typography>{' '}
              <CustomCheckbox
                redBorder
                checked={bulkChecked}
                onChange={handleOnChangeSelected}
              />
            </Box>
          )}
        {(project.allSelected || selectedPackages.length >= min) &&
          !smallResolution && (
            <Box sx={classes.textFragment}>
              <Typography sx={classes.textFragmentHidden}>
                New decision date
              </Typography>{' '}
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
          )}
      </Box>
      {selectedPackages.length < min && !project.allSelected && (
        <Box sx={classes.rigthColumnSelectAll}>
          <Box>
            <Avatar
              sx={classes.awardedIcon}
              src={iconAwardedGrey}
              variant="square"
            />
          </Box>
          <Box>
            <Avatar
              sx={classes.calendarIcon}
              src={iconDecisionCalendarGrey}
              variant="square"
            />
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default SelectAllItem;
