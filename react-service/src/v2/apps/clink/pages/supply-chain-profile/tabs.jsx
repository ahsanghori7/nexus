import React, { useState } from 'react';
import SwipeableViews from 'react-swipeable-views';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import { CONSTANTS } from 'clink-components';
import { Tabs, Tab } from './StyledTabs';
import { MuiToggleButton } from './mui.styled';

const { clinkLightPurple, white, clinkBackgroundPurple } =
  CONSTANTS.colors.general;

const TabPanel = ({ children, value, index, colorTheme, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box
          sx={{
            px: { xs: 0, sm: 1 },
            py: { xs: 0, sm: 2 },
            backgroundColor: {
              xs: clinkBackgroundPurple,
              lg: colorTheme ?? 'transparent',
            },
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index) => {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
    sx: { textTransform: 'capitalize', padding: 0, minHeight: '30px' },
  };
};

const MuiTabs = ({ tabs = [], nested, accordion, colorTheme }) => {
  const theme = useTheme();
  const [value, setValue] = useState(0);
  const [isCloseVisible, setIsCloseVisible] = useState(false);
  const largeScreen = useMediaQuery(theme.breakpoints.up('lg'));

  const handleChange = (_e, newValue) => {
    setValue(newValue);
  };

  const handleChangeIndex = (index) => {
    setValue(index);
  };

  const handleClick = () => {
    setIsCloseVisible((prev) => !prev);
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        width: '100%',
        display: 'flex',
        flexFlow: 'column',
        border: nested ? `1px solid ${clinkLightPurple}` : 0,
        borderRadius: '8px',
        mt: nested ? 4 : 0,
      }}
    >
      <AppBar
        position="static"
        sx={{
          minHeight: 'unset',
          bgcolor: 'transparent',
          boxShadow: 'none',
          border: 0,
          '& .MuiButtonBase-root': {
            backgroundColor: {
              xs: white,
              lg: colorTheme ? white : clinkBackgroundPurple,
            },
            '&.Mui-selected': {
              backgroundColor: {
                xs: clinkBackgroundPurple,
                lg: colorTheme ?? white,
              },
            },
          },
        }}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="secondary"
          textColor="inherit"
          variant={
            useMediaQuery(theme.breakpoints.up('sm'))
              ? 'fullWidth'
              : 'scrollable'
          }
          scrollButtons="auto"
          aria-label="StyledTabs"
        >
          {tabs.map((tab, i) => (
            <Tab
              closed={`${isCloseVisible}`}
              accordion={`${accordion}`}
              key={tab.id}
              label={tab.title}
              {...a11yProps(i)}
            />
          ))}
          {largeScreen && accordion && (
            <MuiToggleButton
              handleClick={handleClick}
              isCloseVisible={isCloseVisible}
            />
          )}
        </Tabs>
      </AppBar>
      <SwipeableViews
        axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
        index={value}
        onChangeIndex={handleChangeIndex}
        style={{ display: !largeScreen || !isCloseVisible ? 'block' : 'none' }}
      >
        {tabs.map((tab, i) => (
          <TabPanel
            colorTheme={colorTheme}
            key={tab.id}
            value={value}
            index={i}
            dir={theme.direction}
          >
            <tab.Content />
          </TabPanel>
        ))}
      </SwipeableViews>
    </Box>
  );
};

export default MuiTabs;
