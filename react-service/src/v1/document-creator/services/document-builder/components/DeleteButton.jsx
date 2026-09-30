import React from 'react';
import PropTypes from 'prop-types';
import IconButton from '@mui/material/IconButton';
import BinIcon from 'v1/global/public/images/svg/bin-icon.svg';

const DeleteButton = ({ handleClick }) => (
  <IconButton aria-label="delete" type="button" onClick={handleClick}>
    <BinIcon />
  </IconButton>
);

DeleteButton.propTypes = {
  handleClick: PropTypes.func.isRequired,
};

export default DeleteButton;
