import React from 'react';
import { FormControl, Select as SelectMui, MenuItem } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FormHelperText from '@mui/material/FormHelperText';
import { CONSTANTS } from 'clink-components';
import { MuiSubtitle } from 'v2/apps/shared/components/company-v2/Mui.styled';

const { SilverSand } = CONSTANTS.colors.prosper;

const IconComponent = () => <ExpandMoreIcon />;

const Select = ({
  name,
  label = '',
  register,
  errors,
  options = [],
  readOnly = false,
  defaultValue = '',
  handleChange = () => null,
}) => (
  <FormControl
    sx={{
      '& .MuiSvgIcon-root': {
        fontSize: '30px',
        marginRight: '2px',
        zIndex: 1,
        position: 'absolute',
        right: 0,
      },
      '& .MuiInputBase-input': { zIndex: 2 },
    }}
    fullWidth
    error={!!errors[name]}
  >
    {Boolean(label) && <MuiSubtitle>{label}</MuiSubtitle>}
    <SelectMui
      {...register(name, { required: true })}
      IconComponent={IconComponent}
      defaultValue={defaultValue}
      onChange={handleChange}
      inputProps={{ readOnly }}
      MenuProps={{
        sx: {
          '& .MuiPaper-root ': {
            minWidth: { md: '384px!important' },
            '& .MuiList-root': {
              pt: 0,
              pb: 0,

              '& .MuiMenuItem-root': {
                fontSize: '14px',
                fontWeight: 300,
                borderBottom: '1px solid',
                borderColor: SilverSand,
                height: '48px',
                '&:last-of-type': {
                  borderBottom: 'none',
                },
              },
            },
          },
        },
      }}
    >
      {options.map((o) => (
        <MenuItem key={o.id} value={o.value} disabled={o.disabled}>
          {o.label}
        </MenuItem>
      ))}
    </SelectMui>
    {errors[name] && <FormHelperText>Required</FormHelperText>}
  </FormControl>
);

export default Select;
