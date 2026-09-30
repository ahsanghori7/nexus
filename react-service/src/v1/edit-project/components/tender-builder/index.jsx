import React from 'react';
import { connect } from 'react-redux';
import 'v1/global';
import 'v1/edit-project/public/styles/index.scss';
import TenderBuilder from 'v1/global/components/plan-my-project/tender-builder';
import Loading from 'v1/global/components/Loading';

const TenderBuilderPage = ({ projectData, slug }) => {
  const { id } = projectData;
  return (
    <TenderBuilder pid={id} slug={slug} />
  );
};

const Wrapper = (props) => {
  const { projectData } = props;
  if (!projectData || (projectData && !projectData.id)) {
    return <Loading />;
  }
  return (
    <TenderBuilderPage {...props} slug={projectData.slug} />
  );
};

const mapStateToProps = (state) => ({
  projectData: state.project.data,
});

export default connect(mapStateToProps)(Wrapper);
