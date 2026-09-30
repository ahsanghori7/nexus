import * as React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { CONSTANTS } from 'clink-components';
import { getAddress } from 'v2/helpers/data';

const { SilverSand } = CONSTANTS.colors.prosper;

const SelectListItem = ({
  sx = {
    border: `1px solid ${SilverSand}`,
    borderRadius: '5px',
  },
  onClick = () => null,
  primary = '',
  secondary = '',
}) => (
  <ListItem disablePadding sx={sx}>
    <ListItemButton onClick={onClick}>
      <ListItemText primary={primary} secondary={secondary} />
    </ListItemButton>
  </ListItem>
);
const SelectList = ({ options = [], sx = {}, handleClick = () => null }) => (
  <List
    sx={{
      position: 'absolute',
      backgroundColor: 'white',
      zIndex: 1,
      width: '100%',
      maxHeight: '200px',
      overflow: 'auto',
      boxShadow: '0px 5px 5px #00000029',
      paddingTop: 0,
      paddingBottom: 0,
      ...sx,
    }}
  >
    {options.map((opt) => {
      const { label, address, number } = opt;
      const addressValue = getAddress(address);
      const onClick = () => handleClick(opt);
      return (
        <SelectListItem
          onClick={onClick}
          primary={`${label} [${number}]`}
          secondary={addressValue}
          key={`${label}-${addressValue}`}
        />
      );
    })}
  </List>
);

export default SelectList;
