import React from 'react';
import Button from 'react-bootstrap/Button';
import { ConfirmAlert } from '../../../../../../../global/components/clink-alert';
import { SubmenuClose } from '../../../../../../public/images/icons/svg/supply_actions';

const deleteOptions = (subcontractor, handleClick) => {
  return {
    title: (
      <>
        Are you sure you want to remove the <b>{subcontractor}</b>?
      </>
    ),
    message: 'This will remove all this subcontractor from the supply chain.',
    handleClick: () => handleClick(),
  };
};

const Delete = (props) => {
  const { subcontractor, handleClick, ...rest } = props;
  return (
    <ConfirmAlert
      Component={Button}
      props={{
        size: 'sm',
        variant: 'outline-danger',
        type: 'button',
        children: <SubmenuClose {...rest} />,
      }}
      options={deleteOptions(subcontractor, handleClick)}
    />
  );
};

export default Delete;
