import React from 'react';
import PropTypes from 'prop-types';

const Img = ({ src, className, uniqueKey }) => (
  <img src={src} className={className} alt="" key={`${uniqueKey}-img`} />
);

Img.propTypes = {
  src: PropTypes.string.isRequired,
  className: PropTypes.string,
  uniqueKey: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

Img.defaultProps = {
  className: '',
  uniqueKey: '',
};

export default Img;
