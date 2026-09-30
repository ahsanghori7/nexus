import React from 'react';
import InstructionsList from 'v2/apps/clink/pages/shared/instruction-list';

const NCR = ({ contextType = 'clink' }) => (
  <InstructionsList contextType={contextType} type="ncr" />
);

export default NCR;
