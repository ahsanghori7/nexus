import React, { useState } from 'react';
import Modal from '../../../../global/components/modal';
import GreenButton from '../../../../global/components/general-ui/Buttons';
import Content from './Content';

const OpenModalButton = ({ handleClick, label }) => (
  <GreenButton
    variant="success"
    onClick={handleClick}
    label={label}
    plusIcon={false}
  />
);

const PackageModal = ({
  renameTemplate,
  label = '',
  addTemplate,
  templates,
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const OpenButton = ({ handleClick }) => (
    <OpenModalButton handleClick={handleClick} label={label} />
  );

  return (
    <Modal
      title="Create new package template"
      subtitle="Enter name for the new scope of works template."
      showClose={false}
      ShowButton={OpenButton}
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

export default PackageModal;
