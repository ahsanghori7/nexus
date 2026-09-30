import React, { useEffect, useRef } from 'react';
import i18next from 'v2/helpers/i18n';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import PropTypes from 'prop-types';
import { CONSTANTS } from 'clink-components';
import {
  MuiSubmitWrapper,
  MuiGreetingSection,
  ProgressBar,
} from 'v2/apps/shared/components/company-v2/Mui.styled';

const FIRST_TAB = 0;
const { white } = CONSTANTS.colors.general;
const { prosperBoxRed } = CONSTANTS.colors.prosper;

const TabPanel = ({ children, value, index, ...other }) => (
  <div
    role="tabpanel"
    hidden={value !== index}
    id={`simple-tabpanel-${index}`}
    aria-labelledby={`simple-tab-${index}`}
    {...other}
  >
    {value === index && <Box>{children}</Box>}
  </div>
);

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

const BUFFER = 60;
const TOP_POS = 160;
const BOTTOM_POS = 783;
const Content = ({
  tabs = [],
  page = 0,
  maxWidth = 'none',
  setPage = () => null,
  percentComplete = 0,
  showPercent,
  lastStepSave,
  lastStepFunction = () => null,
  hideActionButtonsInTabs = [FIRST_TAB],
  countryCode = 'UK',
  contextType = 'prosper',
}) => {
  const fixedBoxRef = useRef(null);
  const isProsper = contextType === 'prosper';

  const handleScroll = () => {
    const fixedBox = fixedBoxRef && fixedBoxRef.current;
    const windowHeight = document.documentElement.scrollHeight;
    if (fixedBox) {
      const scrollPosition = window.scrollY;
      const topCheck = scrollPosition > TOP_POS - BUFFER;
      const bottomCheck = windowHeight - scrollPosition > BOTTOM_POS;
      if (topCheck && bottomCheck) {
        fixedBox.style.top = `${TOP_POS}px`;
        fixedBox.style.position = 'fixed';
      } else {
        fixedBox.style.top = 'initial';
        fixedBox.style.position = 'relative';
      }
    } else {
      fixedBox.style.top = 'initial';
      fixedBox.style.position = 'relative';
    }
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <Container sx={{ maxWidth }}>
      <Container
        sx={{
          maxWidth,
          width: '100%',
          display: 'flex',
          padding: '0 !important',
          flexDirection: {
            xs: 'column-reverse',
            md: 'row',
            flexWrap: { xs: 'wrap', md: 'nowrap' },
          },
        }}
      >
        <Box
          sx={{
            flexBasis: '50%',
            '& label': {
              color: prosperBoxRed,
              marginBottom: '8px',
              fontSize: '14px',
              marginTop: '24px',
              fontWeight: 'bold',
            },
          }}
        >
          {tabs.map((tab, i) => (
            <TabPanel key={tab.id} value={page} index={i}>
              <tab.Content page={page} setPage={setPage} />
            </TabPanel>
          ))}
        </Box>
        <Box
          sx={{
            display: { xs: 'none', md: 'initial' },
            flexBasis: '50%',
            padding: '40px 30px 30px',
            boxSizing: 'border-box',
            maxWidth: '460px',
            margin: ' 0 auto',
            '& .MuiCardMedia-root': { backgroundColor: white },
          }}
        >
          <Box
            ref={fixedBoxRef}
            sx={{
              maxWidth: '400px',
            }}
          >
            {showPercent && <ProgressBar percentComplete={percentComplete} />}
            {countryCode === 'UK' && <MuiGreetingSection />}
          </Box>
        </Box>
      </Container>
      {!hideActionButtonsInTabs.includes(page) && (
        <MuiSubmitWrapper prequal>
          <Button
            color="primary"
            variant="contained"
            size="large"
            onClick={() => {
              setPage(page - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            {i18next.t('previous-step')}
          </Button>
          {/* TODO: Remove sx when removing MuiSubmitWrapper */}
          {page !== tabs.length - 1 && (
            <Button
              sx={{ ml: 2 }}
              id="submit-button"
              color="success"
              variant="contained"
              size="large"
              onClick={() => {
                setPage(page + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              {isProsper ? i18next.t('save-continue') : i18next.t('next')}
            </Button>
          )}
          {/* TODO: Remove sx when removing MuiSubmitWrapper */}
          {page === tabs.length - 1 && lastStepSave && (
            <Button
              sx={{ ml: 2 }}
              id="submit-button"
              color="success"
              variant="contained"
              size="large"
              onClick={lastStepFunction}
            >
              {i18next.t('save')}
            </Button>
          )}
        </MuiSubmitWrapper>
      )}
    </Container>
  );
};

export default Content;
