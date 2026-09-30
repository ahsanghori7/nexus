import Button from '@mui/material/Button';
import React from 'react';


const ButtonWrapper = ({ handleClick = () => null, ...rest }) => {
  // Destructure to remove handleClick, then forward the rest
  return <Button {...rest} handleClick={handleClick} />;
};

export default ButtonWrapper;
