import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Fade from '@mui/material/Fade';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  const handleScroll = () => {
    if (window.scrollY > 100) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <Fade in={isVisible}>
      <Button
        id="scroll-to-top"
        onClick={handleClick}
        variant="contained"
        color="primary"
        sx={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 1000,
          minWidth: '40px',
          width: '40px',
          height: '40px',
        }}
      >
        <KeyboardArrowUpIcon />
      </Button>
    </Fade>
  );
};

export default ScrollToTop;
