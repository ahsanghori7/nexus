import BootstrapForm from 'react-bootstrap/Form';
import React, { useEffect } from 'react';
import { ErrorMessage } from 'formik';

const FieldError = ({ msg, setHasError = null }) => {

  useEffect(() => {
    if (setHasError) {
      setHasError(msg);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msg]);

  return (
    <BootstrapForm.Control.Feedback
      className="d-block clink-form__error"
      type="invalid"
    >
      {typeof msg === 'string' && msg}
      {typeof msg === 'object' && msg.label}
    </BootstrapForm.Control.Feedback>
  );
};

const ErrorContainer = ({
  triggerCustomErrors,
  customErrors,
  name,
  setHasError,
}) => (
  <>
    {!triggerCustomErrors && (
      <span className="clink-form__error-wrap">
        <ErrorMessage name={name}>
          {(msg) => <FieldError msg={msg} setHasError={setHasError} />}
        </ErrorMessage>
      </span>
    )}
    {triggerCustomErrors && customErrors[name] && (
      <span className="clink-form__error-wrap">
        <FieldError msg={customErrors[name]} />
      </span>
    )}
  </>
);

export default ErrorContainer;
