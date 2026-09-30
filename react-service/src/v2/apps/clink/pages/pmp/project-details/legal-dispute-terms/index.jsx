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

const LegalDisputeTerms = ({ useUpdateProject }) => {
  const { t } = useTranslation();

  const {
    useAreLiquidatedDamagesApplicable: [
      areLiquidatedDamagesApplicable,
      setAreLiquidatedDamagesApplicable,
    ],
    useLiquidatedDamagesRate: [liquidatedDamagesRate, setLiquidatedDamagesRate],
    useCapOnLiquidatedDamages: [
      capOnLiquidatedDamages,
      setCapOnLiquidatedDamages,
    ],
    useAmendmentsRelevantEventsMatters: [
      amendmentsRelevantEventsMatters,
      setAmendmentsRelevantEventsMatters,
    ],
    useGoverningLaw: [governingLaw, setGoverningLaw],
    useErrorsLegalDisputeTerms: [errorsLegalDisputeTerms],
  } = useUpdateProject;

  let areLiquidatedDamagesApplicableValue = null;
  if (areLiquidatedDamagesApplicable === true) {
    areLiquidatedDamagesApplicableValue = 'true';
  } else if (areLiquidatedDamagesApplicable === false) {
    areLiquidatedDamagesApplicableValue = 'false';
  }

  let amendmentsRelevantEventsMattersValue = null;
  if (amendmentsRelevantEventsMatters === true) {
    amendmentsRelevantEventsMattersValue = 'true';
  } else if (amendmentsRelevantEventsMatters === false) {
    amendmentsRelevantEventsMattersValue = 'false';
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
          {t('legal-dispute-terms')}
        </Typography>
      </Grid2>

      {errorsLegalDisputeTerms?.length > 0 && (
        <Grid2 size={{ xs: 12 }}>
          <Alert key={e} severity="error" sx={{ mb: 1 }}>
            {errorsLegalDisputeTerms.map((e) => (
              <Typography key={error} variant="body2">
                {t(e)}
              </Typography>
            ))}
          </Alert>
        </Grid2>
      )}

      <Grid2 p={1.75} container spacing={2}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <FormControl>
            <FormLabel>{t('are-liquidated-damages-applicable')}</FormLabel>
            <RadioGroup
              row
              value={areLiquidatedDamagesApplicableValue}
              onChange={(e) =>
                setAreLiquidatedDamagesApplicable(e.target.value === 'true')
              }
            >
              <FormControlLabel
                value="true"
                control={<Radio inputProps={{ 'data-testid': 'legal-dispute-liquidated-damages-yes-radio' }} />}
                label={t('yes')}
              />
              <FormControlLabel
                value="false"
                control={<Radio inputProps={{ 'data-testid': 'legal-dispute-liquidated-damages-no-radio' }} />}
                label={t('no')}
              />
            </RadioGroup>
          </FormControl>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }}>
          <FormControl>
            <FormLabel>{t('amendments-relevant-events-matters')}</FormLabel>
            <RadioGroup
              row
              value={amendmentsRelevantEventsMattersValue}
              onChange={(e) =>
                setAmendmentsRelevantEventsMatters(e.target.value === 'true')
              }
            >
              <FormControlLabel
                value="true"
                control={<Radio inputProps={{ 'data-testid': 'legal-dispute-amendments-relevant-yes-radio' }} />}
                label={t('yes')}
              />
              <FormControlLabel
                value="false"
                control={<Radio inputProps={{ 'data-testid': 'legal-dispute-amendments-relevant-no-radio' }} />}
                label={t('no')}
              />
            </RadioGroup>
          </FormControl>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }} pb={1}>
          <TextField
            slotProps={{
              htmlInput: { 'data-testid': 'legal-dispute-liquidated-damages-rate-input' },
            }}
            label={t('liquidated-damages-rate')}
            variant="outlined"
            fullWidth
            value={liquidatedDamagesRate}
            onChange={(e) => setLiquidatedDamagesRate(e.target.value)}
            placeholder={t('liquidated-damages-rate-eg')}
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }} pb={1}>
          <TextField
            slotProps={{
              htmlInput: { 'data-testid': 'legal-dispute-cap-liquidated-damages-input' },
            }}
            label={t('cap-on-liquidated-damages')}
            variant="outlined"
            fullWidth
            value={capOnLiquidatedDamages}
            onChange={(e) => setCapOnLiquidatedDamages(e.target.value)}
            placeholder={t('cap-on-liquidated-damages-eg')}
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }} pb={1}>
          <TextField
            slotProps={{
              htmlInput: { 'data-testid': 'legal-dispute-governing-law-input' },
            }}
            label={t('governing-law')}
            variant="outlined"
            fullWidth
            value={governingLaw}
            onChange={(e) => setGoverningLaw(e.target.value)}
          />
        </Grid2>
      </Grid2>
    </Grid2>
  );
};

export default LegalDisputeTerms;
