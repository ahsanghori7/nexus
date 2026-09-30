import React from 'react';
import PropTypes from 'prop-types';
import ConfirmModal from 'v1/global/components/ConfirmModal';
import DeleteButton from './DeleteButton';

const DeleteConfirmationModal = ({
  section,
  uniqueKey,
  handleUpdateAttendance = () => null,
  fullData,
  field = 'description',
  data,
  did,
}) => (
  <ConfirmModal
    data={data}
    title={`Are you sure want to delete this ${section ? 'section' : 'row'}?`}
    subtitle={`${
      section ? 'This will remove the section and all of its subitems. ' : ''
    }This action will not be reversible.`}
    key={`${uniqueKey}-modal`}
    OpenModal={DeleteButton}
    handleSubmit={(modalProps) => {
      if (data) {
        let content = [];
        if (section) {
          let foundSectionToRemove = false;
          [...fullData].forEach((i) => {
            if (
              !foundSectionToRemove &&
              Number(i.id) === Number(data.id) &&
              i[field] === data[field]
            ) {
              foundSectionToRemove = true;
              return;
            }

            if (!foundSectionToRemove) {
              content = [...content, i];
            }

            if (i.title && foundSectionToRemove) {
              foundSectionToRemove = false;
              content = [...content, i];
            }
          });
        } else {
          content = [...fullData].filter(
            (i) => Number(i.id) !== Number(data.id) && i[field] !== data[field],
          );
        }

        if (modalProps && modalProps.setShow) {
          modalProps.setShow(false);
        }

        handleUpdateAttendance(did, content);
      }
    }}
  />
);

DeleteConfirmationModal.propTypes = {
  section: PropTypes.bool,
  uniqueKey: PropTypes.string.isRequired,
  handleUpdateAttendance: PropTypes.func,
  fullData: PropTypes.array.isRequired,
  data: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.string,
  }),
  did: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

DeleteConfirmationModal.defaultProps = {
  section: false,
  handleUpdateAttendance: () => null,
  data: null,
  did: null,
};

export default DeleteConfirmationModal;
