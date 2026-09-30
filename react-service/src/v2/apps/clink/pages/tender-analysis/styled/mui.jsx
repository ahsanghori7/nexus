import React, { useRef, useEffect, useCallback } from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid2 from '@mui/material/Grid2';
import DemoButton from 'v2/apps/shared/components/demo-button';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';
import { goToNewTab } from 'v2/helpers/url';

const { clinkBackgroundPurple, clinkLightPurple, clinkGreen, clinkRed } =
  CONSTANTS.colors.general;

const scrollbarStyles = {
  '&::-webkit-scrollbar': {
    backgroundColor: clinkLightPurple,
    borderRadius: ' 10px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: clinkGreen,
    borderRadius: ' 10px',
    '&:hover': {
      backgroundColor: clinkRed,
    },
  },
};

const BoqContainer = ({ children }) => {
  return (
    <Box
      id="container-resize-ta"
      sx={{
        backgroundColor: clinkBackgroundPurple,
        paddingTop: '60px',
        paddingBottom: '160px',
        minHeight: '100vh',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </Box>
  );
};

const defaultPaperProps = {
  height: '100%',
  boxShadow: 'none',
  border: `1px solid ${clinkLightPurple}`,
  borderRadius: '8px',
  p: '4px',
};

const Item = ({
  children,
  itemProps = {
    xs: 12,
    sm: 4,
  },
  paperProps = {},
}) => (
  <Grid item {...itemProps} sx={{ minHeight: '340px', p: 0 }}>
    <Paper sx={{ ...defaultPaperProps, ...paperProps }}>
      <Box sx={{ p: 1, height: '100%' }}>{children}</Box>
    </Paper>
  </Grid>
);

const TenderSummaryLeft = ({ children }) => {
  return (
    <Grid
      item
      xs={6}
      sx={{
        p: 2,
        pr: 1,
        pt: 1,
        mt: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        '& .MuiTableContainer-root': {
          ...scrollbarStyles,
        },
      }}
    >
      {children}
    </Grid>
  );
};

const TenderSummaryRight = ({ children, arrayLength = 1, boqid = 0 }) => {
  const topScrollRef = useRef(null);
  const bottomScrollRef = useRef(null);

  useEffect(() => {
    const syncScroll = () => {
      bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    };

    const topScroll = topScrollRef.current;
    topScroll.addEventListener('scroll', syncScroll);

    return () => {
      topScroll.removeEventListener('scroll', syncScroll);
    };
  }, []);

  useEffect(() => {
    const syncScroll = () => {
      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
    };

    const bottomScroll = bottomScrollRef.current;
    bottomScroll.addEventListener('scroll', syncScroll);

    return () => {
      bottomScroll.removeEventListener('scroll', syncScroll);
    };
  }, []);

  const downloadExcel = useCallback(() => {
    return goToNewTab(`/download/boq_export/${boqid || 0}`);
  }, [boqid]);
  return (
    <>
      <Box
        position="absolute"
        right={{
          xs: '5px',
          lg: 'calc(100% - 1238px)',
          xl: 'calc(100% - 1638px)',
        }}
        top="15px"
      >
        <Grid2 container spacing={2}>
          <Grid2>
            <DemoButton type="ifs2" handleClick={downloadExcel} />
          </Grid2>
          <Grid2>
            <DemoButton type="ifs3" />
          </Grid2>
        </Grid2>
      </Box>
      <Grid
        item
        xs={6}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          marginTop: '58px',
          pr: 2,
          position: 'relative',
          pb: 4,
        }}
      >
        <Box
          ref={bottomScrollRef}
          sx={{
            p: 2,
            pl: 1,
            display: 'flex',
            flexWrap: 'nowrap',
            overflowY: 'hidden',
            overflowX: 'scroll',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            '&::-webkit-scrollbar': {
              display: 'none',
            },
          }}
        >
          {children}
        </Box>
      </Grid>
      <Box
        ref={topScrollRef}
        sx={{
          overflowX: 'scroll',
          overflowY: 'hidden',
          height: '20px',
          marginBottom: '0px',
          position: 'absolute',
          bottom: '16px',
          right: '12px',
          width: 'calc(50% - 20px)',
          ...scrollbarStyles,
        }}
      >
        <Box sx={{ width: `${arrayLength * 256}px`, height: '1px' }} />
      </Box>
    </>
  );
};

const MuiEllipsisTooltip = ({ children, tooltipDesc }) => {
  return (
    <Tooltip sx={{ lineHeight: 1 }} title={children}>
      <Typography
        component="div"
        sx={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: '13px',
          fontWeight: 600,
          maxWidth: '200px',
        }}
      >
        {tooltipDesc}
      </Typography>
    </Tooltip>
  );
};

export {
  BoqContainer,
  Item,
  TenderSummaryLeft,
  TenderSummaryRight,
  MuiEllipsisTooltip,
};
