import React from 'react';
import { useTranslation } from 'react-i18next';
import Link from '@mui/material/Link';
import ConfirmModal, {
  Content as ContentModal,
} from 'v2/apps/shared/components/confirm-modal/v2';
import { getUrl } from 'v2/helpers/url';

const Unlocked = ({ setOpen = () => null, open = false, reduceInfoToken }) => {
  const { t } = useTranslation();
  return (
    <ConfirmModal
      id="lock-container-modal-2"
      openModal={open}
      handleClose={() => setOpen()}
    >
      <ContentModal
        title="project-unlocked"
        confirm="close"
        description="project-unlocked-text"
        extraDescription={
          <Link href={getUrl('prosper', '/resources')}>
            {t('enquiries-quotes').toLocaleLowerCase()}
          </Link>
        }
        handleAccept={() => {
          reduceInfoToken();
          setOpen();
        }}
        fullWidth
      />
    </ConfirmModal>
  );
};

export default Unlocked;
