import React from 'react';
import Modal from '../../../../global/components/modal';
import GreenButton from '../../../../global/components/general-ui/Buttons';
import Content from './Content';

const OpenModalButton = ({ handleClick, label }) => {
  return (
    <GreenButton
      variant="success"
      className="archived-modal-btn"
      onClick={handleClick}
      label={label}
      plusIcon={false}
    />
  );
};

const OpenButton = ({ handleClick }) => (
  <OpenModalButton handleClick={handleClick} />
);

const ArchivedModal = ({ project, onHide, sidemodal }) => {
  return (
    <Modal
      title="Archived project"
      backdrop={sidemodal ? true : 'static'}
      beginningShow
      showClose={sidemodal}
      ShowButton={OpenButton}
      onHide={onHide}
      render={() => {
        return <Content project={project} sidemodal={sidemodal} />;
      }}
    />
  );
};

export default ArchivedModal;
