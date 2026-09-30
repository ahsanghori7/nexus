import React from 'react';
import GreenButton from 'v1/global/components/general-ui/Buttons';
import WorkerImg from '../../../global/public/images/base64/worker';
import { SubcontractorModal } from './header';

const ShowButtonModal = ({ handleClick, onClick, content, children }) => (
  <GreenButton
    className="form-subcontractor-show-button"
    label={content || children}
    handleClick={handleClick}
    onClick={onClick}
  />
);

const EmptyData = ({ addData, regions, trades, accountData }) => (
  <div className="empty-data-container">
    <div className="empty-data">
      <img src={WorkerImg} alt="No contractors" className="no-data" />
      <small className="center no-messge-gray-label">Nothing to see here</small>
      <strong className="center no-messge-label">You have no contacts</strong>
      <small className="center no-messge-gray-label">
        Add subcontractors to create your supply chain
      </small>
      <SubcontractorModal
        addData={addData}
        regions={regions}
        trades={trades}
        accountData={accountData}
        title="Add Subcontractor"
        subtitle="Complete the remaining empty fields"
        showButtonModal={ShowButtonModal}
      />
    </div>
  </div>
);

export default EmptyData;
