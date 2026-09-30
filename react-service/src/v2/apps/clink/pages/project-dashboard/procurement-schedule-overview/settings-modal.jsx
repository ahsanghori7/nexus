import React, { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Grid2 from '@mui/material/Grid2';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Close, Info, Settings as SettingsIcon } from '@mui/icons-material';
import { useContext } from 'hooks/context';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import InputAdornment from '@mui/material/InputAdornment';
import EventIcon from '@mui/icons-material/Event';
import { fetchMilestones, isValidDate } from './procurementService';

export default function SettingsModal({
  overview,
  dispatch,
  contextType = 'clink',
}) {
  const context = useContext(contextType);
  const { actions } = context;
  const [open, setOpen] = useState(false);
  const [selectedTradeTypeId, setSelectedTradeTypeId] = useState(() => {
    return overview?.[0]?.id || '';
  });
  const tradeTypes = useMemo(
    () =>
      (overview || [])
        ?.map((item) => {
          return {
            id: item.id,
            name: item.package,
            startOnSiteUnformatted: item.startOnSiteUnformatted,
          };
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [overview],
  );
  const selectedTradeType = useMemo(() => {
    return tradeTypes.find((t) => t.id === selectedTradeTypeId) || null;
  }, [selectedTradeTypeId, tradeTypes]);
  const [startOnSiteDate, setStartOnSiteDate] = useState(dayjs());
  const [isDatePickerOpen, setDatePickerOpen] = useState(false);

  useEffect(() => {
    if (
      selectedTradeType?.startOnSiteUnformatted &&
      isValidDate(selectedTradeType.startOnSiteUnformatted)
    ) {
      setStartOnSiteDate(dayjs(selectedTradeType.startOnSiteUnformatted));
    } else {
      setStartOnSiteDate(dayjs()); // fallback to today if startOnSiteUnformatted is invalid
    }
  }, [selectedTradeType]);

  const milestones = useMemo(() => fetchMilestones(), []);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = () => {
    dispatch(
      actions.updateTender({
        tid: selectedTradeType.id,
        data: {
          start_on_site: startOnSiteDate.format('DD-MM-YYYY'),
        },
      }),
    );
    setOpen(false);
  };

  const handleTradeTypeChange = (event) => {
    setSelectedTradeTypeId(event.target.value);
  };

  const calculateMilestoneDate = (leadTime) => {
    if (!startOnSiteDate) return 'N/A';
    const date = startOnSiteDate.subtract(leadTime, 'week');
    return date.format('DD MMM YYYY');
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<SettingsIcon />}
        onClick={handleOpen}
        sx={{ ml: 2 }}
        data-testid="settings-modal-open-btn"
      >
        Settings
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        data-testid="settings-modal"
        PaperProps={{
          sx: {
            borderRadius: 1,
            boxShadow: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
          }}
        >
          <Typography variant="h6" component="div">
            Milestone Scheduling Settings
          </Typography>
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" paragraph>
            Milestone dates are calculated relative to Start on Site. Adjust the
            settings below to customize your procurement schedule.
          </Typography>

          <Grid2 container spacing={2} sx={{ mb: 3 }}>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Trade Type
              </Typography>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                  value={selectedTradeTypeId}
                  onChange={handleTradeTypeChange}
                  displayEmpty
                  inputProps={{ 'data-testid': 'settings-trade-type-select' }}
                >
                  <MenuItem value="">
                    <em>No specific trade</em>
                  </MenuItem>
                  {tradeTypes.map((trade) => (
                    <MenuItem key={trade.id} value={trade.id}>
                      {trade.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.5 }}
              >
                Selecting a trade type will apply trade-specific lead times
              </Typography>
            </Grid2>
            <Grid2 size={{ xs: 12, sm: 6 }}>
              <Typography variant="subtitle2" gutterBottom>
                Start on Site Date
              </Typography>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  format="DD/MM/YYYY"
                  value={startOnSiteDate}
                  onChange={setStartOnSiteDate}
                  open={isDatePickerOpen}
                  onOpen={() => setDatePickerOpen(true)}
                  onClose={() => setDatePickerOpen(false)}
                  slotProps={{
                    textField: {
                      onClick: () => setDatePickerOpen(true),
                      // TODO: Move this to MUI Theme
                      sx: { '& input': { pl: '0px !important' } },
                      InputProps: {
                        startAdornment: (
                          <InputAdornment position="start" sx={{ mr: 0 }}>
                            <IconButton
                              onClick={() => setDatePickerOpen(true)}
                              disabled={!selectedTradeTypeId}
                            >
                              <EventIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                        endAdornment: null,
                      },
                    },
                  }}
                  helperText="All milestone dates will be recalculated based on this date"
                  size="small"
                  disabled={!selectedTradeTypeId}
                />
              </LocalizationProvider>
            </Grid2>
          </Grid2>

          <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.03)' }}>
                  <TableCell>Milestone</TableCell>
                  <TableCell>Calculated Date</TableCell>
                  <TableCell>Lead Time (weeks)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {milestones.map((milestone) => {
                  const calculatedDate = calculateMilestoneDate(
                    milestone.defaultLeadTime,
                  );

                  return (
                    <TableRow key={milestone.id} data-testid={`settings-milestone-row-${milestone.id}`}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {milestone.name}
                          <Tooltip
                            title={milestone.description}
                            arrow
                            placement="top"
                          >
                            <Info
                              fontSize="small"
                              color="action"
                              sx={{ ml: 1, opacity: 0.6 }}
                            />
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>{calculatedDate}</TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          4 weeks
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} color="inherit" data-testid="settings-modal-cancel-btn">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            disabled={!selectedTradeTypeId}
            data-testid="settings-modal-save-btn"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
