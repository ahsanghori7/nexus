import React, { useEffect } from 'react';
import PrequalificationV2 from 'v2/apps/prosper/pages/prequalification_v2';
import { useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';

function Prequalification(props) {
  const params = useParams();
  const { dispatch, contextType, documents } = props;

  const context = useContext(contextType);
  const { actions } = context;
  const { accountId } = params;

  // TODO: Backend to be implemented for fetching prequalification sections
  useEffect(() => {
    dispatch(actions.fetchPrequalificationSections());
  }, [dispatch, actions]);

  useEffect(() => {
    // Uncomment the following line if you want to fetch prequalification sections
    if (documents && Object.keys(documents).length) {
      const dispatchPreqData = () =>
        dispatch(actions.fetchPrequalification_V2(accountId));
      dispatchPreqData();
    }
  }, [dispatch, actions, accountId, documents]);

  return <PrequalificationV2 contextType="admin" />;
}

const mapStateToProps = (state) => ({
  documents: state?.prequalificationV2?.documents,
});

export default connect(mapStateToProps)(Prequalification);
