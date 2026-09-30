import React, { useMemo } from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid2';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { numToPrice } from 'v1/quotes-tender/helpers/price';

const ProcurementScheduleHeader = ({
  totalPackages,
  procurementProgress,
  packagesAtRiskCount,
  summary,
}) => {
  const totalBudget = useMemo(() => {
    return summary?.budget || 0;
  }, [summary]);
  const totalVariance = useMemo(() => {
    return summary?.profit_loss || 0;
  }, [summary]);
  const totalActual = useMemo(() => {
    return summary?.forecast || 0;
  }, [summary]);

  const varianceColor = useMemo(() => {
    if (totalVariance > 0) return 'success.main';
    if (totalVariance < 0) return 'error.main';
    return 'text.secondary';
  }, [totalVariance]);

  return (
    <Grid container spacing={2} sx={{ mb: 4 }} data-testid="procurement-schedule-header">
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Card sx={{ height: '100%' }} data-testid="header-card-total-packages">
          <CardContent sx={{ p: 1.5 }}>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              Total Packages
            </Typography>
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: 'bold', fontSize: 20 }}
            >
              {totalPackages}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Card sx={{ height: '100%' }} data-testid="header-card-procurement-progress">
          <CardContent sx={{ p: 1.5 }}>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              Procurement Progress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
              <Typography
                variant="h6"
                component="div"
                sx={{ fontWeight: 'bold', fontSize: 20 }}
              >
                {procurementProgress.percentage}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {procurementProgress.ratio}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Card sx={{ height: '100%' }} data-testid="header-card-budget">
          <CardContent sx={{ p: 1.5 }}>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              Budget
            </Typography>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 'bold',
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'left',
                fontSize: 20,
              }}
            >
              {numToPrice(totalBudget)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Card sx={{ height: '100%' }} data-testid="header-card-actual">
          <CardContent sx={{ p: 1.5 }}>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              Actual
            </Typography>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 'bold',
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'left',
                fontSize: 20,
              }}
            >
              {numToPrice(totalActual)}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Card sx={{ height: '100%' }} data-testid="header-card-variance">
          <CardContent sx={{ p: 1.5 }}>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              Variance
            </Typography>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 'bold',
                fontVariantNumeric: 'tabular-nums',
                textAlign: 'left',
                fontSize: 20,
                color: varianceColor,
              }}
            >
              {totalVariance >= 0
                ? numToPrice(totalVariance)
                : `−${numToPrice(Math.abs(totalVariance))}`}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
        <Card sx={{ height: '100%' }} data-testid="header-card-packages-at-risk">
          <CardContent sx={{ p: 1.5 }}>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              Packages at Risk
            </Typography>
            <Typography
              variant="h6"
              component="div"
              sx={{ fontWeight: 'bold', fontSize: 20 }}
            >
              {packagesAtRiskCount}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default ProcurementScheduleHeader;
