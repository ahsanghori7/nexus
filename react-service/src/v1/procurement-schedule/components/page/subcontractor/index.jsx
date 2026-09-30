import React from 'react';
import Panel from '../../../../global/components/layout/panel';
import ListOfSubcontractors from './List';

const Subcontractors = (props) => {
  const { interests, pid, init, slug } = props;
  return (
    <Panel data-testid="subcontractors-interests-panel" className="mt-4 mb-4 subcontractor-panel">
      <ListOfSubcontractors
        interests={interests}
        pid={pid}
        callback={init}
        slug={slug}
      />
    </Panel>
  );
};

export default Subcontractors;
