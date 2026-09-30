import React from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import OutlinedInput from '@mui/material/OutlinedInput';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import TextareaAutosize from '@mui/material/TextareaAutosize';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import i18next from 'v2/helpers/i18n';
import parseCurrency, { currencyConfig } from 'v2/helpers/currency';
import { CONSTANTS } from 'clink-components';

const { white, black } = CONSTANTS.colors.general;
const { avantGardeGothicPRO } = CONSTANTS.fonts;

const inputStyle = {
  width: '100%',
  height: 'auto',
  border: '1px solid rgba(224, 224, 224, 1)',
  marginBottom: '-5px',
  boxSizing: 'border-box',
  outline: 0,
  resize: 'none',
  overflow: 'auto',
  padding: '40px 30px 4px',
  fontFamily: avantGardeGothicPRO,
  '&::placeholder': {
    fontFamily: avantGardeGothicPRO,
  },
};

const hideLongText = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const SubmitQuoteHeader = ({ children }) => (
  <Box
    sx={{
      backgroundColor: white,
      color: black,
      border: '1px solid rgba(224, 224, 224, 1)',
      padding: '40px 30px 40px',
    }}
  >
    <Typography sx={{ fontSize: '18px', fontFamily: avantGardeGothicPRO }}>
      {children}
    </Typography>
  </Box>
);

const HeaderTextarea = ({
  customStyles = {},
  placeholder = '',
  minRows = 4,
  value = '',
  onChange = () => null,
  readOnly = false,
}) => (
  <TextareaAutosize
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    style={{ ...inputStyle, ...customStyles }}
    minRows={minRows}
    readOnly={readOnly}
  />
);

const ExclusionNote = ({
  text = '',
  onChange = () => null,
  readOnly = false,
}) => (
  <Box
    sx={{
      padding: '16px 30px 30px',
      marginBottom: '20px',
      backgroundColor: white,
      border: '1px solid rgba(224, 224, 224, 1)',
    }}
  >
    <Typography>{i18next.t('exclusion-notes')}</Typography>
    <HeaderTextarea
      value={text}
      onChange={onChange}
      customStyles={{
        padding: '12px 10px 10px',
        borderRadius: '4px',
        marginTop: '4px',
      }}
      minRows={5}
      readOnly={readOnly}
    />
  </Box>
);

const Footer = ({
  programme = 0,
  setProgramme = () => null,
  total = 0,
  readOnly = false,
}) => (
  <Grid
    container
    sx={{
      backgroundColor: white,
      color: black,
      border: '1px solid rgba(224, 224, 224, 1)',
      borderBottom: 0,
      padding: '40px 30px 40px',
    }}
  >
    <Grid container item xs={8}>
      <Grid item xs={2} display="flex" alignItems="center">
        <Typography
          component="label"
          htmlFor="programme-weeks"
          sx={{ fontFamily: avantGardeGothicPRO, fontWeight: 'bold', mr: 1 }}
        >
          {i18next.t('programme-weeks')}
        </Typography>
      </Grid>
      <Grid item xs={10} display="flex" alignItems="center">
        <OutlinedInput
          id="programme-weeks"
          type="number"
          inputProps={{ min: 0, step: 1, sx: { p: 1 } }}
          onChange={setProgramme}
          placeholder="Eg: 2 Weeks"
          autoComplete="off"
          value={programme}
          sx={{ ...inputStyle, borderRadius: '4px', width: '50%', p: 0 }}
          readOnly={readOnly}
        />
      </Grid>
    </Grid>
    <Grid item xs={4} pl={5}>
      <Typography sx={{ fontFamily: avantGardeGothicPRO, fontWeight: 'bold' }}>
        {i18next.t('Total')}
      </Typography>
      <Typography sx={{ fontFamily: avantGardeGothicPRO, fontWeight: 'bold' }}>
        {parseCurrency(total, currencyConfig[i18next.t('currency')])}
      </Typography>
    </Grid>
  </Grid>
);

const FileUploaderTitle = ({ children }) => (
  <Grid
    sx={{
      fontSize: '20px',
      fontWeight: 'bold',
      mb: 2,
    }}
  >
    {children}
  </Grid>
);

const FileUploaderLabel = ({ children }) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
    }}
  >
    <UploadFileIcon sx={{ mr: 1 }} />
    <Box sx={hideLongText}>
      <Tooltip title={children}>
        <Box sx={hideLongText}>{children}</Box>
      </Tooltip>
    </Box>
  </Box>
);

export {
  SubmitQuoteHeader,
  HeaderTextarea,
  ExclusionNote,
  Footer,
  FileUploaderTitle,
  FileUploaderLabel,
};
