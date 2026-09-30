import React from 'react';
import { CONSTANTS } from 'clink-components';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';

const { white, clinkLightPurple } = CONSTANTS.colors.general;

const Wrapper = ({ children, contentHeader = null, headerTitle = null }) => (
  <Grid id="ta-boq-wrapper" item xs={12} sx={{ minHeight: '340px', p: 0 }}>
    <Card
      variant="outlined"
      sx={{
        backgroundColor: white,
        border: `1px solid ${clinkLightPurple}`,
        borderRadius: '8px',
        overflow: 'visible',
      }}
    >
      {(contentHeader || headerTitle) && (
        <CardHeader
          title={headerTitle || undefined}
          action={contentHeader}
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: headerTitle ? 'space-between' : 'flex-end',
            alignItems: 'center',
            overflow: 'visible',
            py: 1.5,
            px: 4,
            '& .MuiCardHeader-action': {
              margin: 0,
              maxWidth: '100%',
              flexShrink: 0,
            },
            '& .MuiCardHeader-content:empty': {
              display: 'none',
            },
            '& .MuiCardHeader-content': {
              flex: headerTitle ? '1 1 auto' : '0 0 0',
              minWidth: 0,
            },
          }}
        />
      )}
      <CardContent
        sx={{
          p: 0,
          '&:last-child': {
            p: 0,
          },
        }}
      >
        <Grid id="bow-page-wrapper" container item xs={12}>
          {children}
        </Grid>
      </CardContent>
    </Card>
  </Grid>
);

export default Wrapper;
