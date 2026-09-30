import React, { useMemo, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Alert from '@mui/material/Alert';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ChevronRight';
import moment from 'moment';
import { useTranslation } from 'react-i18next';
import { clinkGreen } from 'v2/constants/colors';
import i18next from 'i18next';

const getInitials = (fullName) => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts.map((p) => p[0]?.toUpperCase()).join('');
};

const formatDate = (date) => moment(date).format('DD/MM/YYYY');
const formatTime = (time) => moment(time).format('HH:mm');

const LogRow = ({ label, name, timestamp, comment, type, approvalMessage }) => (
  <>
    <Grid container spacing={2} alignItems="center" sx={{ my: 1, py: 1.5 }}>
      <Grid item xs={3}>
        <Typography
          variant="body2"
          sx={{ fontWeight: 600, textTransform: 'capitalize' }}
        >
          {label}
        </Typography>
      </Grid>
      <Grid item xs={5}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: clinkGreen,
              color: 'white',
            }}
          >
            {getInitials(name)}
          </Avatar>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {name}
            </Typography>
            {approvalMessage && (
              <Typography
                variant="body2"
                sx={{ fontSize: 11, color: clinkGreen, lineHeight: 1.3 }}
              >
                {approvalMessage}
              </Typography>
            )}
          </Box>
        </Box>
        {comment && type !== 'rejected' && (
          <Typography
            variant="body2"
            sx={{ mt: 0.5, color: 'text.secondary', wordBreak: 'break-word' }}
          >
            {comment}
          </Typography>
        )}
      </Grid>
      <Grid item xs={2} sx={{ textAlign: 'right' }}>
        <Typography variant="body2">{formatDate(timestamp)}</Typography>
      </Grid>
      <Grid item xs={2} sx={{ textAlign: 'right' }}>
        <Typography variant="body2">{formatTime(timestamp)}</Typography>
      </Grid>
    </Grid>
    {comment && type === 'rejected' && (
      <Alert severity="error" sx={{ mb: 1.5, wordBreak: 'break-word' }}>
        <Typography variant="body2" sx={{ color: 'error.main' }}>
          {i18next.t('rejection-reason')}: {comment}
        </Typography>
      </Alert>
    )}
  </>
);

const ApprovalLevelSection = ({ level }) => (
  <Box sx={{ mb: 2 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        Level {level.level}
      </Typography>
      <Chip label={level.rule} size="small" />
    </Box>
    {(level.entries || []).map((entry, index) => (
      <Box
        key={`${level.level}_${entry.type}_${entry.user}_${entry.timestamp}`}
      >
        <LogRow
          label={entry.type}
          name={entry.user}
          timestamp={entry.timestamp}
          comment={entry.comment || undefined}
          type={entry.type}
          approvalMessage={entry?.label}
        />
        {index < level.entries.length - 1 && <Divider sx={{ mb: 1 }} />}
      </Box>
    ))}
  </Box>
);

const LogsModal = ({
  open,
  onClose,
  allLogs,
  headerTitle,
  entity,
  entity_no,
  package_name,
}) => {
  const { t } = useTranslation();
  const logs = useMemo(() => allLogs || [], [allLogs]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          {headerTitle}
          {(entity_no || package_name) && (
            <Typography variant="subtitle2" color="text.secondary">
              {entity_no && (
                <Typography component="span" variant="subtitle2">
                  <Typography
                    component="span"
                    style={{ fontWeight: 700, textTransform: 'capitalize' }}
                  >
                    {entity}:
                  </Typography>{' '}
                  {entity_no}
                </Typography>
              )}

              {entity_no && package_name && (
                <Typography component="span" sx={{ mx: 0.5 }}>
                  |
                </Typography>
              )}

              {package_name && (
                <Typography component="span" variant="subtitle2">
                  <Typography component="span" style={{ fontWeight: 700 }}>
                    {t('package')}:
                  </Typography>{' '}
                  {package_name}
                </Typography>
              )}
            </Typography>
          )}
        </Box>
        <IconButton onClick={handleClose} sx={{ padding: 0 }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider sx={{ marginBottom: 2 }} />
      <DialogContent>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={3}>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', fontWeight: 800 }}
            >
              {t('action')}
            </Typography>
          </Grid>
          <Grid item xs={5}>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', fontWeight: 800 }}
            >
              {t('user')}
            </Typography>
          </Grid>
          <Grid item xs={2} sx={{ textAlign: 'right' }}>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', fontWeight: 800 }}
            >
              {t('date')}
            </Typography>
          </Grid>
          <Grid item xs={2} sx={{ textAlign: 'right' }}>
            <Typography
              variant="body2"
              sx={{ color: 'text.secondary', fontWeight: 800 }}
            >
              {t('time')}
            </Typography>
          </Grid>
        </Grid>

        {logs.length > 0 ? (
          logs.map((log, index) => {
            const isLast = index === logs.length - 1;
            if (log.type === 'approval_request') {
              return (
                <Box key={`approval_${log.instance}_${log.timestamp}`}>
                  <Accordion
                    defaultExpanded
                    disableGutters
                    elevation={0}
                    sx={{ '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        px: 0,
                        flexDirection: 'row-reverse',
                        gap: 1,
                        minHeight: 'unset',
                        '& .MuiAccordionSummary-content': { my: 1 },
                        '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded':
                          {
                            transform: 'rotate(90deg)',
                          },
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, fontSize: '16px' }}
                      >
                        {log.heading}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0, pt: 0 }}>
                      <LogRow
                        label={log.label}
                        name={log.user}
                        timestamp={log.timestamp}
                        comment={log.comment || undefined}
                      />
                      <Divider sx={{ mb: 1 }} />
                      {(log.levels || []).map((level) => (
                        <ApprovalLevelSection key={level.level} level={level} />
                      ))}
                    </AccordionDetails>
                  </Accordion>
                  {!isLast && <Divider />}
                </Box>
              );
            }

            return (
              <Box key={`${log.type}_${log.user}_${log.timestamp}`}>
                <LogRow
                  label={log.label}
                  name={log.user}
                  timestamp={log.timestamp}
                  comment={log.comment}
                  type={log.type}
                />
                {!isLast && <Divider />}
              </Box>
            );
          })
        ) : (
          <Typography>{t('no-logs-available')}</Typography>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LogsModal;
