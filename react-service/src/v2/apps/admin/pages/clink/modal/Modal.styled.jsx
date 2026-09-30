import React from 'react';
import styled from 'styled-components';
import MuiGrid from '@mui/material/Grid';
import MuiTypography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';

const { ptSans } = CONSTANTS.fonts;
const { azureishWhite } = CONSTANTS.colors.general;

const Container = ({ children }) => (
  <MuiGrid container flexWrap="wrap" justifyContent="space-between">
    {children}
  </MuiGrid>
);

const Item = ({ children }) => (
  <MuiGrid
    item
    container
    flexDirection="column"
    marginBottom={2}
    sx={{ '& input': { marginTop: 1.3, width: '100%' } }}
  >
    {children}
  </MuiGrid>
);

const Typography = ({
  children,
  sx = {},
  fontStyle = 'italic',
  color = 'error',
  variant = 'normal',
}) => (
  <MuiTypography sx={sx} fontStyle={fontStyle} color={color} variant={variant}>
    {children}
  </MuiTypography>
);

// TODO: Work on theming in react-components
const StyledItemAutocomplete = styled.div`
  flex: 1 0 100%;
  margin-bottom: 15px;
  display: flex;
  flex-direction: column;
  input {
    width: 100%;
    margin-top: 10px;
  }
  box-sizing: border-box;
  flex-basis: 33.33%;
  box-sizing: border-box;
  & > div {
    width: 100%;
    .autocomplete-input-wrapper {
      width: 100%;
      box-sizing: border-box;
      display: flex;
      border: none;
      box-shadow: none;
      position: relative;
      .autocomplete-search-input {
        flex-basis: 100%;
        height: 46px !important;
        order: -1;
        border: 1px solid ${azureishWhite} !important;
        border-radius: 6px;
        margin-bottom: 14px;
      }
    }
  }
`;

const SubItem = ({ children }) => (
  <MuiGrid
    item
    xs={12}
    md={5.75}
    sx={{
      '.clink-form__input': {
        svg: {
          right: '5px',
          top: '22px',
        },
        '& > div > div': {
          width: '200px',
          top: '22px',
          'h2, p': {
            fontFamily: ptSans,
          },
          h2: {
            fontSize: '19px',
          },
          p: {
            fontSize: '16px',
          },
        },
      },
    }}
  >
    {children}
  </MuiGrid>
);

const PageTitle = ({ children }) => (
  <Typography
    sx={{
      marginBottom: '15px',
    }}
    fontStyle="initial"
    color="primary"
    variant="boldTitle"
  >
    {children}
  </Typography>
);

export {
  Container,
  Item,
  Typography,
  SubItem,
  PageTitle,
  StyledItemAutocomplete,
};
