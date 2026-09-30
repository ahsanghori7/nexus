import React from 'react';
import Modal from '../../../../modal';
import GreenButton from '../../../../general-ui/Buttons';
import Content from './Content';

const OpenModalButton = (props) => {
  const { handleClick, ...rest } = props;
  return (
    <GreenButton
      {...rest}
      outline
      onClick={handleClick}
      label="Add new category"
      block
      className="add-category"
    />
  );
};

const OpenButton = ({ handleClick }) => (
  <OpenModalButton handleClick={handleClick} />
);

const AddDropzoneModal = ({
  handleSetDropzone,
  fieldName,
  value,
  setFieldValue,
}) => {
  return (
    <Modal
      title="Add new category"
      subtitle="Please name your new category"
      className="clink-form add-category-modal"
      ShowButton={OpenButton}
      render={(modalProps) => {
        const { setShow } = modalProps;
        return (
          <Content
            handleSetDropzone={handleSetDropzone}
            setShow={setShow}
            fieldName={fieldName}
            value={value}
            setFieldValue={setFieldValue}
          />
        );
      }}
    />
  );
};

export default AddDropzoneModal;
