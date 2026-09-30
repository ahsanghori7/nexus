import React from 'react';
import Button from 'react-bootstrap/Button';
import { ConfirmAlert } from '../../../../global/components/clink-alert';
import ProjectService from '../../../services/project';

const assignAllOptions = (interestsCount, handleClick) => {
  return {
    title: (
      <>
        Are you sure you want to add <b>{interestsCount} subcontractors</b>?
      </>
    ),
    message: 'This will add each interest in their respective package.',
    handleClick: () => handleClick(),
  };
};

const AssignAll = ({ interests, handleClick }) => (
  <ConfirmAlert
    Component={Button}
    props={{
      variant: 'success',
      type: 'button',
      children: 'Assign All',
    }}
    options={assignAllOptions(interests.length, handleClick)}
  />
);

const service = new ProjectService();

const SubHead = ({ interests, pid, callback }) => {
  const handleClick = () => {
    const params = {
      pid,
      status: 'accepted',
      type: 'Interest',
    };
    return service.bulkUpdateProjectHistory(params, interests, callback);
  };
  return (
    <div data-testid="subcontractors-header" className="d-flex sub-head p-1 pl-2">
      <div className="sub-head-text mr-4">
        <span className="font-weight-bold">You have interest from</span>
        <h4 className="font-weight-bold">{interests.length} subcontractors</h4>
      </div>
      <div className="sub-head-btn">
        <AssignAll interests={interests} handleClick={handleClick} />
      </div>
    </div>
  );
};

export default SubHead;
