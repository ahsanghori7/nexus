import React from 'react';
import { confirmAlert } from 'react-confirm-alert';
import { AlertUI } from './UI';

const defaultOptions = (options) => {
  /* eslint no-alert: "off" */
  const {
    title = 'Confirm to submit',
    message = 'Are you sure to do this.',
    handleClick = null,
    acceptLabel = 'Yes',
    cancelLabel = 'No',
    className = '',
  } = options;
  return {
    overlayClassName: `overlay-react-confirm-alert ${className}`,
    customUI: ({ onClose }) => {
      const click = handleClick
        ? () => {
            onClose();
            if (handleClick) {
              handleClick();
            }
          }
        : null;
      return (
        <AlertUI
          title={title}
          message={message}
          handleCancel={onClose}
          handleSubmit={click}
          acceptLabel={acceptLabel}
          cancelLabel={cancelLabel}
        />
      );
    },
  };
};

const ConfirmAlert = ({ Component, props, options = {} }) => {
  const func = () => confirmAlert(defaultOptions(options));
  const { children, ...rest } = props;
  return (
    <Component {...rest} onClick={func}>
      {children}
    </Component>
  );
};

export default ConfirmAlert;
