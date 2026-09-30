import React from 'react';
import Tab from '@mui/material/Tab';

const SUMMARY_LABEL = 'Summary';
const SummaryTab = ({ handleTabClick, sx = {} }) => (
  <Tab
    key={SUMMARY_LABEL}
    label={SUMMARY_LABEL}
    onClick={() => handleTabClick(SUMMARY_LABEL)}
    sx={sx}
  />
);

export default SummaryTab;
export { SUMMARY_LABEL };
