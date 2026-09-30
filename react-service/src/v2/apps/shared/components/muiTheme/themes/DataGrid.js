import { CONSTANTS } from 'clink-components';

const { clinkLightPurple, clinkBackgroundPurple, prim, clinkPurple } =
  CONSTANTS.colors.general;

const borderColor = clinkLightPurple;
const focusColor = clinkPurple;

const MuiDataGrid = {
  styleOverrides: {
    root: {
      '& .MuiDataGrid-row': {
        '&:nth-of-type(even)': {
          backgroundColor: clinkBackgroundPurple,
          '&:hover': {
            backgroundColor: clinkLightPurple,
          },
        },
        '&.boq--section': {
          backgroundColor: prim,
          fontWeight: 700,
        },
        '&.boq--grouped_heading': {
          fontWeight: 700,
          textDecoration: 'underline',
        },
      },
      '& .MuiDataGrid-cell': {
        borderBottomColor: borderColor,
        textOverflow: 'ellipsis',
        whiteSpace: 'pre', // don't collapse double spaces
        '&.show': {
          opacity: '1',
        },
        '&.hide': {
          opacity: '0',
          pointerEvents: 'none',
        },
      },
      '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-colCell:focus-within,  & .MuiDataGrid-columnHeader:focus-within':
        {
          outline: 0,
        },
      '& .MuiDataGrid-columnsContainer': {
        borderBottomColor: borderColor,
      },
      '& .MuiDataGrid-columnSeparator--resizable': {
        color: borderColor,
      },
      '& .MuiDataGrid-row.focusedNotSelected': {
        backgroundColor: focusColor,
      },
      borderColor,
      borderRadius: 0,
      borderWidth: '1px 0 0',
    },
  },
};

export default MuiDataGrid;
