import React, { useEffect, useState, useCallback } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid2';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearIcon from '@mui/icons-material/Clear';
import InputAdornment from '@mui/material/InputAdornment';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';

const AddThresholdModal = ({
  open,
  onClose,
  onConfirm,
  approvalThresholds = [],
}) => {
  const { t: translate } = useTranslation();
  const [thresholds, setThresholds] = useState([]);
  const [errors, setErrors] = useState({});
  const [overValue, setOverValue] = useState('');
  const [overValueObj, setOverValueObj] = useState({});
  const [deletedThreshold, setDeletedThreshold] = useState([]);

  useEffect(() => {
    if (open) {
      const hasThresholds =
        approvalThresholds.length &&
        approvalThresholds.filter((at) => at?.to_value !== null).length;
      const initial = hasThresholds
        ? approvalThresholds
            .filter((at) => at?.to_value !== null)
            .map((t, idx) => ({
              ...t,
              id: t.id,
              uid: t.id,
              from_value: t.from_value,
              lockedFrom: idx !== 0,
            }))
        : [
            {
              id: null,
              uid: 0,
              from_value: '',
              to_value: '',
              lockedFrom: false,
              remove: false,
            },
          ];
      setThresholds(initial);
      setOverValueObj(approvalThresholds?.find((at) => at?.to_value === null));
      setErrors({});
    }
  }, [open, approvalThresholds]);

  useEffect(() => {
    const lastTo = parseFloat(thresholds[thresholds.length - 1]?.to_value);
    if (!isNaN(lastTo)) {
      setOverValue(lastTo + 1);
    } else {
      setOverValue('');
    }
  }, [thresholds]);

  const validateRow = useCallback(
    (row, index) => {
      const errs = {};
      const from_value = parseFloat(row.from_value);
      const to_value = parseFloat(row.to_value);

      if (index === 0 && (isNaN(from_value) || from_value < 1)) {
        errs.from_value = translate('threshold-from-err');
      }

      if (isNaN(to_value) || to_value <= from_value) {
        errs.to_value = translate('threshold-to-err');
      }

      return errs;
    },
    [translate],
  );

  const updateThreshold = useCallback(
    (index, key, value) => {
      const updated = [...thresholds];
      updated[index][key] = value;

      if (key === 'to_value' && index < updated.length - 1) {
        const nextFrom = parseFloat(value) + 1;
        if (!isNaN(nextFrom)) {
          updated[index + 1].from_value = nextFrom;
        }
      }
      setThresholds(updated);
    },
    [thresholds],
  );

  const addRow = useCallback(() => {
    const last = thresholds[thresholds.length - 1];
    const lastTo = parseFloat(last.to_value);
    if (isNaN(lastTo)) return;

    const newFrom = lastTo + 1;
    const newRow = {
      id: null,
      uid: Math.random(),
      from_value: newFrom,
      to_value: '',
      lockedFrom: true,
      remove: false,
    };
    setThresholds([...thresholds, newRow]);
  }, [thresholds]);

  const deleteRow = useCallback(
    (index) => {
      const updated = [...thresholds];

      const thresholdToRemove = updated[index];
      const isValid =
        Object.keys(validateRow(thresholdToRemove, index)).length === 0;
      if (thresholdToRemove?.id && isValid) {
        const deleteArray = deletedThreshold.length
          ? [...deletedThreshold]
          : [];
        deleteArray.push({
          id: thresholdToRemove.id,
          from_value: parseFloat(thresholdToRemove.from_value),
          to_value: parseFloat(thresholdToRemove.to_value),
          remove: true,
        });
        setDeletedThreshold(deleteArray);
      }

      updated.splice(index, 1);
      if (updated.length === 0) {
        setThresholds([]);
        return;
      }
      if (updated.length > 0) {
        if (index === 0) {
          updated[0].lockedFrom = false;
        } else if (index < updated.length) {
          const prevTo = parseFloat(updated[index - 1].to_value);
          if (!isNaN(prevTo)) {
            updated[index].from_value = prevTo + 1;
          }
        }
      }
      setThresholds(updated);
    },
    [deletedThreshold, thresholds, validateRow],
  );

  const handleConfirm = () => {
    let isValid = true;
    const newErrors = {};

    thresholds.forEach((row, idx) => {
      const rowErrors = validateRow(row, idx);
      if (Object.keys(rowErrors).length > 0) {
        isValid = false;
        newErrors[row.uid] = rowErrors;
      }
    });
    setErrors(newErrors);
    if (isValid) {
      const lastTo = parseFloat(thresholds[thresholds.length - 1]?.to_value);
      const over = !isNaN(lastTo) ? lastTo + 1 : null;

      let processedThresholds = thresholds.map(
        ({ id, lockedFrom, ...rest }) => ({
          id,
          from_value: parseFloat(rest.from_value),
          to_value: parseFloat(rest.to_value),
          ...(rest?.remove ? { remove: rest.remove } : { remove: false }),
        }),
      );

      if (processedThresholds.length > 0 || deletedThreshold.length > 0) {
        const newOverValue = {
          id: overValueObj?.id ? overValueObj.id : null,
          from_value: over === null ? 0 : over,
          to_value: null,
          remove: over === null,
        };
        processedThresholds = [
          ...processedThresholds,
          ...deletedThreshold,
          newOverValue,
        ];
        setDeletedThreshold([]);
        onConfirm(processedThresholds);
      } else {
        onClose();
      }
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth data-testid="add-threshold-modal">
      <DialogTitle>{translate('approval-thresholds')}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" mb={2}>
          {translate('threshold-group-text')}
        </Typography>

        {thresholds
          .filter((item) => item?.remove !== true)
          .map((row, i) => (
            <Grid
              container
              spacing={2}
              alignItems="center"
              wrap="nowrap"
              key={row.uid}
              sx={{
                mb:
                  errors[row.uid]?.from_value || errors[row.uid]?.to_value
                    ? 4
                    : 2,
              }}
            >
              <Grid size={5}>
                <TextField
                  label={translate('from')}
                  type="number"
                  variant="outlined"
                  value={row.from_value}
                  onChange={(e) =>
                    updateThreshold(i, 'from_value', e.target.value)
                  }
                  disabled={row.lockedFrom}
                  fullWidth
                  error={!!errors[row.uid]?.from_value}
                  helperText={errors[row.uid]?.from_value}
                  data-testid={`threshold-from-input-${i}`}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="end">£</InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => updateThreshold(i, 'from_value', '')}
                          sx={{ color: 'error.main' }}
                          disabled={row.lockedFrom}
                          data-testid={`threshold-from-clear-${i}`}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={5}>
                <TextField
                  label={translate('to')}
                  type="number"
                  variant="outlined"
                  value={row.to_value}
                  onChange={(e) =>
                    updateThreshold(i, 'to_value', e.target.value)
                  }
                  onBlur={() => {
                    const updated = [...thresholds];
                    if (i === thresholds.length - 1) {
                      const toVal = parseFloat(updated[i].to_value);
                      if (!isNaN(toVal)) {
                        setOverValue(toVal + 1);
                      }
                    }
                  }}
                  fullWidth
                  error={!!errors[row.uid]?.to_value}
                  helperText={errors[row.uid]?.to_value}
                  data-testid={`threshold-to-input-${i}`}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="end">£</InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={() => updateThreshold(i, 'to_value', '')}
                          sx={{ color: 'error.main' }}
                          data-testid={`threshold-to-clear-${i}`}
                        >
                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid size={2}>
                <Box
                  display="flex"
                  flexDirection="row"
                  alignItems="center"
                  gap={1}
                >
                  {thresholds.length > 0 && (
                    <IconButton onClick={() => deleteRow(i)} data-testid={`threshold-delete-row-${i}`}>
                      <DeleteIcon />
                    </IconButton>
                  )}

                  {i === thresholds.length - 1 && (
                    <IconButton onClick={addRow} data-testid="threshold-add-row-button">
                      <AddIcon />
                    </IconButton>
                  )}
                </Box>
              </Grid>
            </Grid>
          ))}

        <Typography sx={{ mt: 2 }} data-testid="threshold-over-value">
          {translate('over')} {overValue || '-'}
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} data-testid="add-threshold-cancel-button">{translate('cancel')}</Button>
        <Button variant="contained" onClick={handleConfirm} data-testid="add-threshold-confirm-button">
          {translate('confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddThresholdModal;
