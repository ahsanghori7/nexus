import React from 'react';
import PropTypes from 'prop-types';
import Grid2 from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import { CONSTANTS } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import { getIfsBusinessUnitLabel, readOnlyIfsFieldSx } from '../ifsProjectHelpers';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const IfsLinkedProjectInfo = ({ linkedProject, loading }) => {
  if (loading) {
    return null;
  }

  if (!linkedProject?.id) {
    return null;
  }

  const businessUnit = getIfsBusinessUnitLabel(linkedProject);

  return (
    <>
      <Grid2 borderBottom={`1px solid ${lightPeriwinkle}`} p={1.75} size={12}>
        <Typography sx={{ fontWeight: 600 }}>
          {i18next.t('ifs-linked-project')}
        </Typography>
      </Grid2>
      <Grid2 p={1.75} container spacing={2} size={12}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            label={i18next.t('ifs-external-id')}
            variant="outlined"
            fullWidth
            value={linkedProject.external_id || ''}
            slotProps={{ input: { readOnly: true } }}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            label={i18next.t('ifs-project-code')}
            variant="outlined"
            fullWidth
            value={linkedProject.project_code || ''}
            slotProps={{ input: { readOnly: true } }}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            label={i18next.t('ifs-project-name')}
            variant="outlined"
            fullWidth
            disabled
            value={linkedProject.project_name || ''}
            sx={readOnlyIfsFieldSx}
          />
        </Grid2>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            label={i18next.t('ifs-business-unit')}
            variant="outlined"
            fullWidth
            value={businessUnit}
            slotProps={{ input: { readOnly: true } }}
          />
        </Grid2>
      </Grid2>
    </>
  );
};

IfsLinkedProjectInfo.propTypes = {
  linkedProject: PropTypes.shape({
    id: PropTypes.number,
    external_id: PropTypes.string,
    project_code: PropTypes.string,
    project_name: PropTypes.string,
    business_unit_code: PropTypes.string,
    business_unit_name: PropTypes.string,
  }),
  loading: PropTypes.bool,
};

export default IfsLinkedProjectInfo;
