import React, { useState } from 'react';
import Grid2 from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import dayjs from 'dayjs';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useTranslation } from 'react-i18next';
import { CONSTANTS } from 'clink-components';

const { lightPeriwinkle } = CONSTANTS.colors.general;

const SectionalCompletionDates = ({
  globalDateForPossession,
  projectSections = [],
  onChangeGlobalDate,
  onAddSection,
  onUpdateSection,
  onRemoveSection,
  onClearAllSections,
}) => {
  const { t } = useTranslation();

  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleGlobalDateChange = (d) => {
    onChangeGlobalDate?.(d ? d.format('YYYY-MM-DD') : null);
  };

  const safeDayjs = (val) => (val ? dayjs(val) : null);

  return (
    <>
      <Grid2 size={{ xs: 12 }}>
        <Typography sx={{ fontWeight: 600, mt: 2 }}>
          {t('global-date-possesion')}
        </Typography>
      </Grid2>

      <Grid2 size={{ xs: 12 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              format="DD/MM/YYYY"
              label={t('global-date-possesion-optional')}
              value={globalDateForPossession ? dayjs(globalDateForPossession) : null}
              onChange={handleGlobalDateChange}
            />
          </LocalizationProvider>
        </LocalizationProvider>
      </Grid2>

      <Grid2 size={{ xs: 12 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('global-date-possesion-description')}
        </Typography>
      </Grid2>

      <Grid2 size={{ xs: 12, md: 6 }}>
        <Typography sx={{ fontWeight: 600, mb: 2 }}>
          {t('project-sections')}
        </Typography>
      </Grid2>

      <Grid2 size={{ xs: 12, md: 6 }} display="flex" justifyContent="flex-end">
        <Button
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={onAddSection}
        >
          {t('add-section')}
        </Button>
      </Grid2>

      <Grid2 size={{ xs: 12 }} sx={{ my: 3 }}>
        {projectSections.length === 0 ? (
          <>
            <Typography textAlign="center">
              <EventIcon
                sx={{
                  fontSize: 60,
                  color: 'text.secondary',
                  mb: 2,
                  opacity: 0.5,
                  textAlign: 'center',
                }}
              />
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
            >
              {t('no-sections-defined')}
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
            >
              {t('click-add-section')}
            </Typography>
          </>
        ) : (
          projectSections.map((section, index) => (
            <Grid2
              key={section.id ?? index}
              container
              spacing={2}
              sx={{
                mb: 3,
                p: 2,
                border: `1px solid ${lightPeriwinkle}`,
                borderRadius: 1,
              }}
            >
              <Grid2 size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('section')} {index + 1}
                </Typography>
              </Grid2>

              <Grid2 size={{ xs: 12, md: 5 }}>
                <TextField
                  label={t('section-name-number')}
                  variant="outlined"
                  fullWidth
                  value={section.name ?? ''}
                  onChange={(e) =>
                    onUpdateSection?.(index, 'name', e.target.value)
                  }
                  placeholder={t('section-name-placeholder')}
                />
              </Grid2>

              <Grid2 size={{ xs: 12, md: 3 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    format="DD/MM/YYYY"
                    label={t('date-for-possession-optional')}
                    value={safeDayjs(section.possessionDate)}
                    onChange={(d) =>
                      onUpdateSection?.(
                        index,
                        'possessionDate',
                        d ? d.format('YYYY-MM-DD') : '',
                      )
                    }
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid2>

              <Grid2 size={{ xs: 12, md: 3 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    format="DD/MM/YYYY"
                    label={t('date-for-completion')}
                    value={safeDayjs(section.completionDate)}
                    onChange={(d) =>
                      onUpdateSection?.(
                        index,
                        'completionDate',
                        d ? d.format('YYYY-MM-DD') : '',
                      )
                    }
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid2>

              <Grid2
                size={{ xs: 12, md: 1 }}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                <IconButton
                  onClick={() => onRemoveSection?.(index)}
                  color="error"
                  size="small"
                >
                  <DeleteIcon />
                </IconButton>
              </Grid2>
            </Grid2>
          ))
        )}

        {projectSections.length > 0 && (
          <Grid2 size={{ xs: 12 }} display="flex" justifyContent="flex-end">
            <Button
              variant="outlined"
              color="error"
              onClick={() => setConfirmOpen(true)}
            >
              {t('clear-all')}
            </Button>
          </Grid2>
        )}
      </Grid2>
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>{t('clear-all-sections')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mt: 1 }}>
            {`${t('clear-all-text-1')} ${projectSections.length === 1 ? '1 section' : `${projectSections.length} sections`} ${t('clear-all-text-2')}`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} variant="outlined">
            {t('cancel')}
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              setConfirmOpen(false);
              onClearAllSections?.();
            }}
          >
            {t('continue')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SectionalCompletionDates;
