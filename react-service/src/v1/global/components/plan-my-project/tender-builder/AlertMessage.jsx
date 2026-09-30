import React from 'react';
import { Alert } from 'react-bootstrap';

const AlertMessage = ({ show, closeMessage }) => {
  return (
    show && (
      <Alert
        variant="warning"
        className="tender-builder-message"
        onClose={closeMessage}
        dismissible
      >
        <p>
          Our system has analysed your project files and identified the
          following <b>Trades</b>. Here you can remove or add more <b>Trades</b>
          . Once your have all your desired <b>Trades</b> click the Next Step
          button to start creating your <b>Packages</b>.
        </p>
      </Alert>
    )
  );
};

export default AlertMessage;
