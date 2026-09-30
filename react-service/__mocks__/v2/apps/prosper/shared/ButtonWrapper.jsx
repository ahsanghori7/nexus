import React from 'react';

const ButtonWrapper = ({
  children,
  handleClick = () => {},
  id,
  className,
  ...props
}) => (
  <button
    onClick={handleClick}
    id={id}
    className={className}
    data-testid="button-wrapper-mock"
    {...props}
  >
    {children}
  </button>
);

export default ButtonWrapper;
