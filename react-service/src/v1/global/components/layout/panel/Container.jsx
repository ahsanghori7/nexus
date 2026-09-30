import React from 'react';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { Header } from './Generics';
import Panel from './index';

const Container = (props) => {
  const {
    titleHeader,
    panelLeft,
    prePanelLeft = null,
    panelLeftTitle,
    panelRight,
    prePanelRight = null,
    panelRightTitle,
    containerClass = '',
    left = 4.4,
    right = 7.6,
  } = props;
  return (
    <div className={`central-container ${containerClass}`}>
      {titleHeader && (
        <Panel
          className="breadcrumbs-panel"
          header={<Header title={titleHeader} />}
        />
      )}
      <Grid container className="panel-wrapper">
        {panelLeft && (
          <Grid
            item
            xs={left}
            sx={{
              width: '100%',
            }}
          >
            {prePanelLeft}
            <Box
              className="box-helper"
              sx={{
                '& > div': {
                  display: 'block',
                  marginRight: '0',
                  marginLeft: '0',
                },
              }}
            >
              <Panel className="panel-left" header={panelLeftTitle}>
                {panelLeft}
              </Panel>
            </Box>
          </Grid>
        )}
        {panelRight && (
          <Grid
            item
            xs={right}
            sx={{
              width: '100%',
            }}
          >
            {prePanelRight}
            <Panel className="panel-right" header={panelRightTitle}>
              {panelRight}
            </Panel>
          </Grid>
        )}
      </Grid>
    </div>
  );
};

export default Container;
