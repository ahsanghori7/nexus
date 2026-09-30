import React from 'react';
import { confirmAlert } from 'react-confirm-alert';
import { ResponseUI } from './UI';

const defaultOptions = (options) => {
  const { title, message, type, className } = options;
  const overlayClassName = `${className || ''} overlay-react-confirm-alert`;
  return {
    overlayClassName,
    customUI: ({ onClose }) => (
      <ResponseUI
        title={title}
        message={message}
        handleCancel={onClose}
        type={type}
      />
    ),
  };
};

const responseAlert = (options = {}) => confirmAlert(defaultOptions(options));

export default responseAlert;
