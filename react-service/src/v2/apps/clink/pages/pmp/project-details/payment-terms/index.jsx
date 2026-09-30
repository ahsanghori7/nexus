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
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTranslation } from 'react-i18next';
import { CONSTANTS } from 'clink-components';
import dayjs from 'dayjs';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const PaymentTerms = ({ useUpdateProject }) => {
  const { t } = useTranslation();

  const {
    useInterimValuationFrequency: [
      interimValuationFrequency,
      setInterimValuationFrequency,
    ],
    usePaymentDueDate: [paymentDueDate, setPaymentDueDate],
    useFinalDateForPayment: [finalDateForPayment, setFinalDateForPayment],
    useDeadlinePayLessNotices: [
      deadlinePayLessNotices,
      setDeadlinePayLessNotices,
    ],
    useScheduleOfPaymentsProvided: [
      scheduleOfPaymentsProvided,
      setScheduleOfPaymentsProvided,
    ],
    useAdvancePaymentProvision: [
      advancePaymentProvision,
      setAdvancePaymentProvision,
    ],
    useErrorsPaymentTerms: [errorsPaymentTerms],
  } = useUpdateProject;

  let scheduleOfPaymentsProvidedValue = null;
  if (scheduleOfPaymentsProvided === true) {
    scheduleOfPaymentsProvidedValue = 'true';
  } else if (scheduleOfPaymentsProvided === false) {
    scheduleOfPaymentsProvidedValue = 'false';
  }

  let advancePaymentProvisionValue = null;
  if (advancePaymentProvision === true) {
    advancePaymentProvisionValue = 'true';
  } else if (advancePaymentProvision === false) {
    advancePaymentProvisionValue = 'false';
  }

  return (
    <Grid2
      size={{ xs: 12, md: 4 }}
      sx={{ width: '100% !important' }}
      container
      flexDirection="column"
    >
      <Grid2 borderBottom={`1px solid ${lightPeriwinkle}`} p={1.75}>
        <Typography sx={{ fontWeight: 600 }}>{t('payment-terms')}</Typography>
      </Grid2>

      {errorsPaymentTerms?.length > 0 && (
        <Grid2 p={1.75}>
          <Alert key={e} severity="error" sx={{ mb: 1 }}>
            {errorsPaymentTerms.map((e) => (
              <Typography key={error} variant="body2">
                {t(e)}
              </Typography>
            ))}
          </Alert>
        </Grid2>
      )}

      <Grid2 p={1.75} container spacing={2}>
        <Grid2 size={{ xs: 12, md: 6, mb: 2 }}>
          <TextField
            slotProps={{
              htmlInput: { 'data-testid': 'payment-terms-interim-valuation-frequency-input' },
            }}
            label={t('interim-valuation-frequency')}
            variant="outlined"
            fullWidth
            value={interimValuationFrequency}
            onChange={(e) => setInterimValuationFrequency(e.target.value)}
            placeholder={t('eg-monthly')}
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6, mb: 2 }}>
          <TextField
            slotProps={{
              htmlInput: { 'data-testid': 'payment-terms-payment-due-date-input' },
            }}
            label={t('payment-due-date-text')}
            variant="outlined"
            fullWidth
            value={paymentDueDate}
            onChange={(e) => setPaymentDueDate(e.target.value)}
            placeholder={t('eg-14-days-from-valuation')}
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={t('final-date-for-payment')}
              format="DD/MM/YYYY"
              value={dayjs(finalDateForPayment)}
              onChange={(v) =>
                setFinalDateForPayment(v ? v.format('YYYY-MM-DD') : '')
              }
              slotProps={{
                textField: { inputProps: { 'data-testid': 'payment-terms-final-date-for-payment-input' } },
              }}
            />
          </LocalizationProvider>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={t('deadline-pay-less-notices')}
              format="DD/MM/YYYY"
              value={dayjs(deadlinePayLessNotices)}
              onChange={(v) =>
                setDeadlinePayLessNotices(v ? v.format('YYYY-MM-DD') : '')
              }
              slotProps={{
                textField: { inputProps: { 'data-testid': 'payment-terms-deadline-pay-less-notices-input' } },
              }}
            />
          </LocalizationProvider>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }}>
          <FormControl>
            <FormLabel>{t('schedule-of-payments-provided')}</FormLabel>
            <RadioGroup
              row
              value={scheduleOfPaymentsProvidedValue}
              onChange={(e) =>
                setScheduleOfPaymentsProvided(e.target.value === 'true')
              }
            >
              <FormControlLabel
                value="true"
                control={<Radio inputProps={{ 'data-testid': 'payment-terms-schedule-of-payments-yes-radio' }} />}
                label={t('yes')}
              />
              <FormControlLabel
                value="false"
                control={<Radio inputProps={{ 'data-testid': 'payment-terms-schedule-of-payments-no-radio' }} />}
                label={t('no')}
              />
            </RadioGroup>
          </FormControl>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }}>
          <FormControl>
            <FormLabel>{t('advance-payment-provision')}</FormLabel>
            <RadioGroup
              row
              value={advancePaymentProvisionValue}
              onChange={(e) =>
                setAdvancePaymentProvision(e.target.value === 'true')
              }
            >
              <FormControlLabel
                value="true"
                control={<Radio inputProps={{ 'data-testid': 'payment-terms-advance-payment-yes-radio' }} />}
                label={t('yes')}
              />
              <FormControlLabel
                value="false"
                control={<Radio inputProps={{ 'data-testid': 'payment-terms-advance-payment-no-radio' }} />}
                label={t('no')}
              />
            </RadioGroup>
          </FormControl>
        </Grid2>
      </Grid2>
    </Grid2>
  );
};

export default PaymentTerms;
