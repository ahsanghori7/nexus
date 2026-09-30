import React, { useState, useMemo, useEffect } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import i18next from 'v2/helpers/i18n';
import { CONSTANTS } from 'clink-components';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import disabledTextFieldSx from './disabledSx';
import { Typography } from '@mui/material';

const { clinkGreen, clinkRed } = CONSTANTS.colors.general;

const PricingSummary = ({
  recommendedSubcontractorId,
  pricingSummary,
  project,
  tenderRecommendationById,
  dispatch,
  contextType = 'clink',
  approvalRequestSent,
  onForecastsChange,
}) => {
  const context = useContext(contextType);
  const { actions } = context;

  const initialRows = useMemo(() => {
    if (!pricingSummary || !Array.isArray(pricingSummary)) return [];
    return pricingSummary.map((item) => ({
      transaction_id: item.transaction_id,
      subcontractor_id: item.subcontractor?.id,
      subcontractor_name: item.subcontractor?.name || '',
      subcontractor_sum: item.quoted_price || 0,
      forecast: item.forecast ?? item.quoted_price ?? 0,
      budget: item.budget || 0,
      profit_loss:
        (item.budget || 0) - (item.forecast ?? item.quoted_price ?? 0),
      originalForecast: item.forecast ?? item.quoted_price ?? 0,
    }));
  }, [pricingSummary]);
  const [rows, setRows] = useState(initialRows);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setRows(initialRows);
    setErrors({});
  }, [initialRows]);

  useEffect(() => {
    if (onForecastsChange) {
      onForecastsChange(rows);
    }
  }, [rows, onForecastsChange]);

  const handleForecastChange = (index) => (event) => {
    const value = event.target.value;
    const numericForecast = value === '' ? 0 : Number(value);

    if (errors[index]) {
      setErrors((prev) => {
        const updated = { ...prev };
        return updated;
      });
    }

    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              forecast: value === '' ? '' : numericForecast,
              profit_loss: row.budget - numericForecast,
            }
          : row,
      ),
    );
  };

  const handleForecastBlur = (index) => () => {
    const currentRow = rows[index];
    const forecastValue = Number(currentRow.forecast);

    if (forecastValue < 0) {
      setErrors((prev) => ({
        ...prev,
        [index]: i18next.t('forecast-must-be-positive'),
      }));

      setRows((prev) =>
        prev.map((row, i) =>
          i === index
            ? {
                ...row,
                forecast: row.originalForecast,
                profit_loss: row.budget - row.originalForecast,
              }
            : row,
        ),
      );
      return;
    }

    const project_id = project?.data?.id;
    const package_id = tenderRecommendationById?.package_id;
    const transaction_id = currentRow.transaction_id;

    const currentForecast = Number(currentRow.forecast);
    const originalForecast = Number(currentRow.originalForecast);

    if (
      project_id &&
      package_id &&
      transaction_id &&
      currentForecast !== originalForecast
    ) {
      dispatch(
        actions.updateTenderRecommendationPricingSummary({
          project_id,
          package_id,
          transaction_id,
          data: {
            forecast: currentRow.forecast,
          },
        }),
      );
    }
  };

  return (
    <TableContainer data-testid="tr-pricing-summary-table" component={Paper}>
      <Table aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>
              {i18next.t('subcontractor-name')}
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              {i18next.t('subcontractor-sum')}
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              {i18next.t('forecast-final-cost')}
              <Tooltip title={i18next.t('forecast-final-cost-tooltip')} arrow>
                <HelpOutlineIcon
                  fontSize="small"
                  sx={{ ml: 0.5, verticalAlign: 'middle', cursor: 'pointer' }}
                />
              </Tooltip>
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              {i18next.t('budget')}
            </TableCell>
            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
              {i18next.t('profit-loss')}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => {
            const isRecommended = Number(row.subcontractor_id) === Number(recommendedSubcontractorId);
            return (
              <TableRow
                key={row.transaction_id}
                sx={{
                  '&:last-child td, &:last-child th': { border: 0 },
                  ...(isRecommended && {
                    backgroundColor: 'rgba(0, 128, 128, 0.08)',
                    borderLeft: `4px solid ${clinkGreen}`,
                  }),
                }}
              >
                <TableCell component="th" scope="row">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Tooltip title={i18next.t('forecast-final-cost-tooltip')} arrow>
                      <span>{row.subcontractor_name}</span>
                    </Tooltip>
                    {isRecommended && (
                      <Chip
                        label="Recommended"
                        size="small"
                        sx={{
                          backgroundColor: clinkGreen,
                          color: 'white',
                          fontWeight: 500,
                          height: '20px',
                          fontSize: '0.75rem',
                        }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="center">{row.subcontractor_sum}</TableCell>
                <TableCell align="center">
                  <TextField
                    data-testid={`tr-forecast-input-${index}`}
                    type="number"
                    size="small"
                    sx={{ width: 200, ...disabledTextFieldSx }}
                    value={row.forecast}
                    onChange={handleForecastChange(index)}
                    onBlur={handleForecastBlur(index)}
                    error={!!errors[index]}
                    helperText={errors[index]}
                    disabled={
                      approvalRequestSent ||
                      tenderRecommendationById?.status === 'Pending'
                    }
                    slotProps={{
                      input: {
                        inputProps: { min: 0, style: { textAlign: 'center' } },
                      },
                    }}
                  />
                </TableCell>
                <TableCell align="center">{row.budget}</TableCell>
                <TableCell
                  align="center"
                  sx={{
                    color: row.profit_loss >= 0 ? clinkGreen : clinkRed,
                    fontWeight: 'bold',
                  }}
                >
                  {row.profit_loss >= 0
                    ? row.profit_loss
                    : `(${Math.abs(row.profit_loss)})`}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const mapStateToProps = (state) => ({
  pricingSummary: state.tenderRecommendation.pricingSummary,
  project: state.project,
  tenderRecommendationById: state.tenderRecommendation.tenderRecommendationById,
});

export default connect(mapStateToProps)(PricingSummary);
