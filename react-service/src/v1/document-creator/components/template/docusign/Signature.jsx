import * as React from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Icon from '@mui/material/Icon';
import { CONSTANTS } from 'clink-components';
import AngleDownIcon from '../../../../global/public/images/svg/angle-down.svg';

const { proxima_nova } = CONSTANTS.fonts;
const { clinkLightPurple } = CONSTANTS.colors.general;

const inputStyle = {
  maxHeight: '40px',
  border: `1px solid ${clinkLightPurple}`,
  borderRadius: '4px',
  fontFamily: proxima_nova,
};
// style fix to remove the white space on the left of the select because of missing label
const fieldsetStyle = {
  '& fieldset': {
    '& > legend': {
      width: '0',
    },
  },
};

const AngleDown = (props) => <Icon component={AngleDownIcon} {...props} />;

const EDITABLE_STATUS = 'Draft';
export default function Signature({ useSignature, status = EDITABLE_STATUS }) {
  const [signature, setSignature] = useSignature;

  return (
    <Box sx={{ minWidth: 244 }} p={4} pt={2} pb={2}>
      <FormControl fullWidth sx={fieldsetStyle}>
        <Select
          sx={inputStyle}
          value={signature}
          onChange={setSignature}
          label="Signature"
          labelId="Signature-label"
          displayEmpty
          inputProps={{
            'aria-label': 'Without label',
            readOnly: status !== EDITABLE_STATUS,
            'data-testid': 'document-creator-signature-mode-select',
          }}
          IconComponent={AngleDown}
        >
          <MenuItem value="wet">Wet Signature</MenuItem>
          <MenuItem value="docusign">E-Signature (DocuSign)</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
