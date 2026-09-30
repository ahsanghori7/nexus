import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Loading from 'v2/apps/shared/components/Loading';
import { CONSTANTS } from 'clink-components';
import { useContext } from 'hooks/context';
import { connect } from 'react-redux';
import Section from './Section';
import { getDocumentsInputs } from './common';

const { SilverSand } = CONSTANTS.colors.prosper;
const ANZ_REGIONS = ['NZ', 'AUS'];

const Documents = ({
  aid,
  prequalification,
  subcontractor,
  contextType,
  dispatch,
}) => {
  const isProsper = contextType === 'prosper';
  const { documents, statusPreq } = prequalification;

  const context = useContext(contextType);
  const { actions } = context;

  const [showOtherOptionForAll, setShowOtherOptionForAll] = useState(false);

  useEffect(() => {
    if (
      subcontractor &&
      subcontractor.country &&
      subcontractor.country.code &&
      ANZ_REGIONS.includes(subcontractor.country.code)
    ) {
      setShowOtherOptionForAll(true);
    }
  }, [subcontractor]);

  const handleSubmit = (submitData) => {
    if (!isProsper) return Promise.resolve();
    return dispatch(actions.postPrequalFile_V2({ aid, ...submitData })).then(
      () => dispatch(actions.fetchPrequalification_V2(aid)),
    );
  };

  const handleRemove = (id) => {
    if (!isProsper) return Promise.resolve();
    return dispatch(actions.deletePrequalificationSection_V2({ id, aid })).then(
      () => dispatch(actions.fetchPrequalification_V2(aid)),
    );
  };

  const customCerts =
    (prequalification && prequalification['custom-certificate']) || [];
  return (
    <Box>
      <Loading status={statusPreq.message} />
      {!statusPreq.message &&
        Object.keys(documents).map((typeDocument, index) => {
          const documentInputs = getDocumentsInputs(typeDocument);
          let data = prequalification[typeDocument] || [];
          if (typeDocument === 'accreditation' && customCerts.length) {
            data = [...data, ...customCerts];
          }
          return (
            Boolean(documentInputs) && (
              <div key={typeDocument}>
                <Section
                  aid={aid}
                  type={typeDocument}
                  documentInputs={documentInputs}
                  data={data}
                  showOtherOptionForAll={showOtherOptionForAll}
                  sectionData={documents[typeDocument]}
                  handleSubmit={handleSubmit}
                  handleRemove={handleRemove}
                />
                {index !== Object.keys(documents).length && (
                  <Divider
                    variant="inset"
                    sx={{ margin: '30px 0', color: SilverSand }}
                  />
                )}
              </div>
            )
          );
        })}
    </Box>
  );
};

const mapStateToProps = (state) => ({
  prequalification: state.prequalificationV2,
  subcontractor: state.subcontractor,
});

export default connect(mapStateToProps)(Documents);
