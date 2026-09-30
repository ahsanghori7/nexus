import React from 'react';
import FieldError from '../FieldError';
import FieldLabel from '../FieldLabel';
import FieldHolder from '../FieldHolder';

const IconWrapper = ({ children }) => (
  <div className="icon-input-wrapper">{children}</div>
);

const FilemanagerField = (props) => {
  const {
    name,
    label = null,
    description = null,
    children,
    required = false,
    info = null,
    customErrors = {},
    triggerCustomErrors = false,
    labelError = false,
    fileManagerButton = () => null,
    testId = undefined,
  } = props;
  return (
    <FieldHolder data-testid={testId}>
      {label && (
        <FieldLabel
          name={name}
          triggerCustomErrors={triggerCustomErrors}
          labelError={labelError}
          customErrors={customErrors}
          label={label}
          info={info}
          required={required}
        >
          {children}
        </FieldLabel>
      )}
      {label && description}
      <IconWrapper>
        {fileManagerButton(false, true, name)}
      </IconWrapper>
      {!labelError && (
        <FieldError
          customErrors={customErrors}
          name={name}
          triggerCustomErrors={triggerCustomErrors}
        />
      )}
    </FieldHolder>
  );
};

export default FilemanagerField;
