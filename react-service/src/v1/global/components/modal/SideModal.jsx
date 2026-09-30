import React from 'react';
import PropTypes from 'prop-types';
import Modal from './index';

const SideModal = (props) => {
  const { title, className, dialogClassName, position, children, ...rest } =
    props;
  return (
    <Modal
      title={title}
      className={`${position}${className && ` ${className}`}`}
      dialogClassName={dialogClassName}
      {...rest}
    />
  );
};

SideModal.defaultProps = {
  title: 'Modal',
  className: 'sidemodal',
  dialogClassName: '',
  position: 'right',
};

SideModal.propTypes = {
  title: PropTypes.string,
  className: PropTypes.string,
  dialogClassName: PropTypes.string,
  position: PropTypes.oneOf(['left', 'right']),
};

export default SideModal;
