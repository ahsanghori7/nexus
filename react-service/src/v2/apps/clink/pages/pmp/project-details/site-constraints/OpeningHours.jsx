import React from 'react';
import Grid2 from '@mui/material/Grid2';
import i18next from 'v2/helpers/i18n';
import TextField from '@mui/material/TextField';

const OpeningHours = ({ useUpdateProject = {} }) => {
  const {
    useWeekdays: [openingHoursWeekdays, setOpeningHoursWeekdays],
    useWeekends: [openingHoursWeekends, setOpeningHoursWeekends],
  } = useUpdateProject;
  return (
    <Grid2 p={1.75} container spacing={2}>
      <Grid2 size={{ xs: 12, md: 6 }}>
        <TextField
          label={i18next.t('opening-hours-1')}
          slotProps={{
            htmlInput: { 'data-testid': 'opening-hours-1-input' },
            select: {
              'data-testid': 'opening-hours-1-select-dropdown',
            },
          }}
          variant="outlined"
          fullWidth
          value={openingHoursWeekdays}
          onChange={(e) => setOpeningHoursWeekdays(e.target.value)}
        />
      </Grid2>
      <Grid2 size={{ xs: 12, md: 6 }}>
        <TextField
          slotProps={{
            htmlInput: { 'data-testid': 'opening-hours-2-input' },
            select: {
              'data-testid': 'opening-hours-2-select-dropdown',
            },
          }}
          label={i18next.t('opening-hours-2')}
          variant="outlined"
          fullWidth
          value={openingHoursWeekends}
          onChange={(e) => setOpeningHoursWeekends(e.target.value)}
        />
      </Grid2>
    </Grid2>
  );
};

export default OpeningHours;
