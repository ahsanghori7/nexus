import React from 'react';
import { useContext } from 'hooks/context';
import MenuItem from '@mui/material/MenuItem';
import i18next from 'v2/helpers/i18n';
import { connect } from 'react-redux';

const DefaultButton = ({ handleClick, label = i18next.t('send-enquiry') }) => (
  <MenuItem onClick={handleClick}>{label}</MenuItem>
);

const EnquiryProModal = ({
  pid,
  tid,
  tenderAddendum,
  title = i18next.t('send-enquiry'),
  subcontractors,
  dispatch,
  packageData,
}) => {
  const context = useContext('clink');
  const { actions } = context;

  const handleOpen = () => {
    const hasDocument = packageData?.has_document;
    const hasTenderAddendum = packageData?.has_tender_addendum;
    const packageName = packageData?.label;

    dispatch(
      actions.setOpenContactsModal({
        pid,
        tid,
        tenderAddendum,
        subcontractors,
        hasDocument,
        hasTenderAddendum,
        packageName,
      }),
    );
  };

  return <DefaultButton handleClick={handleOpen} label={title} />;
};

export default connect()(EnquiryProModal);
