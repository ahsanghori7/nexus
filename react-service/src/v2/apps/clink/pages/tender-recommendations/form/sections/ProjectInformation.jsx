import React, { useMemo } from 'react';
import { TextField, Typography } from '@mui/material';
import Grid2 from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import i18next from 'v2/helpers/i18n';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { ThemeProvider } from '@mui/material/styles';
import { chipTextFieldTheme } from '../theme/chipTextFieldTheme';
import disabledTextFieldSx from './disabledSx';

const ProjectInformation = ({ project }) => {
  const projectData = project?.data || {};
  const projectName = projectData.name || '';
  const projectManagers = useMemo(() => {
    if (!project?.members || project?.members?.length === 0) return [];

    return project?.members
      ?.filter((item) => item.member?.position?.label === 'Project Manager')
      .map((item) => {
        const { firstname, lastname } = item.member;
        return {
          fullname: `${firstname} ${lastname}`.trim(),
          email: item.member.email,
        };
      });
  }, [project?.members]);

  const completionDate = projectData.end || null;

  return (
    <Grid2 container spacing={0} sx={{ flexDirection: 'column', px: 3, pb: 3 }}>
      <Grid2>
        <Grid2 container spacing={2}>
          <Grid2 size={{ xs: 12, sm: 6, md: 6 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {i18next.t('project-name')}
            </Typography>
            <TextField
              fullWidth
              placeholder={i18next.t('enter-project-name')}
              disabled
              variant="outlined"
              size="small"
              sx={disabledTextFieldSx}
              value={projectName}
            />
          </Grid2>
          <Grid2 size={{ xs: 12, md: 6 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {i18next.t('completion-date')}
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                format="DD/MM/YYYY"
                value={completionDate ? dayjs(completionDate) : null}
                disabled
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    placeholder: 'dd/mm/yyyy',
                    variant: 'outlined',
                    sx: disabledTextFieldSx,
                    InputProps: {
                      readOnly: true,
                    },
                  },
                }}
              />
            </LocalizationProvider>
          </Grid2>
          <Grid2 size={{ xs: 12, sm: 6, md: 6 }}>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              {i18next.t('project-manager-name')}
            </Typography>
            <ThemeProvider theme={chipTextFieldTheme}>
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                disabled
                sx={disabledTextFieldSx}
                slotProps={{
                  input: {
                    startAdornment: projectManagers.length > 0 && (
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 0.5,
                          alignItems: 'center',
                        }}
                      >
                        {projectManagers.map((manager) => (
                          <Chip
                            key={manager.email}
                            label={manager.fullname}
                            size="small"
                            disabled
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    ),
                  },
                }}
              />
            </ThemeProvider>
          </Grid2>
        </Grid2>
      </Grid2>
    </Grid2>
  );
};

export default ProjectInformation;
