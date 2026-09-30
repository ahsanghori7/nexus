import React from 'react';
import InstructionsList from 'v2/apps/clink/pages/shared/instruction-list';

const InstructionsVariations = ({ contextType = 'clink' }) => (
  <InstructionsList contextType={contextType} />
);

export default InstructionsVariations;
