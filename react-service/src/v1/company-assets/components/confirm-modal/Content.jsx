import React from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';

const Content = ({ data, setShow, confirmLabel, callback }) => (
  <Form className="form-confirm-modal">
    <div className="button-container">
      <Button onClick={() => setShow(false)} variant="outline">
        No, go back
      </Button>
      <Button
        onClick={() => {
          if (callback) callback(data);
          setShow(false);
        }}
        variant="danger"
      >
        {confirmLabel}
      </Button>
    </div>
  </Form>
);
export default Content;
