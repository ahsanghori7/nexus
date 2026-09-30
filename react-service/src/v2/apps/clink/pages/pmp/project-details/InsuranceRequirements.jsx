import React, { useMemo } from 'react';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Grid2 from '@mui/material/Grid2';
import { CONSTANTS } from 'clink-components';
import i18next from 'v2/helpers/i18n';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormLabel from '@mui/material/FormLabel';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const InsuranceRequirements = ({ useUpdateProject = {}, constants }) => {
  const {
    useProductInsurance: [productInsurance, setProductInsurance],
    useWorkInsurance: [workInsurance, setWorkInsurance],
    useProfessionalIndemnityInsurance: [
      professionalIndemnityInsurance,
      setProfessionalIndemnityInsurance,
    ],
    useProductInsuranceResponsible: [
      productInsuranceResponsible,
      setProductInsuranceResponsible,
    ],
    useWorkInsuranceResponsible: [
      workInsuranceResponsible,
      setWorkInsuranceResponsible,
    ],
    useProfessionalIndemnityResponsible: [
      professionalIndemnityResponsible,
      setProfessionalIndemnityResponsible,
    ],
    useErrorsInsurance: [errors],
  } = useUpdateProject;

  const insurancesArray = useMemo(() => {
    return Object.entries(constants?.project?.insurances || {}).map(
      ([key, value]) => ({
        id: key,
        label: value,
      }),
    );
  }, [constants?.project?.insurances]);

  return (
    <Grid2
      size={{ xs: 12, md: 4 }}
      sx={{ width: '100% !important' }}
      container
      flexDirection="column"
    >
      <Grid2 borderBottom={`1px solid ${lightPeriwinkle}`} p={1.75}>
        <Typography sx={{ fontWeight: 600 }}>
          {i18next.t('insurance-requirements')}
        </Typography>
      </Grid2>

      {errors?.length > 0 && (
        <Grid2 p={1.75}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.map((error) => (
              <Typography key={error} variant="body2">
                {i18next.t(error)}
              </Typography>
            ))}
          </Alert>
        </Grid2>
      )}

      <Grid2 p={1.75} container spacing={2}>
        <Grid2 size={{ xs: 12 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid': 'insurance-product-liability-select',
              },
              select: {
                'data-testid': 'insurance-product-liability-select-dropdown',
              },
            }}
            label={i18next.t('public-product-liability')}
            fullWidth
            select
            variant="outlined"
            value={productInsurance}
            onChange={(e) => setProductInsurance(e.target.value)}
          >
            {insurancesArray.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>

        <Grid2 size={{ xs: 12 }} borderBottom={`1px solid ${lightPeriwinkle}`}>
          <FormLabel>{i18next.t('who-is-responsible')}</FormLabel>
          <RadioGroup
            row
            value={productInsuranceResponsible}
            onChange={(e) => setProductInsuranceResponsible(e.target.value)}
          >
            <FormControlLabel
              value="contractor"
              control={
                <Radio
                  inputProps={{
                    'data-testid':
                      'insurance-product-liability-contractor-radio',
                  }}
                  onClick={() =>
                    setProductInsuranceResponsible((prev) =>
                      prev === 'contractor' ? '' : 'contractor',
                    )
                  }
                />
              }
              label={i18next.t('contractor')}
            />
            <FormControlLabel
              value="employer"
              control={
                <Radio
                  inputProps={{
                    'data-testid': 'insurance-product-liability-employer-radio',
                  }}
                  onClick={() =>
                    setProductInsuranceResponsible((prev) =>
                      prev === 'employer' ? '' : 'employer',
                    )
                  }
                />
              }
              label={i18next.t('employer')}
            />
          </RadioGroup>
        </Grid2>

        <Grid2 size={{ xs: 12 }}>
          <TextField
            slotProps={{
              htmlInput: { 'data-testid': 'insurance-contract-works-select' },
              select: {
                'data-testid': 'insurance-contract-works-select-dropdown',
              },
            }}
            label={i18next.t('contract-works-insurance')}
            fullWidth
            select
            variant="outlined"
            value={workInsurance}
            onChange={(e) => setWorkInsurance(e.target.value)}
          >
            {insurancesArray.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>

        <Grid2 size={{ xs: 12 }} borderBottom={`1px solid ${lightPeriwinkle}`}>
          <FormLabel>{i18next.t('who-is-responsible')}</FormLabel>
          <RadioGroup
            row
            value={workInsuranceResponsible}
            onChange={(e) => setWorkInsuranceResponsible(e.target.value)}
          >
            <FormControlLabel
              value="contractor"
              control={
                <Radio
                  inputProps={{
                    'data-testid': 'insurance-contract-works-contractor-radio',
                  }}
                  onClick={() =>
                    setWorkInsuranceResponsible((prev) =>
                      prev === 'contractor' ? '' : 'contractor',
                    )
                  }
                />
              }
              label={i18next.t('contractor')}
            />
            <FormControlLabel
              value="employer"
              control={
                <Radio
                  inputProps={{
                    'data-testid': 'insurance-contract-works-employer-radio',
                  }}
                  onClick={() =>
                    setWorkInsuranceResponsible((prev) =>
                      prev === 'employer' ? '' : 'employer',
                    )
                  }
                />
              }
              label={i18next.t('employer')}
            />
          </RadioGroup>
        </Grid2>

        <Grid2 size={{ xs: 12 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid': 'insurance-professional-indemnity-select',
              },
              select: {
                'data-testid':
                  'insurance-professional-indemnity-select-dropdown',
              },
            }}
            label={i18next.t('professional-indemnity-insurance')}
            fullWidth
            select
            variant="outlined"
            value={professionalIndemnityInsurance}
            onChange={(e) => setProfessionalIndemnityInsurance(e.target.value)}
          >
            {insurancesArray.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Grid2>

        <Grid2 size={{ xs: 12 }}>
          <FormLabel>{i18next.t('who-is-responsible')}</FormLabel>
          <RadioGroup
            row
            value={professionalIndemnityResponsible}
            onChange={(e) =>
              setProfessionalIndemnityResponsible(e.target.value)
            }
          >
            <FormControlLabel
              value="contractor"
              control={
                <Radio
                  inputProps={{
                    'data-testid':
                      'insurance-professional-indemnity-contractor-radio',
                  }}
                  onClick={() =>
                    setProfessionalIndemnityResponsible((prev) =>
                      prev === 'contractor' ? '' : 'contractor',
                    )
                  }
                />
              }
              label={i18next.t('contractor')}
            />
            <FormControlLabel
              value="employer"
              control={
                <Radio
                  inputProps={{
                    'data-testid':
                      'insurance-professional-indemnity-employer-radio',
                  }}
                  onClick={() =>
                    setProfessionalIndemnityResponsible((prev) =>
                      prev === 'employer' ? '' : 'employer',
                    )
                  }
                />
              }
              label={i18next.t('employer')}
            />
          </RadioGroup>
        </Grid2>
      </Grid2>
    </Grid2>
  );
};

export default InsuranceRequirements;
