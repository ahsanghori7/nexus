import React, { useState, useEffect } from 'react';
import { makeStyles } from '@mui/styles';
import DOMPurify from 'dompurify';
import { CONSTANTS, HOOKS } from 'clink-components';

const { midGrey } = CONSTANTS.colors.prosper;
const { MD_SCREEN, SM_SCREEN } = CONSTANTS.dimensions;
const { useWindowDimensions } = HOOKS;

const getSize = (width) => {
  let newSize = '16px';
  if (width < MD_SCREEN) {
    newSize = '14px';
  }
  if (width < SM_SCREEN) {
    newSize = '12px';
  }
  return newSize;
};

const Placeholder = ({ children, right, left, title = false }) => {
  const [dimensions] = useState(useWindowDimensions());
  const [fontSize, setFontSize] = useState(getSize(dimensions.width));

  const usePlaceholderStyles = makeStyles(() => ({
    placeholder: () => ({
      color: midGrey,
      '-webkit-text-fill-color': midGrey,
      fontWeight: 200,
      textAlign: (right && 'right') || (left && 'left') || null,
      fontSize,
      '& > b': {
        fontWeight: '600 !important',
      },
    }),
  }));
  const classes = usePlaceholderStyles();

  useEffect(() => {
    const newSize = getSize(dimensions.width);
    if (fontSize !== newSize) {
      setFontSize(newSize);
    }
  }, [dimensions, fontSize]);

  let props = {};
  if (title) {
    props = {
      'data-i18n': '[html]content.body',
      dangerouslySetInnerHTML: {
        __html: DOMPurify.sanitize(title),
      },
    };
  } else {
    props = { children };
  }
  return (
    <div className={classes.placeholder} {...props}>
      {children}
    </div>
  );
};

export default Placeholder;
