import React, { useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import Modal from '../../../../global/components/modal';
import GreenButton from '../../../../global/components/general-ui/Buttons';
import Content from './Content';

const OpenModalButton = ({ handleClick, label }) => {
  return (
    <GreenButton
      variant="success"
      onClick={handleClick}
      label={label}
      plusIcon={false}
    />
  );
};

const OpenRenameModalButton = ({ handleClick }) => {
  return <Dropdown.Item onClick={handleClick}>Rename folder</Dropdown.Item>;
};

const CategoryModal = ({
  addFolder,
  renameFolder,
  sidemodal = false,
  label = '',
  category = null,
}) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line react/no-unstable-nested-components
  let OpenButton = ({ handleClick }) => (
    <OpenModalButton handleClick={handleClick} label={label} />
  );
  if (category) {
    // eslint-disable-next-line react/no-unstable-nested-components
    OpenButton = ({ handleClick }) => (
      <OpenRenameModalButton handleClick={handleClick} />
    );
  }

  const title = category ? 'Rename this folder' : 'Create new folder';

  return (
    <Modal
      title={title}
      subtitle="Choose a name for this folder"
      showClose={!loading}
      ShowButton={OpenButton}
      backdrop={sidemodal ? 'static' : true}
      render={(modalProps) => {
        const { setShow } = modalProps;
        return (
          <Content
            setShow={setShow}
            addFolder={addFolder}
            renameFolder={renameFolder}
            category={category}
            error={error}
            loading={loading}
            setError={setError}
            setLoading={setLoading}
          />
        );
      }}
    />
  );
};

export default CategoryModal;
