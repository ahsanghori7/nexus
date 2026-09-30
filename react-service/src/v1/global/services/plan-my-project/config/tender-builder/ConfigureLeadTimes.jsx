import React, { useState, useMemo, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CloseIcon from '@mui/icons-material/Close';
import { clinkGreen } from 'v2/constants/colors';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import Alert from '@mui/material/Alert';
import i18next from 'i18next';
import { format } from 'date-fns';
import { DATE_FORMAT } from 'v1/global/helpers/constants';

const mapMilestonesToItems = (milestones) =>
  [...milestones]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((m) => ({
      id: m.id,
      name: m.label,
      type: m.type,
      weeks: m.lead_time,
      sort_order: m.sort_order,
    }));

const getInitialItems = (packageMilestones) => {
  if (packageMilestones?.milestones?.length) {
    return mapMilestonesToItems(packageMilestones.milestones);
  }
  return [];
};

const formatDate = (date) =>
  date instanceof Date ? format(date, DATE_FORMAT) : date;

const getChipStyles = (isAuto) => ({
  ml: 1,
  backgroundColor: isAuto ? `${clinkGreen}38` : 'grey.200',
  color: isAuto ? clinkGreen : 'text.secondary',
  fontWeight: 'medium',
  '& .MuiChip-deleteIcon': {
    color: isAuto ? clinkGreen : 'text.secondary',
    fontSize: '16px',
  },
});

const weeksInputSx = {
  width: 60,
  '& .MuiInputBase-root': { borderRadius: 2 },
  '& input': { textAlign: 'center', padding: '8px 0' },
  '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0,
  },
  '& input[type=number]': { MozAppearance: 'textfield' },
};

const TimelineDot = ({ isAuto }) => (
  <Box
    sx={{
      width: 12,
      height: 12,
      marginTop: '6px',
      borderRadius: '50%',
      backgroundColor: isAuto ? clinkGreen : 'grey.400',
      zIndex: 1,
    }}
  />
);

const TimelineConnector = () => (
  <Box sx={{ width: 2, flexGrow: 1, backgroundColor: 'grey.300', mt: 1 }} />
);

const TypeChip = ({ isAuto }) => (
  <Tooltip
    title={isAuto ? i18next.t('auto-tooltip') : i18next.t('manual-tooltip')}
  >
    <Chip
      label={isAuto ? i18next.t('auto') : i18next.t('manual')}
      size="small"
      onDelete={() => {}}
      deleteIcon={<InfoOutlinedIcon />}
      sx={getChipStyles(isAuto)}
    />
  </Tooltip>
);

const WeeksInput = ({ value, onChange, disabled }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
    <TextField
      type="text"
      value={value}
      onChange={(e) => {
        if (/^\d*$/.test(e.target.value)) onChange(e);
      }}
      onWheel={(e) => e.target.blur()}
      size="small"
      disabled={disabled}
      sx={weeksInputSx}
      inputProps={{ inputMode: 'numeric', pattern: '[0-9]*', min: 0 }}
    />
    <Typography variant="body2" color="text.secondary">
      {i18next.t('weeks')}
    </Typography>
  </Box>
);

const TimelineItem = ({
  item,
  isLast,
  handleWeekChange,
  startOnSiteDate,
  disabled,
}) => {
  const isAuto = item.type === 'automatic';
  return (
    <Box sx={{ display: 'flex', position: 'relative', mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mr: 2,
        }}
      >
        <TimelineDot isAuto={isAuto} />
        {!isLast && <TimelineConnector />}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isLast ? 'space-between' : 'flex-start',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="body1">{item.name}</Typography>
            <TypeChip isAuto={isAuto} />
          </Box>
          {isLast && startOnSiteDate && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontWeight: 'medium' }}
            >
              {formatDate(startOnSiteDate)}
            </Typography>
          )}
        </Box>
        {!isLast && (
          <WeeksInput
            value={item.weeks}
            onChange={handleWeekChange}
            disabled={disabled}
          />
        )}
      </Box>
    </Box>
  );
};

const LegendDot = ({ color }) => (
  <Box
    sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: color }}
  />
);

const Legend = ({ onReset, disabled }) => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LegendDot color="grey.400" />
        <Typography variant="body2">{i18next.t('manual')}</Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LegendDot color={clinkGreen} />
        <Typography variant="body2">{i18next.t('automatic')}</Typography>
      </Box>
    </Box>
    <Link
      component="button"
      underline="always"
      variant="body2"
      onClick={disabled ? undefined : onReset}
      sx={disabled ? { pointerEvents: 'none', color: 'text.disabled' } : {}}
    >
      {i18next.t('reset-to-defaults')}
    </Link>
  </Box>
);

const ConfigureLeadTimes = ({
  open,
  handleClose,
  packageName,
  startOnSiteDate,
  accountMilestones,
  packageMilestones,
  onSave,
}) => {
  const [leadTimeItems, setLeadTimeItems] = useState(() =>
    getInitialItems(packageMilestones),
  );

  const handleWeekChange = useCallback((index, newValue) => {
    setLeadTimeItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        weeks: newValue === '' ? 0 : parseInt(newValue, 10),
      };
      return updated;
    });
  }, []);

  const totalLeadTime = useMemo(
    () =>
      leadTimeItems
        .slice(0, -1)
        .reduce((acc, item) => acc + (item.weeks || 0), 0),
    [leadTimeItems],
  );

  const handleReset = useCallback(() => {
    setLeadTimeItems((prev) =>
      prev.map((item) => {
        const match = accountMilestones?.find(
          (am) => am.sort_order === item.sort_order,
        );
        return match ? { ...item, weeks: match.lead_time } : item;
      }),
    );
  }, [accountMilestones]);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {i18next.t('configure-lead-times')}
        <Typography variant="body2" color="text.secondary">
          {packageName} - {i18next.t('dates-cascade-backwards')}
        </Typography>
        <Legend onReset={handleReset} disabled={packageMilestones?.started} />
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ position: 'relative' }}>
          {leadTimeItems.length === 0 ? (
            <Alert severity="error">{i18next.t('error-fetching-milestones')}</Alert>
          ) : (
            leadTimeItems.map((item, index) => (
              <TimelineItem
                key={item.name}
                item={item}
                isLast={index === leadTimeItems.length - 1}
                handleWeekChange={(e) => handleWeekChange(index, e.target.value)}
                startOnSiteDate={startOnSiteDate}
                disabled={packageMilestones?.started}
              />
            ))
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Typography variant="body1" sx={{ mr: 'auto', fontWeight: 'medium' }}>
          {i18next.t('total-lead-time', { count: totalLeadTime })}
        </Typography>
        <Button onClick={handleClose}>{i18next.t('cancel')}</Button>
        <Button
          disabled={packageMilestones?.started}
          onClick={() => {
            const milestonesPayload = leadTimeItems.map((item) => ({
              id: item?.id,
              label: item?.name,
              lead_time: item?.weeks,
              sort_order: item?.sort_order,
            }));
            if (onSave) onSave(milestonesPayload);
            handleClose();
          }}
          variant="contained"
        >
          {i18next.t('save-lead-times')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfigureLeadTimes;
