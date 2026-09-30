import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { connect } from 'react-redux';
import { useContext } from 'hooks/context';
import Container from 'v2/apps/prosper/pages/projects/Container.styled';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { CONSTANTS } from 'clink-components';
import { checkIfImageExists, validUrl, getQueryStringVars } from 'v2/helpers/url';
import { getAccountLogo } from 'v2/helpers/user';
import { renderHtmlInText } from 'v2/helpers/data';
import Contact from './contact';
import Company from './company';

const { iconContractor } = CONSTANTS.s3;

const CompanyProfile = ({
  contextType = BASE_DIRS.V2.PROSPER,
  account,
  dispatch,
}) => {
  const [imageExists, setImageExists] = useState(false);
  const params = useParams();
  const { account: clientData } = account;
  const context = useContext(contextType);
  const { actions } = context;

  useEffect(() => {
    const vars = getQueryStringVars();
    if (params && params.companyId && 'pid' in vars) {
      dispatch(
        actions.fetchCompanyData({
          id: params.companyId,
          pid: vars.pid,
        })
      );
      checkIfImageExists(getAccountLogo(params.companyId), (exists) => {
        setImageExists(exists);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const companyName = (clientData && clientData.name) || null;
  const description = (clientData && clientData.description) || null;
  const website =
    (clientData && clientData.website && validUrl(clientData.website)) || null;
  const loading = !clientData || (clientData && !clientData.id);
  return (
    <Paper
      sx={{
        marginTop: {
          lg: '-32px',
          md: '-32px',
          sm: 0,
          xs: 0,
        },
        paddingLeft: {
          md: 3,
          sm: 3,
          xs: 3,
        },
        paddingRight: {
          md: 3,
          sm: 3,
          xs: 3,
        },
        paddingBottom: {
          xs: 3,
        },
        '@media (min-width: 768px) and (max-width: 899px)': {
          // hack for fixing padding top in a specific range
          marginTop: '-32px',
        },
      }}
    >
      <Container>
        <Grid container sx={{ padding: '0 !important' }}>
          <Company
            companyName={companyName}
            src={
              imageExists ? getAccountLogo(params.companyId) : iconContractor
            }
            description={description ? renderHtmlInText(description) : null}
            website={website}
            loading={loading}
          />
          <Contact
            data={clientData}
            website={website}
            loading={loading}
            idContact={params && params.contactId ? params.contactId : 0}
          />
        </Grid>
      </Container>
    </Paper>
  );
};

const mapStateToProps = (state) => ({
  account: state.account,
});

export default connect(mapStateToProps)(CompanyProfile);
