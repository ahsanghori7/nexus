import React from 'react';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';

const { proxima_nova } = CONSTANTS.fonts;

const titleStyle = {
  pl: 4,
  pr: 4,
  pt: 2,
  fontSize: 24,
  fontWeight: 600,
  fontFamily: proxima_nova,
};
const Title = ({ text, testId }) => (
  <Typography data-testid={testId} {...titleStyle}>
    {text}
  </Typography>
);

export default Title;
export { titleStyle };
