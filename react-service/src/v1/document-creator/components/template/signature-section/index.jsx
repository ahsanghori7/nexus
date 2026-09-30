import React from 'react';
import { connect } from 'react-redux';
import flag from 'v2/helpers/flags';
import Section from 'v1/document-creator/components/template/docusign/Section';
import EnvelopeBox from './EnvelopeBox';

const SignatureSection = ({ meta, useSignature, status, clinkAccount }) => {
  return meta?.signatory ? (
    <>
      <Section useSignature={useSignature} status={status} />
      {flag('FEATURES') && clinkAccount && (
        <EnvelopeBox info={clinkAccount} status={status} />
      )}
    </>
  ) : null;
};

const mapStateToProps = (state) => {
  return {
    clinkAccount: state.clinkAccount,
  };
};

export default connect(mapStateToProps)(SignatureSection);
