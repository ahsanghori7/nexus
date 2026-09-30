import React from 'react';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import { CONSTANTS } from 'clink-components';
import { makeStyles } from '@mui/styles';
import Icon from '@mui/material/Icon';
import AngleDownIcon from '../../../global/public/images/svg/angle-down.svg';

const { clinkPurple, clinkLightPurple } = CONSTANTS.colors.general;
const { proxima } = CONSTANTS.fonts;

const tabStyle = {
  fontSize: '16px',
  padding: '4px 8px 12px',
  marginLeft: '6px',
  fontFamily: proxima,
  fontWeight: 0,
  textTransform: 'capitalize',
};

const inputStyle = {
  maxHeight: '40px',
  border: `1px solid ${clinkLightPurple}`,
  borderRadius: '4px',
  fontFamily: proxima,
};
// style fix to remove the white space on the left of the select because of missing label
const fieldsetStyle = {
  '& fieldset': {
    '& > legend': {
      width: '0',
    },
  },
};
const AngleDown = (props) => <Icon component={AngleDownIcon} {...props} />;

const NAME = 0;
const START_OLDEST = 1;
const START_NEWEST = 2;
const CREATED_OLDEST = 3;
const CREATED_NEWEST = 4;
const ProjectHeader = ({ useTab, useSort }) => {
  const [value, handleChange] = useTab;
  const [sort, setSort] = useSort;

  const useStyles = makeStyles({
    selected: {
      color: `${clinkPurple} !important`,
      fontWeight: '700 !important',
    },
    indicator: {
      backgroundColor: `${clinkPurple} !important`,
    },
  });
  const classes = useStyles();

  return (
    <Grid container justifyContent="space-between">
      <Grid item>
        <Tabs
          classes={{ indicator: classes.indicator }}
          value={value}
          onChange={handleChange}
        >
          <Tab
            sx={tabStyle}
            classes={{ selected: classes.selected }}
            className="project-panel-wrapper__header"
            label="Ongoing projects"
          />
          <Tab
            sx={tabStyle}
            classes={{ selected: classes.selected }}
            className="project-panel-wrapper__header"
            label="Archived projects"
          />
        </Tabs>
      </Grid>
      <Grid item>
        <FormControl fullWidth sx={fieldsetStyle}>
          <Select
            sx={inputStyle}
            value={sort}
            onChange={setSort}
            label="Sort by"
            labelId="sort-by"
            displayEmpty
            inputProps={{ 'aria-label': 'Without label' }}
            IconComponent={AngleDown}
          >
            <MenuItem value={NAME}>Project Name (ascending)</MenuItem>
            <MenuItem value={START_OLDEST}>
              Date Project Start (oldest first)
            </MenuItem>
            <MenuItem value={START_NEWEST}>
              Date Project Start (newest first)
            </MenuItem>
            <MenuItem value={CREATED_OLDEST}>
              Created date (oldest first)
            </MenuItem>
            <MenuItem value={CREATED_NEWEST}>
              Created date (newest first)
            </MenuItem>
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  );
};

export default ProjectHeader;
export { NAME, START_OLDEST, START_NEWEST, CREATED_OLDEST, CREATED_NEWEST };
