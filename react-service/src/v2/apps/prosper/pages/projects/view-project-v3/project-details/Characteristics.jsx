import React from 'react';
import moment from 'moment';
import capitalize from 'lodash/capitalize';
import { CONSTANTS } from 'clink-components';
import { useTranslation } from 'react-i18next';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Item from 'v2/apps/prosper/shared/crm-components/Item';

const {
  locationLogo,
  infoLogo,
  rocketLogo,
  calendarLogo,
  statusLogo,
  distancePink,
} = CONSTANTS.s3;

const Characteristics = ({ project, gridSx = {}, distance = [] }) => {
  const { t } = useTranslation();
  const {
    region = '*****',
    type = '*****',
    start = '4th December 2021',
    end = '19th November 2021',
    phase = '*****',
    id = null,
  } = project;

  const [distanceDate] = distance.filter(
    (d) => Number(d.project_id) === Number(id)
  );
  return (
    <Grid container item sx={gridSx}>
      <Grid item sx={{ marginBottom: 1 }}>
        <Typography
          sx={{ fontSize: { xs: '14px', md: '19px' }, fontWeight: 'bold' }}
        >
          {capitalize(t('characteristics'))}
        </Typography>
      </Grid>
      <Item
        icon={locationLogo}
        type="text-project-location"
        value={region}
        mb={1}
        xs={0}
      />
      <Item
        icon={infoLogo}
        type="text-project-type"
        value={type}
        mb={1}
        xs={0}
      />
      <Item
        icon={rocketLogo}
        type="text-start-on-site"
        value={String(moment(new Date(start)).format('Do MMMM YYYY'))}
        mb={1}
        xs={0}
      />
      <Item
        icon={calendarLogo}
        type="text-pc-date"
        value={String(moment(new Date(end)).format('Do MMMM YYYY'))}
        mb={1}
        xs={0}
      />
      <Item
        icon={statusLogo}
        type="status"
        value={phase}
        xs={0}
        mb={distanceDate ? 1 : 0}
      />
      {distanceDate && (
        <Item
          icon={distancePink}
          type="distance"
          value={distanceDate.distance.text}
          mb={0}
          xs={0}
        />
      )}
    </Grid>
  );
};

export default Characteristics;
