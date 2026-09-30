import React from 'react';
import styled from 'styled-components';
import Box from '@mui/material/Box';
import { CONSTANTS } from 'clink-components';

const { white, darkJungleGreen } = CONSTANTS.colors.general;
const { prosperBoxRed } = CONSTANTS.colors.prosper;
const { LG_SCREEN } = CONSTANTS.dimensions;

const StyledTooltipContainer = styled.div`
  white-space: normal;
  position: absolute;
  right: 5px;
  height: 28px;
  display: flex;
  width: 40px;
  justify-content: center;
  align-items: center;

  ${(props) => (!props.matched || props.closed ? `display: none;` : ``)}

  @media (min-width: ${LG_SCREEN}px) {
    margin-left: 15px;
    position: relative;
    right: unset;
  }

  .prosper-tooltip-content {
    line-height: 2;
    align-items: center;
    position: absolute;
    width: 200px;
    height: 60px;
    background-color: ${darkJungleGreen};
    color: ${white};
    font-size: 10px;
    font-weight: normal;
    padding: 8px;
    border-radius: 4px;
    top: -26px;
    left: -210px;
    z-index: 1;

    @media (min-width: ${LG_SCREEN}px) {
      top: -38px;
      left: 40px;
      font-size: 11px;
      width: 260px;
      height: 70px;
      padding: 14px 16px;
    }

    &:after {
      content: '';
      position: absolute;
      bottom: 43%;
      left: 216px;
      border-width: 5px;
      border-style: solid;
      border-color: transparent transparent transparent ${darkJungleGreen};
    }

    @media (min-width: ${LG_SCREEN}px) {
      &:after {
        left: -10px;
        border-color: transparent ${darkJungleGreen} transparent transparent;
      }
    }

    .prosper-tooltip-content-row {
      display: flex;
      flex-wrap: nowrap;
    }
  }
`;

const StyledTooltip = styled.div`
  ${(props) => (props.open ? `display: flex;` : `display: none;`)}
`;

const MuiNewOpportunityBanner = ({ children }) => (
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      right: '32px',
      maxWidth: '130px',
      height: '28px',
      p: 1,
      mt: '10px',
      backgroundColor: prosperBoxRed,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '13px',
      fontWeight: 300,
      color: white,
      textAlign: 'center',
      boxSizing: 'border-box',
      borderBottomLeftRadius: '6px',
      borderBottomRightRadius: '6px',
    }}
  >
    {children}
  </Box>
);

export { StyledTooltipContainer, StyledTooltip, MuiNewOpportunityBanner };
