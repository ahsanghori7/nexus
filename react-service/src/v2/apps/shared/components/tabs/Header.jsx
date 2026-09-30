import React from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import TabsMui from '@mui/material/Tabs';
import TabMui from '@mui/material/Tab';
import { CONSTANTS } from 'clink-components';

const { darkJungleGreen, blueMagentaViolet } = CONSTANTS.colors.general;

const a11yProps = (index) => ({
  id: `simple-tab-${index}`,
  'aria-controls': `simple-tabpanel-${index}`,
});

const Header = ({
  tabs = [],
  page = 0,
  setPage,
  maxWidth = 'none',
  block = false,
}) => (
  <Box
    sx={{
      borderBottom: 1,
      borderColor: 'rgba(0, 0, 0, .3)',
      flexBasis: '100%',
      marginLeft: '-41px',
      marginRight: '-41px',
      pointerEvents: block ? 'none' : 'initial',
    }}
  >
    <Container sx={{ maxWidth }}>
      <TabsMui
        value={page}
        onChange={(_e, newTab) => setPage(newTab)}
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
        TabIndicatorProps={{
          style: {
            backgroundColor: blueMagentaViolet,
            height: '3px',
          },
        }}
      >
        {tabs.map((tab, i) => (
          <TabMui
            key={tab.id}
            sx={{
              textTransform: 'none',
              color: darkJungleGreen,
              fontSize: { xs: '16px', md: '14px' },
              marginLeft: '12px!important',
              marginRight: '12px!important',
              padding: '0px!important',
              alignItems: 'baseline',
              minWidth: 'initial',
              overflow: 'unset',
              '&.Mui-selected': {
                color: blueMagentaViolet,
                fontWeight: 'bold',
              },
            }}
            label={tab.title}
            {...a11yProps(i)}
          />
        ))}
      </TabsMui>
    </Container>
  </Box>
);

export default Header;
