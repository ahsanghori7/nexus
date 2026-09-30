import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import styled from 'styled-components';
import { CONSTANTS } from 'clink-components';

const {
  prosperBoxGreen,
  boxInset,
  prosperCursorGray,
  prosperCursorGrayDark,
  prosperBoxRed,
} = CONSTANTS.colors.prosper;
const { white, japaneseIndigo, platinum } = CONSTANTS.colors.general;
const { checkmarkGreen } = CONSTANTS.s3;
const { XL_SCREEN } = CONSTANTS.dimensions;

const StyledCheckboxWrapper = styled.div`
  position: relative;
  flex-basis: 50%;
  display: flex;
  align-items: center;

  @media (max-width: ${XL_SCREEN - 1}px) {
    flex-basis: 100%;
    margin-top: 0;
  }

  .clink-form__input {
    display: flex;
    flex-wrap: nowrap;
    flex-direction: row-reverse;
    display: flex;
    align-items: center;
    justify-content: flex-end;

    @media (max-width: ${XL_SCREEN - 1}px) {
      padding-left: 4px !important;
    }

    label {
      font-size: 11px !important;
      color: black !important;
      margin-bottom: 0 !important;
      padding-left: 10px;
      margin-top: 0;
    }
  }

  [type='checkbox'] {
    width: 24px !important;
    height: 24px !important;
    color: ${prosperBoxGreen} !important;
    vertical-align: middle;
    -webkit-appearance: none;
    background: none;
    border: 0 !important;
    outline: 0;
    flex-grow: 0;
    border-radius: 50%;
    background-color: ${white};
    transition: background 300ms;
    cursor: pointer;
    border-radius: 4px !important;
  }

  [type='checkbox']::before {
    content: '';
    color: transparent;
    display: block;
    width: inherit;
    height: inherit;
    border-radius: inherit;
    border: 0;
    background-color: transparent;
    background-size: contain;
    box-shadow: inset 0 0 0 1px ${boxInset};
  }

  /* Checked */

  [type='checkbox']:checked {
    background-color: currentcolor;
  }

  [type='checkbox']:checked::before {
    box-shadow: none;
    background-image: url(${checkmarkGreen});
    background-color: ${white};
    background-size: 14px;
    background-position: center;
    background-repeat: no-repeat;
    width: 22px;
    height: 22px;
    margin-top: 1px;
    margin-left: 1px;
    border-radius: 3px;
  }
`;

const EditorWrapper = ({ children, label = '' }) => {
  return (
    <Box
      sx={{
        boxSizing: 'border-box',
        margin: '30px 0',

        '& em': {
          fontStyle: 'italic',
        },
        '& strong': {
          fontWeight: 'bold',
        },

        '& .ql-toolbar ': {
          backgroundColor: white,
          borderTopLeftRadius: '5px',
          borderTopRightRadius: '5px',
          borderColor: platinum,
        },
        '& .ql-container': {
          maxHeight: '300px',
          height: '300px',
          padding: '10px',
          boxSizing: 'border-box',
          backgroundColor: white,
          borderBottomLeftRadius: '5px',
          borderBottomRightRadius: '5px',
          borderColor: platinum,

          '& .ql-editor': {
            overflowX: 'hidden',
            overflowY: 'scroll',
            maxHeight: '280px',

            '&::-webkit-scrollbar': {
              width: '10px',
            },
            '&::-webkit-scrollbar-track': {
              borderRadius: '10px',
              background: prosperCursorGray,
            },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: '10px',
              background: prosperCursorGrayDark,
              '&:hover': {
                background: japaneseIndigo,
              },
            },
          },
        },
      }}
    >
      {label && label.length > 0 && (
        <Typography
          sx={{
            color: prosperBoxRed,
            mb: 1,
            mt: 3,
            fontSize: '14px',
            fontWeight: 700,
          }}
        >
          {label}
        </Typography>
      )}
      {children}
    </Box>
  );
};

const TwoFieldsWrapper = ({ children }) => {
  return (
    <Box
      sx={{
        width: '100%',
        '& .clink-form__input': {
          flex: 1,
          '& .change-mode-btn': {
            padding: 0,
            border: 'none',
            textAlign: 'start',
            fontSize: '14px',
            color: prosperBoxRed,
            fontWeight: 'bold',
            textDecoration: 'underline',
            backgroundColor: 'transparent',
          },
        },
      }}
    >
      {children}
    </Box>
  );
};

export { StyledCheckboxWrapper, EditorWrapper, TwoFieldsWrapper };
