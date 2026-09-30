import React, { useState } from 'react';
import moment from 'moment';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { useTheme } from '@mui/material/styles';
import { CONSTANTS } from 'clink-components';
import CustomCheckbox from './PackageCustomCheckbox';
import Relay from 'v1/global/services/Relay';
import commonStyles from './common';
import CustomButton from './CustomButton';

const { red } = CONSTANTS.colors.general;
const { proxima } = CONSTANTS.fonts;

const PackageItem = ({
  tender,
  showActions = true,
  handleUpdateTenders = () => null,
}) => {
  const theme = useTheme();
  const [selectedDate, setSelectedDate] = useState(
    tender && tender?.decision_date ? moment(tender.decision_date) : null
  );

  const classes = {
    ...commonStyles(theme),
    date: {
      fontFamily: proxima,
      display: 'flex',
      alignItems: 'center',
      color: red,
      fontSize: '18px',
      whiteSpace: 'nowrap',
      minWidth: 95,
      [theme.breakpoints.down('sm')]: {
        fontSize: '8px',
        marginLeft: '32px',
        maxHeight: '22px',
      },
    },
  };

  const handleOnChange = (date) => {
    setSelectedDate(date);
  };

  const handleOnAccept = (date) => {
    if (!date) return;

    const updateTender = new Relay('tender', 'updateAwardedStatus');
    const newDate = date.format('YYYY-MM-DD');
    updateTender
      .patch(
        { decision_date: newDate },
        { pid: tender.project_id, tid: tender.id }
      )
      .then(() => handleUpdateTenders([tender], { decision_date: newDate }));
  };

  return (
    <Box sx={classes.listItem} component="li">
      <Box sx={classes.leftColumn}>
        <Box sx={classes.textFragment}>
          <CustomCheckbox
            checked={Boolean(tender.selected)}
            onChange={(event) => {
              handleUpdateTenders([tender], {
                selected: event.target.checked,
              });
            }}
          />{' '}
          <Typography sx={classes.textFragmentSize}>
            {tender.label || ''}
          </Typography>
        </Box>
        <Box sx={classes.date}>
          {tender.decision_date
            ? moment(tender.decision_date).format('DD/MM/YYYY')
            : ''}
        </Box>
      </Box>
      <Box sx={classes.rightColumn}>
        {showActions && (
          <>
            <Box sx={classes.textFragment}>
              <Typography sx={classes.textFragmentHidden}>Awarded</Typography>{' '}
              <CustomCheckbox
                redBorder
                checked={Boolean(tender.awarded)}
                onChange={(event) => {
                  const updateTender = new Relay(
                    'tender',
                    'updateAwardedStatus'
                  );
                  const newAwarded = event.target.checked;
                  updateTender
                    .patch(
                      { awarded: newAwarded },
                      { pid: tender.project_id, tid: tender.id }
                    )
                    .then(() =>
                      handleUpdateTenders([tender], { awarded: newAwarded })
                    );
                }}
              />
            </Box>
            <Box sx={classes.textFragment}>
              <Typography sx={classes.textFragmentHidden}>
                New decision date
              </Typography>{' '}
              <LocalizationProvider dateAdapter={AdapterMoment}>
                <MobileDatePicker
                  value={selectedDate}
                  minDate={moment()}
                  onChange={handleOnChange}
                  onAccept={handleOnAccept}
                  slots={{
                    textField: CustomButton,
                  }}
                  format="DD/MM/YYYY"
                />
              </LocalizationProvider>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
};

export default PackageItem;
