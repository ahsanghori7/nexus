import React from 'react';
import Typography from '@mui/material/Typography';
import Grid2 from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import { useTranslation } from 'react-i18next';
import { CONSTANTS } from 'clink-components';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const DesignWarranties = ({ useUpdateProject }) => {
  const { t } = useTranslation();

  const {
    useDesignResponsibility: [designResponsibility, setDesignResponsibility],
    useDesignResponsibilityPeriod: [
      designResponsibilityPeriod,
      setDesignResponsibilityPeriod,
    ],
    useCollateralWarrantiesRequired: [
      collateralWarrantiesRequired,
      setCollateralWarrantiesRequired,
    ],
    useWarrantiesProvidedTo: [warrantiesProvidedTo, setWarrantiesProvidedTo],
    useErrorsDesignWarranties: [errorsDesignWarranties],
  } = useUpdateProject;

  let designResponsibilityValue = null;
  if (designResponsibility === true) {
    designResponsibilityValue = 'true';
  } else if (designResponsibility === false) {
    designResponsibilityValue = 'false';
  }

  let collateralWarrantiesValue = null;
  if (collateralWarrantiesRequired === true) {
    collateralWarrantiesValue = 'true';
  } else if (collateralWarrantiesRequired === false) {
    collateralWarrantiesValue = 'false';
  }

  return (
    <Grid2
      size={{ xs: 12, md: 4 }}
      sx={{ width: '100% !important' }}
      container
      flexDirection="column"
    >
      <Grid2 borderBottom={`1px solid ${lightPeriwinkle}`} p={1.75}>
        <Typography sx={{ fontWeight: 600 }}>
          {t('design-warranties')}
        </Typography>
      </Grid2>

      {errorsDesignWarranties?.length > 0 && (
        <Grid2 p={1.75}>
          <Alert key={e} severity="error" sx={{ mb: 1 }}>
            {errorsDesignWarranties.map((e) => (
              <Typography key={error} variant="body2">
                {t(e)}
              </Typography>
            ))}
          </Alert>
        </Grid2>
      )}

      <Grid2 p={1.75} container spacing={2}>
        <Grid2 size={{ xs: 12 }}>
          <FormControl>
            <FormLabel>{t('design-responsibility')}</FormLabel>
            <RadioGroup
              row
              value={designResponsibilityValue}
              onChange={(e) =>
                setDesignResponsibility(e.target.value === 'true')
              }
            >
              <FormControlLabel
                value="true"
                control={<Radio inputProps={{ 'data-testid': 'design-warranties-design-responsibility-yes-radio' }} />}
                label={t('yes')}
              />
              <FormControlLabel
                value="false"
                control={<Radio inputProps={{ 'data-testid': 'design-warranties-design-responsibility-no-radio' }} />}
                label={t('no')}
              />
            </RadioGroup>
          </FormControl>
        </Grid2>

        <Grid2 size={{ xs: 12 }}>
          <TextField
            slotProps={{
              htmlInput: { 'data-testid': 'design-warranties-design-responsibility-period-input' },
            }}
            label={t('design-responsibility-period')}
            variant="outlined"
            fullWidth
            value={designResponsibilityPeriod}
            onChange={(e) => setDesignResponsibilityPeriod(e.target.value)}
            placeholder={t('design-responsibility-period-eg')}
          />
        </Grid2>

        <Grid2 size={{ xs: 12 }}>
          <FormControl>
            <FormLabel>{t('collateral-warranties')}</FormLabel>
            <RadioGroup
              row
              value={collateralWarrantiesValue}
              onChange={(e) =>
                setCollateralWarrantiesRequired(e.target.value === 'true')
              }
            >
              <FormControlLabel
                value="true"
                control={<Radio inputProps={{ 'data-testid': 'design-warranties-collateral-warranties-yes-radio' }} />}
                label={t('yes')}
              />
              <FormControlLabel
                value="false"
                control={<Radio inputProps={{ 'data-testid': 'design-warranties-collateral-warranties-no-radio' }} />}
                label={t('no')}
              />
            </RadioGroup>
          </FormControl>
        </Grid2>

        <Grid2 size={{ xs: 12 }}>
          <TextField
            slotProps={{
              htmlInput: { 'data-testid': 'design-warranties-warranties-provided-input' },
            }}
            label={t('warranties-provided')}
            variant="outlined"
            fullWidth
            value={warrantiesProvidedTo}
            onChange={(e) => setWarrantiesProvidedTo(e.target.value)}
            placeholder={t('warranties-provided-eg')}
          />
        </Grid2>
      </Grid2>
    </Grid2>
  );
};

export default DesignWarranties;
