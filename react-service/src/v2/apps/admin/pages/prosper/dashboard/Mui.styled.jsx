import React from 'react';
import Box from '@mui/material/Box';
import { CONSTANTS } from 'clink-components';

const { prosperCursorGray, prosperCursorGrayDark } = CONSTANTS.colors.prosper;

const MuiDashboardCardContainer = ({ children, supplyChain = false }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: 'repeat(12, 1fr)',
      gridTemplateRows: 'minmax(460px, max-content)',
      gridTemplateAreas: {
        xs: `'one one one one one one one one one one one one'
             'two two two two two two two two two two two two'
             'three three three three three three three three three three three three '
             'four four four four four four four four four four four four '`,
        lg: `'one one one one one one two two two two two two'
             'three three three three three three three four four four four four'`,
      },
      gap: { xs: '40px 0', lg: '40px' },
      ...(supplyChain && {
        '& > div': {
          maxHeight: '790px',
          gridColumn: 'span 12 !important',
        },
      }),
    }}
  >
    {children}
  </Box>
);

const MuiCompanyCardContainer = ({ children }) => (
  <Box
    sx={{
      height: 'calc(100% - 39px)',
      overflowX: 'hidden',
      overflowY: 'scroll',
      margin: '0 39px 39px',
      '&::-webkit-scrollbar': {
        width: '12px',
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: prosperCursorGray,
        borderRadius: '10px',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: prosperCursorGrayDark,
        borderRadius: '10px',
      },
    }}
  >
    {children}
  </Box>
);

export { MuiDashboardCardContainer, MuiCompanyCardContainer };
