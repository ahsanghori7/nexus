import { CONSTANTS } from 'clink-components';

/** rgba() from #rrggbb (avoids @mui alpha in Jest / thin deps) */
const hexAlpha = (hex, a) => {
  const h = String(hex).replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  if (v.length !== 6) return hex;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
};

const {
  boqAccent,
  boqAccentHover,
  clinkLightPurple,
  darkCharcoal,
  clinkPurple,
  clinkRed,
  white,
} = CONSTANTS.colors.general;
const { dimGray2 } = CONSTANTS.colors.prosper;

const marginRight = {
  mr: 1,
};

/** Matches header buttons + total footer so text aligns to the same inset. */
const boqCardContentInsetRight = {
  pr: { xs: 1.5, sm: 2.5 },
};

/** BoQ card header action row: consistent spacing (replaces per-button mr) */
const boqContentHeaderActionsSx = {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 0.75,
  rowGap: 0.75,
};

const boqEditButtonSx = {
  minWidth: 72,
  fontWeight: 600,
  textTransform: 'none',
  px: 1.75,
  color: white,
  backgroundColor: boqAccent,
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  '&:hover': {
    backgroundColor: boqAccentHover,
    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
  },
  '&.Mui-disabled': {
    backgroundColor: hexAlpha(darkCharcoal, 0.2),
    color: hexAlpha(white, 0.8),
  },
};

/** Outlined (New BoQ) — brand red */
const boqNewButtonSx = {
  minWidth: 0,
  fontWeight: 600,
  textTransform: 'none',
  borderWidth: 1.5,
  px: 1.5,
  color: clinkRed,
  borderColor: clinkRed,
  '&:hover': {
    borderColor: clinkRed,
    backgroundColor: hexAlpha(clinkRed, 0.08),
  },
  '&.Mui-disabled': {
    borderColor: hexAlpha(darkCharcoal, 0.2),
    color: hexAlpha(darkCharcoal, 0.45),
  },
};

/** Outlined (Save) */
const boqSaveButtonSx = {
  minWidth: 0,
  fontWeight: 600,
  textTransform: 'none',
  borderWidth: 1.5,
  px: 1.5,
  color: boqAccent,
  borderColor: boqAccent,
  '&:hover': {
    borderColor: boqAccent,
    backgroundColor: hexAlpha(boqAccent, 0.1),
  },
  '&.Mui-disabled': {
    borderColor: hexAlpha(darkCharcoal, 0.22),
    color: hexAlpha(darkCharcoal, 0.4),
  },
};

/** Filled (Publish / Republish) */
const boqPublishButtonSx = {
  minWidth: 0,
  fontWeight: 600,
  textTransform: 'none',
  px: 1.75,
  color: white,
  backgroundColor: boqAccent,
  boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  '&:hover': {
    backgroundColor: boqAccentHover,
    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
  },
  '&.Mui-disabled': {
    backgroundColor: hexAlpha(darkCharcoal, 0.12),
    color: hexAlpha(darkCharcoal, 0.45),
  },
};

const inputBaseSx = (palette, noteReadOnly) => ({
  width: '100%',
  padding: '10px 12px',
  boxSizing: 'border-box',
  color: noteReadOnly && palette ? palette.secondaryBlack.main : darkCharcoal,
  border: `1px solid ${clinkLightPurple}`,
  borderRadius: '8px',
  backgroundColor: white,
  overflowY: 'auto',
  '&::WebkitScrollbar': {
    width: '10px',
  },
  '&::WebkitScrollbarTrack': {
    boxShadow: `inset 0 0 5px ${clinkPurple}`,
    borderRadius: '10px',
  },
  '&::WebkitScrollbarThumb': {
    background: boqAccent,
    borderRadius: '10px',
  },
  '&::WebkitScrollbarThumb:hover': {
    background: boqAccentHover,
  },
});

/** New BoQ destructive confirm — outline cancel + solid accent confirm (matches BoQ UI) */
const newBoqModalCancelSx = {
  marginRight: '16px !important',
  width: 'auto !important',
  minWidth: 112,
  px: 2.5,
  borderRadius: '40px',
  fontSize: '16px',
  minHeight: 40,
  fontWeight: 600,
  textTransform: 'none',
  border: `1.5px solid ${boqAccent}`,
  color: boqAccent,
  bgcolor: white,
  boxShadow: 'none',
  '&:hover': {
    bgcolor: clinkRed,
    border: `1.5px solid ${clinkRed}`,
    color: white,
  },
};

const newBoqModalAcceptSx = {
  width: 'auto !important',
  minWidth: 112,
  px: 2.5,
  borderRadius: '40px',
  fontSize: '16px',
  minHeight: 40,
  fontWeight: 600,
  textTransform: 'none',
  color: white,
  bgcolor: boqAccent,
  boxShadow: 'none',
  border: 'none',
  '&:hover': {
    bgcolor: boqAccentHover,
    color: white,
  },
};

/** Save success modal buttons: keep visual state stable on hover */
const saveModalCancelSx = {
  width: 'auto !important',
  minWidth: 112,
  px: 2.5,
  borderRadius: '40px',
  fontSize: '16px',
  minHeight: 40,
  fontWeight: 600,
  textTransform: 'none',
  border: `1.5px solid ${boqAccent}`,
  color: boqAccent,
  bgcolor: white,
  boxShadow: 'none',
  '&:hover': {
    bgcolor: clinkRed,
    border: `1.5px solid ${clinkRed}`,
    color: white,
  },
};

const saveModalAcceptSx = {
  width: 'auto !important',
  minWidth: 112,
  px: 2.5,
  borderRadius: '40px',
  fontSize: '16px',
  minHeight: 40,
  fontWeight: 600,
  textTransform: 'none',
  color: white,
  bgcolor: boqAccent,
  boxShadow: 'none',
  border: 'none',
  '&:hover': {
    bgcolor: boqAccent,
    color: white,
    border: 'none',
  },
};

/** Main message (long warning copy) — centered body, not oversized heading */
const newBoqModalTitleSx = {
  textAlign: 'center',
  fontSize: '16px',
  fontWeight: 400,
  lineHeight: 1.5,
  color: dimGray2,
  mt: 0,
};

/** Smart BoQ inline info banners (empty / failure) — shared layout */
const boqAiInlineAlertBannerSx = {
  mx: 4,
  mt: 2,
  mb: 2,
  px: 2,
  py: 1.5,
  borderRadius: '8px',
  backgroundColor: hexAlpha(clinkRed, 0.06),
  border: `1px solid ${hexAlpha(clinkRed, 0.25)}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: 1.5,
  flexWrap: 'wrap',
};

const boqAiInlineAlertIconBoxSx = {
  width: 36,
  height: 36,
  borderRadius: '10px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: hexAlpha(clinkRed, 0.12),
  flex: '0 0 auto',
};

const boqAiInlineAlertTextColSx = { minWidth: 240, flex: '1 1 auto' };

const boqAiInlineAlertTitleTypographySx = {
  fontSize: '14px',
  fontWeight: 700,
  color: darkCharcoal,
};

const boqAiInlineAlertBodyTypographySx = {
  fontSize: '13px',
  color: darkCharcoal,
  opacity: 0.8,
  mt: 0.25,
};

const boqAiServiceErrorPanelWrapperSx = {
  maxWidth: 560,
  mx: 'auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: 2,
  py: 2,
};

const boqAiServiceErrorCardSx = {
  p: 2,
  borderRadius: '8px',
  backgroundColor: hexAlpha(clinkRed, 0.08),
  border: `1px solid ${hexAlpha(clinkRed, 0.28)}`,
  display: 'flex',
  gap: 1.5,
  alignItems: 'flex-start',
};

const boqAiServiceErrorIconCircleSx = {
  width: 40,
  height: 40,
  borderRadius: '50%',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: hexAlpha(clinkRed, 0.12),
  border: `1px solid ${hexAlpha(clinkRed, 0.35)}`,
};

const boqAiServiceErrorTextColSx = { flex: '1 1 auto', minWidth: 0 };

const boqAiServiceErrorBadgeSx = {
  display: 'inline-block',
  px: 1,
  py: 0.25,
  mb: 0.75,
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.02em',
  color: clinkRed,
  border: `1px solid ${hexAlpha(clinkRed, 0.45)}`,
  borderRadius: '999px',
  bgcolor: hexAlpha(clinkRed, 0.06),
};

const boqAiServiceErrorTitleTypographySx = {
  fontSize: '15px',
  fontWeight: 700,
  color: darkCharcoal,
  lineHeight: 1.35,
};

const boqAiServiceErrorSubtitleTypographySx = {
  fontSize: '13px',
  color: darkCharcoal,
  opacity: 0.85,
  lineHeight: 1.45,
  mt: 0.75,
};

const boqAiServiceErrorSuggestionsHeadingSx = {
  fontSize: '12px',
  color: darkCharcoal,
  opacity: 0.55,
  textTransform: 'lowercase',
  mb: 0.75,
};

const boqAiServiceErrorSuggestionsListSx = {
  m: 0,
  pl: 2.25,
  color: darkCharcoal,
  opacity: 0.8,
  fontSize: '13px',
  listStyleType: 'disc',
  listStylePosition: 'outside',
  '& li': {
    display: 'list-item',
    marginBottom: '0.35rem',
  },
};

const boqAiServiceErrorSuggestionsWrapSx = { px: 0.5 };

const boqAiServiceErrorRetryRowSx = {
  display: 'flex',
  justifyContent: 'center',
  pt: 0.5,
};

const boqAiServiceErrorRetryButtonSx = {
  ...boqPublishButtonSx,
  borderRadius: '999px',
  px: 3,
  py: 1,
  textTransform: 'none',
  fontWeight: 600,
};

const getBoqContentDataGridSx = ({
  boqSectionBg,
  borderbox,
  darkCharcoal: dataGridDarkCharcoal,
  eerieBlack,
  white: dataGridWhite,
}) => ({
  border: 'none',
  borderRadius: '8px',
  overflow: 'hidden',
  '& .MuiDataGrid-main': { borderRadius: '8px' },
  '& .MuiDataGrid-columnHeaders': {
    minHeight: '48px !important',
    borderBottom: `1px solid ${hexAlpha(eerieBlack, 0.12)}`,
    '& .MuiDataGrid-columnHeader': {
      backgroundColor: dataGridWhite,
      borderRight: 'none !important',
      fontWeight: 600,
      '&[data-field="__detail_panel_toggle__"]': {
        display: 'none',
        '--width': '0px !important',
      },
    },
    backgroundColor: dataGridWhite,
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },
  '& .MuiDataGrid-row': {
    borderBottom: `1px solid ${hexAlpha(eerieBlack, 0.06)}`,
    '&:hover': {
      backgroundColor: hexAlpha(eerieBlack, 0.04),
    },
    '& .MuiDataGrid-cell': {
      borderRight: 'none !important',
      borderBottom: 'none !important',
      '&[data-field="__detail_panel_toggle__"]': {
        display: 'none',
        '--width': '0px !important',
      },
      '&:last-child': {},
    },
    '&.boq--section': {
      backgroundColor: boqSectionBg,
      fontWeight: 400,
      color: eerieBlack,
      '&:hover': {
        backgroundColor: borderbox,
      },
      '& .MuiDataGrid-cell[data-field="description"]': {
        fontWeight: 700,
      },
      '& .MuiDataGrid-cell--editable': {
        pointerEvents: 'none',
      },
    },
    '&.boq--item': {
      backgroundColor: dataGridWhite,
      '&:hover': {
        backgroundColor: dataGridWhite,
      },
      '&.hide-row': {
        display: 'none',
      },
    },
    '&.boq--grouped_heading': {
      backgroundColor: dataGridWhite,
      fontWeight: 400,
      textDecoration: 'none',
      '&:hover': {
        backgroundColor: dataGridWhite,
      },
      '&.hide-row': {
        display: 'none',
      },
      '& .MuiDataGrid-cell[data-field="item_no"]': {
        fontWeight: 700,
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
      },
      '& .MuiDataGrid-cell[data-field="description"]': {
        fontWeight: 700,
        textDecoration: 'underline',
        textUnderlineOffset: '2px',
      },
      '& .MuiDataGrid-cell': {
        '&.hide': {
          opacity: 1,
          pointerEvents: 'none',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: dataGridWhite,
            zIndex: 1,
          },
        },
      },
    },
  },
  '& .MuiDataGrid-cell': {
    py: 0.75,
    display: 'flex',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    height: '100%',
    boxSizing: 'border-box',
    borderBottom: 'none !important',
    textOverflow: 'ellipsis',
    whiteSpace: 'pre',
    overflow: 'hidden',
    lineHeight: 1.45,
    '&[data-field="__reorder__"]': {
      alignItems: 'flex-start',
    },
    '&[data-field="__reorder__"] .MuiDataGrid-rowReorderCell': {
      alignItems: 'flex-start',
      alignSelf: 'stretch',
      height: '100%',
      minHeight: 0,
      pt: 0,
    },
    '&[data-field="__reorder__"] .MuiDataGrid-rowReorderCellContainer': {
      alignItems: 'flex-start',
      alignSelf: 'stretch',
      height: '100%',
    },
    '&[data-field="description"], &[data-field="tenderee_note"], &[data-field="item_no"]': {
      alignItems: 'flex-start',
      alignSelf: 'stretch',
      whiteSpace: 'pre',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    '&[data-field="quantity"], &[data-field="unit_id"], &[data-field="budget_rate"], &[data-field="budget_total"], &[data-field="actions"]':
      {
        alignItems: 'center',
        alignSelf: 'stretch',
      },
    '&.show': {
      opacity: '1',
    },
    '&.hide': {
      opacity: '0',
      pointerEvents: 'none',
    },
    '& input[type=number]': {
      MozAppearance: 'textfield',
    },
    '& input[type=number]::-webkit-outer-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
    '& input[type=number]::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
    '&.MuiDataGrid-cell--editing': {
      cursor: 'text !important',
      '& .MuiInputBase-input': {
        cursor: 'text !important',
      },
    },
    "&[data-field='budget']:hover, &[data-field='actual']:hover": {
      cursor: 'text',
    },
    '&[data-field="quantity"]': {
      justifyContent: 'flex-end',
    },
    '&[data-field="budget_rate"]': {
      justifyContent: 'flex-end',
    },
    '&[data-field="budget_total"]': {
      justifyContent: 'flex-end',
    },
    '&[data-field="unit_id"]': {
      justifyContent: 'flex-start',
    },
  },
  '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-colCell:focus-within,  & .MuiDataGrid-columnHeader:focus-within':
    {
      outline: 0,
    },
  '& .MuiDataGrid-filler': {
    display: 'none',
  },
  '& .MuiDataGrid-container--top [role=row]': {
    backgroundColor: dataGridWhite,
  },
  '& .MuiDataGrid-columnHeaderTitle, & .MuiDataGrid-columnHeaderTitleContainerContent':
    {
      pointerEvents: 'auto',
      opacity: 1,
      fontWeight: 600,
      color: hexAlpha(dataGridDarkCharcoal, 0.62),
      fontSize: '13px',
      letterSpacing: 0.01,
      '&> span': {
        display: 'inline-flex',
        alignItems: 'center',
        transform: 'none',
      },
    },
  '& .MuiDataGrid-rowCount': {
    display: 'none',
  },
  '& .MuiDataGrid-rowReorderCellPlaceholder': {
    display: 'none',
  },
  '& ::-webkit-scrollbar': {
    width: '0px',
    height: '5px',
  },
  '& ::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '& ::-webkit-scrollbar-thumb': {
    background: clinkPurple,
    borderRadius: '2px',
  },
  '& ::-webkit-scrollbar-thumb:hover': {
    background: clinkLightPurple,
  },
  '& .MuiDataGrid-cell[data-field="tenderee_note"]': {
    pr: 5,
    '& .MuiDataGrid-cellContent': {
      pr: 5,
    },
  },
  '& .MuiDataGrid-columnHeader[data-field="tenderee_note"]': {
    pr: 5,
  },
});

/**
 * Merged into confirm-modal v2 Content outer Box (with subcontractor `style`).
 * Do not set backgroundColor: transparent (it overwrites the card fill).
 * Do not use absolute-position rules on nested buttons — they break v2 layout.
 */
const modalSx = {
  width: '100%',
  maxWidth: 420,
  backgroundColor: white,
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
  pb: 0,
};

export {
  hexAlpha,
  marginRight,
  boqCardContentInsetRight,
  inputBaseSx,
  modalSx,
  newBoqModalCancelSx,
  newBoqModalAcceptSx,
  newBoqModalTitleSx,
  saveModalCancelSx,
  saveModalAcceptSx,
  boqContentHeaderActionsSx,
  boqEditButtonSx,
  boqNewButtonSx,
  boqSaveButtonSx,
  boqPublishButtonSx,
  boqAiInlineAlertBannerSx,
  boqAiInlineAlertIconBoxSx,
  boqAiInlineAlertTextColSx,
  boqAiInlineAlertTitleTypographySx,
  boqAiInlineAlertBodyTypographySx,
  boqAiServiceErrorPanelWrapperSx,
  boqAiServiceErrorCardSx,
  boqAiServiceErrorIconCircleSx,
  boqAiServiceErrorTextColSx,
  boqAiServiceErrorBadgeSx,
  boqAiServiceErrorTitleTypographySx,
  boqAiServiceErrorSubtitleTypographySx,
  boqAiServiceErrorSuggestionsHeadingSx,
  boqAiServiceErrorSuggestionsListSx,
  boqAiServiceErrorSuggestionsWrapSx,
  boqAiServiceErrorRetryRowSx,
  boqAiServiceErrorRetryButtonSx,
  getBoqContentDataGridSx,
};
