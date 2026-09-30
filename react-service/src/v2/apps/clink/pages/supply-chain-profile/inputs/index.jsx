import React from 'react';
import i18next from 'v2/helpers/i18n';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { CONSTANTS } from 'clink-components';
import Money from 'v2/apps/shared/components/prequalification/v2/form/Money';
import { Box } from '@mui/material';

const { prosperBoxGreen } = CONSTANTS.colors.prosper;
const { white, black, lightPeriwinkle } = CONSTANTS.colors.general;
const { proxima_nova1, proxima_nova2, avantGardeGothicPRO } = CONSTANTS.fonts;

const fontSize = { xs: '12px', sm: '15px' };
const fontSizeIcon = { xs: '14px', sm: '18px' };

const InputWithAdornment = ({
  adornment = '2021',
  value,
  name,
  half = false,
  register = () => {},
  errors,
  handleBlur = () => {},
  disabled = true,
  context = 'clink',
  isMoney = false,
  country,
}) => {
  const font =
    context && context === BASE_DIRS.V2.PROSPER
      ? avantGardeGothicPRO
      : `${proxima_nova1}, ${proxima_nova2}`;
  const Input = isMoney ? Money : OutlinedInput;
  const countryCurrency =
    country?.code?.includes('NZ') || country?.code?.includes('AUS')
      ? i18next.t('dollar')
      : i18next.t('currency');

  const extraMoneyProps = isMoney
    ? {
        extraAdornment: (
          <Box
            sx={{
              color: 'rgba(0,0,0,0.6)',
              position: 'absolute',
              fontWeight: 600,
              fontSize: '1rem',
              lineHeight: '1.5',
              top: '10px',
              left: '150px',
            }}
          >
            {i18next.t('currency')}
          </Box>
        ),
        register,
      }
    : {};

  return (
    <FormControl
      sx={{
        py: '4px',
        px: { xs: 0, sm: 1 },
        flexBasis: { xs: '100%', lg: half ? '50%' : '33%' },
        boxSizing: 'border-box',
        '&:nth-of-type(3n + 2)': { px: { lg: 2 } },
      }}
      variant="outlined"
    >
      <Input
        disabled={disabled}
        value={
          (!value || Number(value) === 0 || String(value).trim() === '') &&
          isMoney
            ? i18next.t('not-provided')
            : value
        }
        name={name}
        errors={errors}
        onBlur={handleBlur}
        adornment={adornment}
        {...extraMoneyProps}
        sx={{
          position: 'relative',
          fontFamily: `${font} !important`,
          fontSize,
          height: '32px',
          pl: 0,
          fontWeight: 'bold',
          borderRadius: '3px',
          backgroundColor: white,
          '& .MuiInputBase-input.Mui-disabled': {
            WebkitTextFillColor: black,
            fontSize,
            fontFamily: `${font} !important`,
          },
          '&.MuiInputAdornment-root': {
            maxHeight: 'unset',
          },
          '& .MuiOutlinedInput-input': { textAlign: 'center', pr: 0 },
          '&.Mui-disabled': {
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: prosperBoxGreen,
            },
          },
        }}
        startAdornment={
          <InputAdornment
            position="start"
            sx={{
              height: '32px',
              minWidth: { xs: '72px', sm: '100px' },
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: prosperBoxGreen,
              borderTopLeftRadius: '3px',
              borderBottomLeftRadius: '3px',
              position: 'relative',
              '&.MuiInputAdornment-root': {
                maxHeight: 'unset',
                minWidth: '130px !important',
              },
              '& .MuiTypography-root': {
                color: white,
                fontSize: fontSizeIcon,
                fontFamily: `${font} !important`,
                fontWeight: 'bold',
                marginTop:
                  context && context === BASE_DIRS.V2.PROSPER ? '8px' : '0',
              },
              '&:after': {
                content: `"${countryCurrency}"`,
                position: 'absolute',
                right: '-20px',
                fontSize: fontSizeIcon,
                color: prosperBoxGreen,
              },
            }}
          >
            {adornment}
          </InputAdornment>
        }
      />
    </FormControl>
  );
};

const SimpleInput = ({ value, context = 'clink' }) => {
  const font =
    context && context === BASE_DIRS.V2.PROSPER
      ? avantGardeGothicPRO
      : `${proxima_nova1}, ${proxima_nova2}`;
  return (
    <FormControl
      sx={{
        py: '4px',
        px: 1,
        flexBasis: { xs: '100%', lg: '33%' },
        boxSizing: 'border-box',
        '&:nth-of-type(3n + 2)': { px: { lg: 2 } },
      }}
      variant="outlined"
    >
      <Tooltip
        title={<Typography sx={{ fontSize: fontSizeIcon }}>{value}</Typography>}
        arrow
        sx={{
          '& .MuiTooltip-tooltip': {
            fontSize: { xs: '16px!important', sm: '18px!important' },
          },
        }}
      >
        <OutlinedInput
          disabled
          defaultValue={value}
          sx={{
            fontFamily: `${font} !important`,
            fontSize: fontSizeIcon,
            height: '32px',
            pl: 0,
            backgroundColor: white,
            borderRadius: '3px',
            '& .MuiInputBase-input.Mui-disabled': {
              WebkitTextFillColor: black,
              fontSize: fontSizeIcon,
              fontFamily: `${font}!important`,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            },
            '& .MuiOutlinedInput-input': { pl: 3 },
            '&.Mui-disabled': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: lightPeriwinkle,
              },
            },
          }}
        />
      </Tooltip>
    </FormControl>
  );
};

export { InputWithAdornment, SimpleInput };
