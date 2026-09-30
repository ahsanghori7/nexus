import React, { useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { CONSTANTS } from 'clink-components';
import 'react-lazy-load-image-component/src/effects/blur.css';

const { specialistLogo } = CONSTANTS.s3;

const LazyImage = (props) => {
  const { src: srcProps, ...rest } = props;
  const [src, setSrc] = useState(srcProps);
  const handleError = () => setSrc(specialistLogo);
  return (
    <LazyLoadImage effect="blur" {...rest} src={src} onError={handleError} />
  );
};

export default LazyImage;
