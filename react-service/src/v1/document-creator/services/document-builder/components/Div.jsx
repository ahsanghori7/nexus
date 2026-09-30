import React from 'react';
import PropTypes from 'prop-types';

const Div = ({ uniqueKey, inputRef, ...rest }) => (
  /* eslint no-param-reassign: "off" */
  <div
    {...rest}
    key={`${uniqueKey}-div`}
    ref={(el) => {
      inputRef[`${uniqueKey}-div`] = el;
      return true;
    }}
  />
);

Div.propTypes = {
  uniqueKey: PropTypes.string.isRequired,
  inputRef: PropTypes.object.isRequired,
};

export default Div;
