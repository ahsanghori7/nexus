import React from 'react';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';

const GreenButton = ({
  className = '',
  label = 'Add',
  handleClick = null,
  onClick = null,
  plusIcon = true,
  outline = false,
  type = 'button',
  disabled = false,
  loading = null,
  ...rest
}) => (
  <Button
    onClick={handleClick || onClick}
    className={`green-button ${className}`}
    type={type}
    variant={outline ? 'outline-success' : 'success'}
    disabled={disabled}
    {...rest}
  >
    {plusIcon && <FontAwesomeIcon icon={faPlus} />}
    {loading && (
      <>
        <Spinner
          as="span"
          animation="border"
          size="sm"
          role="status"
          aria-hidden="true"
          data-testid="loading-spinner"
        />
        &nbsp;
      </>
    )}
    {label}
  </Button>
);

const CloseButton = ({
  setShow = () => null,
  onClick = () => null,
  closeText = 'No, go back',
  variant = 'outline-dark',
}) => (
  <Button
    onClick={() => {
      onClick();
      setShow(false);
    }}
    type="button"
    variant={variant}
  >
    {closeText}
  </Button>
);

const TextButton = ({
  handleClick = () => null,
  text = false,
  children = 'Text of the button here',
  type = 'button',
  className = '',
}) => (
  <button
    type={type}
    onClick={handleClick}
    className={`text-button ${className}`}
  >
    {text || children}
  </button>
);

export default GreenButton;
export { CloseButton, TextButton };
