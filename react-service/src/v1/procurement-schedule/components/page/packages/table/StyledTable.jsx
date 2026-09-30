import React from 'react';
import {
  ThemeProvider as MuiThemeProvider,
  createTheme,
} from '@mui/material/styles';
import { TableToolbar as MuiTableToolbar } from 'mui-datatables';
import i18next from 'i18next';
import useFeatureFlag from 'v2/hooks/useFeatureFlag';

import { CONSTANTS } from 'clink-components';
import GlobalTable from '../../../../../global/components/table';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const { darkCharcoal, clinkLightPurple } = CONSTANTS.colors.general;

// TODO: Remove this implementation
const getMuiTheme = () =>
  createTheme({
    overrides: {
      MUIDataTableToolbarSelect: {
        root: {
          backgroundColor: 'white',
          boxShadow: 'none',
          '& > div:not(.MUIDataTableToolbarSelect-custom, .dropdown, .dropdown-menu)':
            {
              display: 'none',
            },
          '& > .MUIDataTableToolbarSelect-custom': {
            '& > .dropdown': {
              marginLeft: '32px',
              '& > .dropdown-toggle': {
                backgroundColor: 'white',
                borderRadius: '4px',
                border: '2px solid rgba(142, 141, 190, 0.4)',
                textAlign: 'left',
                fontFamily: '"proxima_nova", "sofia_pro_softlight"',
                letterSpacing: '0px',
                color: darkCharcoal,
                '&::after': {
                  display: 'inline-block',
                  marginLeft: '18px',
                  opacity: '0.5',
                  color: darkCharcoal,
                },
                '&:focus': {
                  backgroundColor: clinkLightPurple,
                  color: darkCharcoal,
                },
                '&:hover': {
                  backgroundColor: clinkLightPurple,
                  color: darkCharcoal,
                },
                '&:active': {
                  backgroundColor: '#c6c5de !important',
                  color: darkCharcoal,
                },
              },
            },
          },
        },
      },
      MUIDataTableToolbar: {
        actions: {
          maxWidth: '470px',
          whiteSpace: 'nowrap',
          float: 'right',
        },
      },
    },
  });

const TableToolbar = (props) => {
  const { checkFeature } = useFeatureFlag();
  const isShortlistedSubcontractorEnabled = checkFeature(
    'SUBCONTRACTOR_LIST_APPROVAL',
  );

  return (
    <>
      <MuiTableToolbar {...props} />
      {isShortlistedSubcontractorEnabled && (
        <Box display="flex" justifyContent="left">
          <Typography
            data-testid="approved-suppliers-label"
            variant="p"
            sx={{ mt: 2, fontSize: 18, fontWeight: 600 }}
          >
            {i18next.t('approved-suppliers')}
          </Typography>
        </Box>
      )}
    </>
  );
};

const StyledTable = ({ className, data, columns, options, components }) => {
  const mergedComponents = {
    ...components,
    TableToolbar,
  };

  return (
    <MuiThemeProvider theme={getMuiTheme()}>
      <GlobalTable
        data={data}
        columns={columns}
        options={options}
        className={className}
        components={mergedComponents}
      />
    </MuiThemeProvider>
  );
};

export default StyledTable;
