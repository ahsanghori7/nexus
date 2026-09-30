import React from 'react';
import Grid2 from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import { CONSTANTS } from 'clink-components';

const { black } = CONSTANTS.colors.general;
const { boqScratch } = CONSTANTS.s3;

const cardItemProps = {
  xs: 12,
  sm: 5,
  md: 5,
};
const creationCardPaperProps = {
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
  borderRadius: '8px',
};
const creationCardActionButtonSx = {
  mt: 2,
  width: '100%',
  textTransform: 'none',
  fontSize: '13px',
  py: 1.25,
  borderRadius: '8px',
};
const doubleItemProps = cardItemProps;
const subItemProps = {
  xs: 12,
  sm: 6,
};
const titleProps = {
  fontSize: '14px',
  color: black,
  fontWeight: 'bold',
  textAlign: 'center',
};
const titleSx = { fontSize: '15px', pb: 0.5, ...titleProps };
const buttonBaseSx = {
  display: 'block',
  '&::after': {
    content: '""',
    display: 'block',
    width: '100%',
    height: '150px',
    marginRight: 1,
    backgroundImage: `url('${boqScratch}')`,
    backgroundSize: 'cover',
  },
};

const Container = ({ children }) => (
  <Box
    sx={{
      width: '100%',
      m: 'auto',
      p: 0,
    }}
  >
    <Grid2
      container
      justifyContent="center"
      rowSpacing={{ xs: 2, sm: 3 }}
      columnSpacing={{ xs: 2, sm: 3 }}
      sx={{
        width: '100%',
      }}
    >
      {children}
    </Grid2>
  </Box>
);

export {
  cardItemProps,
  creationCardPaperProps,
  creationCardActionButtonSx,
  doubleItemProps,
  subItemProps,
  titleProps,
  titleSx,
  buttonBaseSx,
  Container,
};
