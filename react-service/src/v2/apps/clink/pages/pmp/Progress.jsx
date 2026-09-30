import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Grid from '@mui/material/Grid2';
import Paper from '@mui/material/Paper';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepButton from '@mui/material/StepButton';
import Typography from '@mui/material/Typography';
import i18next from 'v2/helpers/i18n';

const steps = [
  i18next.t('project-overview'),
  i18next.t('project-team'),
  i18next.t('scope-and-details'),
  i18next.t('reference-files'),
  i18next.t('work-packages'),
];

function HorizontalLinearStepper({ activeStep, slug }) {
  const navigate = useNavigate();

  const paths = useMemo(
    () => [
      `/projects/${slug}/setup`,
      `/projects/${slug}/setup/project_team`,
      `/projects/${slug}/setup/scope_details`,
      `/projects/${slug}/setup/reference_files`,
      `/projects/${slug}/setup/work_packages`,
    ],
    [slug]
  );

  return (
    <Grid container justifyContent="flex-end" mt={1} mb={3}>
      <Grid p={3}>
        <Typography variant="title">{i18next.t('project-setup')}</Typography>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }} p={3} component={Paper}>
        <Stepper nonLinear activeStep={activeStep}>
          {steps.map((label, index) => {
            const sx =
              activeStep === index
                ? { fontWeight: '600', textDecoration: 'underline' }
                : {};
            return (
              <Step key={label} completed={activeStep > index}>
                <StepButton onClick={() => navigate(paths[index])} sx={sx}>
                  {label}
                </StepButton>
              </Step>
            );
          })}
        </Stepper>
      </Grid>
    </Grid>
  );
}

const mapStateToProps = (state) => {
  return {
    slug: state?.project?.data?.slug || 'undefined',
  };
};

export default connect(mapStateToProps)(HorizontalLinearStepper);
