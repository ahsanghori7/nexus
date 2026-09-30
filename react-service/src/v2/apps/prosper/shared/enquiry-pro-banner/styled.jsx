import styled from 'styled-components';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { CONSTANTS } from 'clink-components';

const { prosperBoxRed } = CONSTANTS.colors.prosper;
const { MD_SCREEN } = CONSTANTS.dimensions;

const StyledModalContainer = styled(Grid)`
  display: flex !important;
  align-items: center;
  padding: 10px;
  justify-content: center;

  @media (min-width: ${MD_SCREEN}px) {
    justify-content: start;
  }

  p {
    text-align: center;

    @media (min-width: ${MD_SCREEN}px) {
      text-align: start;
    }
  }
  span {
    color: ${prosperBoxRed};
  }
  div {
    font-weight: 100;
  }
  b {
    font-weight: bold;
  }
`;

const StyledNoWrap = styled(Box)`
  span {
    white-space: nowrap;
  }
`;

export { StyledModalContainer, StyledNoWrap };
