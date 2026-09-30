import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useContext } from 'v2/hooks/context';
import SupplyChainContainer from './container';

const clinkInit = (id, dispatch, actions) => {
  if (id) {
    dispatch(actions.getPrequalification_V2(id));
    dispatch(actions.getCompanyProfile({ id }));
  }
};
const prosperInit = (id, dispatch, actions) => {
  dispatch(actions.fetchPrequalification_V2(id));
  dispatch(actions.fetchCompany({ id }));
};

const contextConfig = {
  clink: clinkInit,
  prosper: prosperInit,
};

const SupplyChain = ({
  contextType = 'clink',
  dispatch,
  company,
  subcontractor,
  prequalificationV2,
}) => {
  const params = useParams();
  const { id } = params;
  const context = useContext(contextType);
  const { actions } = context;
  const aid = subcontractor && subcontractor.accountId;

  const { documents } = prequalificationV2;

  useEffect(() => {
    if (contextType === 'clink') {
      dispatch(actions.getPrequalificationSections());
    } else if (contextType === 'prosper') {
      dispatch(actions.fetchPrequalificationSections());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subcontractor.accountId]);

  useEffect(() => {
    if (documents && Object.keys(documents).length) {
      contextConfig[contextType](id || aid, dispatch, actions);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents]);

  return (
    <SupplyChainContainer
      aid={id}
      id={id}
      contextType={contextType}
      prequalification={prequalificationV2}
      company={company}
    />
  );
};

const mapStateToProps = (state) => {
  return {
    company: state.company,
    prequalificationV2: state.prequalificationV2,
    subcontractor: state.subcontractor,
  };
};

export default connect(mapStateToProps)(SupplyChain);
