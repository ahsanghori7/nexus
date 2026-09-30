import React from 'react';
import ConfirmModal, {
  Content as ContentModal,
} from 'v2/apps/shared/components/confirm-modal/v2';

const Confirm = ({ open, setOpen, handleConfirm }) => {
  return (
    <ConfirmModal
      id="delete-team-member"
      openModal={open}
      handleClose={() => setOpen(false)}
    >
      <ContentModal
        title="confirm-deleting-team-member"
        cancel="cancel"
        confirm="confirm"
        description={'confirm-deleting-team-member-desc'}
        handleCancel={() => setOpen(false)}
        handleAccept={handleConfirm}
      />
    </ConfirmModal>
  );
};

export default Confirm;
