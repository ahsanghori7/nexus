import React, { useState, useEffect } from 'react';
import { useContext } from 'v2/hooks/context';
import { connect } from 'react-redux';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import EventIcon from '@mui/icons-material/Event';

function StartOnSite({ dispatch, params, openedDatePickerId, project }) {
  const id = params?.row?.id || null;
  const startOnSiteUnformatted = params?.row?.startOnSiteUnformatted || null;
  const [value, setValue] = useState(dayjs(startOnSiteUnformatted || null));
  const context = useContext('clink');
  const { actions } = context;

  useEffect(() => {
    setValue(dayjs(startOnSiteUnformatted || null));
  }, [startOnSiteUnformatted]);

  const handleChange = (newValue) => {
    setValue(newValue);
    if (id) {
      const projectVersion = project?.data?.version;

      dispatch(
        actions.updatePackages({
          tid: id,
          data: {
            start_on_site: newValue ? newValue.format('DD-MM-YYYY') : null,
          },
        }),
      ).then(() => {
        if (projectVersion === 2) {
          dispatch(
            actions.getProjectProcurementOverviewV2({
              project_id: project?.data?.id,
            }),
          );
        }
      });
    }
  };

  const handleOpen = () => {
    dispatch(actions.setOpenedDatePickerId(id));
  };

  const handleClose = () => {
    dispatch(actions.setOpenedDatePickerId(null));
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        format="DD/MM/YYYY"
        value={value}
        onChange={handleChange}
        open={openedDatePickerId === id}
        onOpen={handleOpen}
        onClose={handleClose}
        slotProps={{
          textField: {
            onClick: handleOpen,
            onMouseEnter: handleOpen,
            inputProps: { 'data-testid': 'start-on-site-date-picker' },
            // TODO: Move this to MUI Theme
            sx: { '& input': { pl: '0px !important' } },
            InputProps: {
              startAdornment: (
                <InputAdornment
                  position="start"
                  className="start-on-time-icon"
                  sx={{ mr: 0 }}
                >
                  <IconButton onClick={handleOpen}>
                    <EventIcon />
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
}

const mapStateToProps = (state) => ({
  openedDatePickerId: state.project.openedDatePickerId,
  project: state.project,
});

export default connect(mapStateToProps)(StartOnSite);
