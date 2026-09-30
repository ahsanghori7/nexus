import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import Tab from '@mui/material/Tab';

const ADD_LABEL = 'Add';
const AddTab = ({ handleTabClick, sx }) => (
  <Tab
    key={ADD_LABEL}
    icon={<AddIcon />}
    iconPosition="start"
    label={ADD_LABEL}
    onClick={() => handleTabClick(ADD_LABEL)}
    sx={sx}
  />
);

export default AddTab;
export { ADD_LABEL };
