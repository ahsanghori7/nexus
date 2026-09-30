import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Modal from '../../../../modal';
import FormBody from './FormBody';

const publishLabel = 'Publish to Marketplace';
const PublishModalButton = ({
  sx = {},
  variant = 'contained',
  color = 'primary',
  handleClick,
  disabled = false,
  label = publishLabel,
  ...rest
}) => {
  return (
    <Button
      sx={sx}
      color={color}
      variant={variant}
      type="button"
      disabled={disabled}
      onClick={handleClick}
      {...rest}
    >
      {label}
    </Button>
  );
};

const subtitleContent = (
  <p className="alert-subtitle">
    Are you sure you want to publish this package to the marketplace?
  </p>
);

const successContent = (
  <p className="success-subtitle">
    Your package has been published to the marketplace, we will let you know
    when a subcontractor is interested.
  </p>
);

const PublishModal = ({
  projectIsValid,
  pid,
  tid = 0,
  openProjectsDashboard,
  sx = null,
  color = 'primary',
}) => {
  const [formSubmitted, setFormSubmitted] = useState(false);
  // eslint-disable-next-line react/no-unstable-nested-components
  const OpenButton = ({ handleClick }) => (
    <PublishModalButton
      sx={sx}
      handleClick={handleClick}
      disabled={projectIsValid}
      color={color}
    />
  );
  // eslint-disable-next-line react/no-unstable-nested-components
  const Form = (props) => (
    <FormBody
      {...props}
      isPS={sx}
      pid={pid}
      tid={tid}
      formSubmitted={formSubmitted}
      setFormSubmitted={setFormSubmitted}
      openProjectsDashboard={openProjectsDashboard}
    />
  );
  const subtitle = formSubmitted ? successContent : subtitleContent;
  const title = formSubmitted ? 'Congratulations' : publishLabel;
  return (
    <Modal
      title={title}
      className="publish-subcontractors-modal"
      subtitle={subtitle}
      ShowButton={OpenButton}
      render={Form}
      showClose={false}
    />
  );
};

export default PublishModal;
export { PublishModalButton };
