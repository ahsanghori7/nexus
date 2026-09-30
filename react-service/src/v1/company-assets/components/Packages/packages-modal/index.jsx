import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from 'v1/global/components/modal/v2';
import Button from '@mui/material/Button';
import Content from './Content';

const OpenModalButton = ({ handleClick, label }) => (
  <Button color="success" variant="contained" onClick={handleClick}>
    {label}
  </Button>
);

OpenModalButton.propTypes = {
  handleClick: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

const returnButton = (label) => {
  const ButtonComponent = ({ handleClick }) => (
    <OpenModalButton handleClick={handleClick} label={label} />
  );

  ButtonComponent.propTypes = {
    handleClick: PropTypes.func.isRequired,
  };

  return ButtonComponent;
};

const PackageModal = ({
  renameTemplate,
  label = '',
  addTemplate,
  templates,
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <Modal
      title="Create new package template"
      subtitle="Enter name for the new scope of works template."
      showClose={false}
      ShowButton={returnButton(label)}
      className="modal-create-package"
      render={(modalProps) => {
        const { setShow } = modalProps;
        return (
          <Content
            setShow={setShow}
            renameTemplate={renameTemplate}
            error={error}
            loading={loading}
            setError={setError}
            setLoading={setLoading}
            addTemplate={addTemplate}
            templates={templates}
          />
        );
      }}
    />
  );
};

PackageModal.propTypes = {
  renameTemplate: PropTypes.func,
  label: PropTypes.string,
  addTemplate: PropTypes.func.isRequired,
  templates: PropTypes.array.isRequired,
};

export default PackageModal;
export { OpenModalButton, returnButton };
