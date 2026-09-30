import React from 'react';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';

const calculateCompletion = (value) => {
  const numValue = Number(value);
  if (isNaN(numValue)) return 0;
  if (numValue >= 100) return 100;
  return numValue;
};

const ProgressBar = ({
  currentCompletion = 0,
  setMissingHighlight = () => null,
}) => {
  const completion = calculateCompletion(currentCompletion);
  const percentage = `${completion}%`;
  return (
    <Grid container>
      <Grid item container xs={12} alignItems="baseline">
        <Grid item>
          <Typography variant="normal">Progress to complete</Typography>
        </Grid>
        <Grid item sx={{ width: '280px' }} p="0 10px">
          <LinearProgress
            variant="determinate"
            value={Number(completion)}
            sx={{
              height: 12,
              borderRadius: '15px',
            }}
          />
        </Grid>
        <Grid item>
          <Typography>{percentage}</Typography>
        </Grid>
      </Grid>
      <Grid item xs={12}>
        {completion !== 100 && (
          <Button variant="text" onClick={setMissingHighlight}>
            <Typography variant="normal">
              <FormatListNumberedIcon data-testid="list-icon" /> See what’s
              missing
            </Typography>
          </Button>
        )}
      </Grid>
    </Grid>
  );
};

ProgressBar.propTypes = {
  currentCompletion: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  setMissingHighlight: PropTypes.func,
};

ProgressBar.defaultProps = {
  currentCompletion: 0,
  setMissingHighlight: () => null,
};

export default ProgressBar;
