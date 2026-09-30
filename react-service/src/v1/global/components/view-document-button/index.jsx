import React from 'react';
import IconView from '../../public/images/svg/icon-view.svg';

const transformLabel = {
  orders: 'order',
  tenders: 'tender',
};

const ViewDocumentButton = (viewDocProps) => {
  const { click, type } = viewDocProps;
  return (
    <div className="action-item">
      <div className="action-tooltip tooltip-view">
        View {transformLabel[type]} document
      </div>
      <button type="button" onClick={click}>
        <IconView />
      </button>
    </div>
  );
};

export default ViewDocumentButton;
