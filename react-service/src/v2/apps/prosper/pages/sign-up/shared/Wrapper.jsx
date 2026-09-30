import React, { useEffect, useState } from 'react';
import { CONSTANTS, HOOKS } from 'clink-components';

const { useWindowDimensions } = HOOKS;
const { MD_SCREEN, LG_SCREEN } = CONSTANTS.dimensions;

const mobile = {
  img: 24,
  mb: 5,
  inputMb: 2,
  subtitleSize: '14pt',
  titleSize: '24pt',
  noWrap: 'inherit',
  bottomMt: 7,
};
const desktop = {
  img: 32,
  mb: 7,
  inputMb: 3,
  subtitleSize: '18px',
  titleSize: '36px',
  noWrap: 'nowrap',
  bottomMt: 5,
};

const Wrapper = ({ Component, ...rest }) => {
  const dimensions = useWindowDimensions();
  const [styles, setStyles] = useState(desktop);

  useEffect(() => {
    if (dimensions.width < MD_SCREEN && styles.img !== mobile.img) {
      setStyles(mobile);
    }
    if (dimensions.width > LG_SCREEN && styles.img !== desktop.img) {
      setStyles(desktop);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions]);

  return <Component styles={styles} {...rest} />;
};

export default Wrapper;
