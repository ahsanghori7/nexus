import React from 'react';
import { Form } from 'react-bootstrap';

const FieldHolder = React.forwardRef((props, ref) => {
  const { className, children, ...rest } = props;
  return (
    <Form.Group
      className={`cl-12 field-holder ${className}`}
      {...rest}
      ref={ref}
    >
      {children}
    </Form.Group>
  );
});

export default FieldHolder;
