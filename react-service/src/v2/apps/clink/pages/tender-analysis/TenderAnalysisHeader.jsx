import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import i18next from 'v2/helpers/i18n';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';
import { CONSTANTS } from 'clink-components';
import Loading from 'v2/apps/shared/components/Loading';
import Modal from 'v2/apps/clink/pages/orders/subcontractors/modal';
import flag from 'v2/helpers/flags';
import { MuiEllipsisTooltip } from './styled/mui';
import Summary from './summary';

/**
 * generic colours used in the app
 * @type {number}
 */
const { white, clinkPurple, clinkLightPurple } = CONSTANTS.colors.general;

/**
 *  Show the correct panel based on the index, if its 0 then its summary,
 *  else use the content from the tabs array and show a subcontractor quote page
 * @param props
 * @returns {JSX.Element}
 * @constructor
 */
const TabPanel = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
    >
      {value === index && (
        <Box sx={{ display: 'block', padding: '20px 0' }}>{children}</Box>
      )}
    </div>
  );
};

const CanCompareTooltip = () => (
  <MuiEllipsisTooltip tooltipDesc={i18next.t('ta-summary')}>
    {i18next.t('can-compare-quote')}
  </MuiEllipsisTooltip>
);

const TenderAnalysisHeader = ({
  tabsArray = [],
  loading = { message: 'Loading' },
  quoteTableItems,
  items,
  totalBudget,
  slug,
  tid,
}) => {
  /**
   * State handlers
   *
   * - setOpen : Open a Modal for something
   * - setTabValue : Handlers the transition of tabs
   * - navigate : page redirection from tabs
   * **/
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [canCompare, setCanCompare] = useState(false);

  /**
   * OnChange of Tabs, set new tab index
   * @param newValue
   */
  const handleChange = (event, newValue) => {
    if (newValue > 0) {
      navigate(
        `/main-contractor/project/${slug}/boq/${tid}/quote/${
          quoteTableItems[newValue - 1].id
        }`,
      );
      setTabValue(newValue);
    } else if (canCompare) {
      navigate(`/main-contractor/project/${slug}/boq/${tid}/quote/summary`);
    }
  };

  useEffect(() => {
    setCanCompare(quoteTableItems.length >= 2);
    const quoteId = location.pathname.split('/').pop();
    if (quoteId === 'summary' && canCompare) {
      setTabValue(0);
    } else {
      const index = quoteTableItems.findIndex(
        (item) => item.id.toString() === quoteId,
      );
      if (index !== -1) {
        setTabValue(index + 1);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, quoteTableItems]);

  const tabsConfig = flag('HIDE_TABS')
    ? {
        variant: 'scrollable',
        scrollButtons: true,
        allowScrollButtonsMobile: true,
      }
    : {};

  return (
    <>
      <Modal open={open} setOpen={setOpen} />
      <Box>
        {loading && loading.message ? (
          <Loading status={loading.message} />
        ) : (
          <>
            <Box
              sx={{
                backgroundColor: white,
                border: `1px solid ${clinkLightPurple}`,
                borderRadius: '8px',
              }}
            >
              <AppBar
                position="static"
                sx={{
                  backgroundColor: white,
                  color: clinkPurple,
                  minHeight: 'auto',
                  borderRadius: '8px',
                  boxShadow: 'none',
                }}
              >
                <Grid container justifyContent="space-between" value={0}>
                  <Grid item xs={6} sm={8} lg={9.8}>
                    <Tabs
                      value={tabValue}
                      onChange={handleChange}
                      aria-label="tabs boq"
                      {...tabsConfig}
                      sx={{
                        backgroundColor: white,
                        color: clinkPurple,
                        borderRadius: '8px',
                        '& .MuiTabs-root': {
                          paddingBottom: 0,
                        },
                        '& .Mui-selected.MuiTab-root': {
                          color: clinkPurple,
                        },
                        '& .MuiTabs-indicator': {
                          backgroundColor: clinkPurple,
                        },
                      }}
                    >
                      <Tab
                        key="summary"
                        label={
                          canCompare ? i18next.t('ta-summary') : <CanCompareTooltip />
                        }
                      />
                      {tabsArray.map((tab) => (
                        <Tab key={tab.label} label={tab.label} />
                      ))}
                    </Tabs>
                  </Grid>
                </Grid>
              </AppBar>
            </Box>
            <TabPanel value={tabValue} index={0}>
              <Summary
                totalBudget={totalBudget}
                theme="clink"
                quoteTableItems={quoteTableItems}
                items={items}
              />
            </TabPanel>
            {tabsArray.map((tab, i) => (
              <TabPanel key={tab.label} value={tabValue} index={i + 1}>
                {tab.content}
              </TabPanel>
            ))}
          </>
        )}
      </Box>
    </>
  );
};

export { TenderAnalysisHeader };
