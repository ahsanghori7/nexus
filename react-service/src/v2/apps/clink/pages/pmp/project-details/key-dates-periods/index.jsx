import React, { useEffect, useMemo } from 'react';
import Alert from '@mui/material/Alert';
import Typography from '@mui/material/Typography';
import Grid2 from '@mui/material/Grid2';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { CONSTANTS } from 'clink-components';
import { useTranslation } from 'react-i18next';
import SectionalCompletionDates from './SectionalCompletionDates';
import { normalizeSections } from '../helpers';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const KeyDates = ({ useUpdateProject = {} }) => {
  const { t } = useTranslation();

  const {
    useDatePossessionSite: [datePossessionSite, setDatePossessionSite],
    useSectionalCompletionDates: [
      sectionalCompletionDates,
      setSectionalCompletionDates,
    ],
    useReviewPeriodDrawings: [reviewPeriodDrawings, setReviewPeriodDrawings],
    useAdvanceWarningPeriod: [advanceWarningPeriod, setAdvanceWarningPeriod],
    useErrorKeyDates: [errors],
    useGlobalDateForPossession: [
      globalDateForPossession,
      setGlobalDateForPossession,
    ],
    useProjectSections: [projectSections, setProjectSections],
  } = useUpdateProject;

  const sectionalCompletionValue = useMemo(() => {
    if (sectionalCompletionDates === true) return 'true';
    if (sectionalCompletionDates === false) return 'false';
    return '';
  }, [sectionalCompletionDates]);

  const sections = useMemo(
    () => normalizeSections(projectSections),
    [projectSections],
  );

  useEffect(() => {
    if (globalDateForPossession && sections.length > 0) {
      const hasEmptyPossessionDates = sections.some(
        (section) => !section.possessionDate,
      );

      if (hasEmptyPossessionDates) {
        const updatedSections = sections.map((section) => ({
          ...section,
          possessionDate: !section.possessionDate
            ? globalDateForPossession
            : section.possessionDate,
        }));
        setProjectSections(updatedSections);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalDateForPossession, sections]);

  const addSection = () => {
    const newSection = {
      id: Date.now(),
      name: '',
      possessionDate: globalDateForPossession || '',
      completionDate: '',
    };
    setProjectSections([...sections, newSection]);
  };

  const updateSection = (index, field, value) => {
    const updated = [...sections];
    updated[index][field] = value;
    setProjectSections(updated);
  };

  const removeSection = (index) => {
    setProjectSections(sections.filter((_, i) => i !== index));
  };

  const clearAllSections = () => setProjectSections([]);

  const handleGlobalDateChange = (value) => {
    let next = null;
    if (value != null) {
      const d = dayjs.isDayjs(value) ? value : dayjs(value);
      if (d.isValid()) next = d.format('YYYY-MM-DD');
    }
    setGlobalDateForPossession(next);
  };

  return (
    <Grid2
      size={{ xs: 12, md: 4 }}
      sx={{ width: '100% !important' }}
      container
      flexDirection="column"
    >
      <Grid2 borderBottom={`1px solid ${lightPeriwinkle}`} p={1.75}>
        <Typography sx={{ fontWeight: 600 }}>
          {t('key-dates-periods')}
        </Typography>
      </Grid2>

      {errors?.length > 0 && (
        <Grid2 p={1.75}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.map((error) => (
              <Typography key={error} variant="body2">
                {t(error)}
              </Typography>
            ))}
          </Alert>
        </Grid2>
      )}

      <Grid2 p={1.75} container spacing={2}>
        <Grid2 size={{ xs: 12, md: 6 }}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              format="DD/MM/YYYY"
              label={t('date-possestion-site')}
              value={datePossessionSite ? dayjs(datePossessionSite) : null}
              onChange={(e) =>
                setDatePossessionSite(e ? e.format('YYYY-MM-DD') : '')
              }
              slotProps={{
                textField: {
                  inputProps: {
                    'data-testid': 'key-dates-possession-date-input',
                  },
                },
              }}
            />
          </LocalizationProvider>
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid': 'key-dates-review-period-drawings-input',
              },
            }}
            label={t('review-period-drawings')}
            variant="outlined"
            fullWidth
            value={reviewPeriodDrawings}
            onChange={(e) => setReviewPeriodDrawings(e.target.value)}
            placeholder={t('review-period-drawings-eg')}
          />
        </Grid2>

        <Grid2 size={{ xs: 12, md: 6 }}>
          <TextField
            slotProps={{
              htmlInput: {
                'data-testid': 'key-dates-advance-warning-period-input',
              },
            }}
            label={t('advance-warning-notification')}
            variant="outlined"
            fullWidth
            value={advanceWarningPeriod}
            onChange={(e) => setAdvanceWarningPeriod(e.target.value)}
          />
        </Grid2>

        <Grid2 size={{ xs: 12 }}>
          <Typography sx={{ fontWeight: 600 }}>
            {t('sectional-completion-dates')}
          </Typography>
        </Grid2>

        <Grid2 size={{ xs: 12 }}>
          <FormControl>
            <FormLabel>{t('sectional-completion-dates-req')}</FormLabel>
            <RadioGroup
              row
              value={sectionalCompletionValue}
              onChange={(e) => {
                setSectionalCompletionDates(e.target.value === 'true');
                setProjectSections([]);
              }}
            >
              <FormControlLabel
                value="true"
                control={
                  <Radio
                    inputProps={{
                      'data-testid': 'key-dates-sectional-completion-yes-radio',
                    }}
                  />
                }
                label={t('yes')}
              />
              <FormControlLabel
                value="false"
                control={
                  <Radio
                    inputProps={{
                      'data-testid': 'key-dates-sectional-completion-no-radio',
                    }}
                  />
                }
                label={t('no')}
              />
            </RadioGroup>
          </FormControl>
        </Grid2>

        {sectionalCompletionDates && (
          <SectionalCompletionDates
            globalDateForPossession={globalDateForPossession}
            projectSections={sections}
            onChangeGlobalDate={handleGlobalDateChange}
            onAddSection={addSection}
            onUpdateSection={(index, field, value) =>
              updateSection(index, field, value)
            }
            onRemoveSection={(index) => removeSection(index)}
            onClearAllSections={clearAllSections}
          />
        )}
      </Grid2>
    </Grid2>
  );
};

export default KeyDates;
