import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Loading from './Loading';
import Container from './layout/panel/Container';
import { InfoBox, HelpBox } from './InfoBoxes';

const Wrapper = ({
  header,
  leftContent,
  error,
  loading,
  helpText,
  ratio = { left: 8, right: 4 },
  companyAssets = false,
}) => (
  <>
    {' '}
    {error && (
      <Alert variant="danger">
        An error occurred while fetching the form data.
      </Alert>
    )}
    {loading && <Loading />}
    {!loading && (
      <Container
        containerClass="company-assets-wrapper"
        titleHeader={header}
        panelLeft={leftContent}
        panelRightTitle={<HelpBox companyAssets={companyAssets} />}
        panelRight={
          <InfoBox infoText={helpText} companyAssets={companyAssets} />
        }
        {...ratio}
      />
    )}
  </>
);

export default Wrapper;
