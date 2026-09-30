import React from 'react';
import TableTooltip from './TableTooltip';

const highlightTooltip = (row) => {
  const { hasNewChanges, tooltipText = '' } = row;
  return hasNewChanges ? (
    <TableTooltip
      content={<b style={{ color: 'red' }}>* </b>}
      title={<b>{tooltipText}</b>}
    />
  ) : null;
};

export default highlightTooltip;
